from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from decimal import Decimal

from .models import Payment, Transaction, Refund
from .serializers import (
    PaymentSerializer,
    CreatePaymentSerializer,
    RefundRequestSerializer,
    TransactionSerializer,
    RefundSerializer
)
from .razorpay_service import RazorpayService
from .stripe_service import StripeService
from .kafka_producer import publish_payment_event


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all().prefetch_related('transactions', 'refunds')
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'payment_method', 'gateway', 'order_id', 'customer_id']
    search_fields = ['gateway_transaction_id', 'customer_email']
    ordering_fields = ['created_at', 'amount']
    ordering = ['-created_at']

    def create(self, request, *args, **kwargs):
        serializer = CreatePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        
        # Create payment record
        payment = Payment.objects.create(
            order_id=data['order_id'],
            amount=data['amount'],
            currency=data.get('currency', 'INR'),
            payment_method=data['payment_method'],
            gateway=data['gateway'],
            customer_id=data['customer_id'],
            customer_email=data['customer_email'],
            customer_phone=data['customer_phone'],
            description=data.get('description', ''),
            status='pending'
        )
        
        # Publish event
        publish_payment_event('payment.initiated', {
            'payment_id': str(payment.id),
            'order_id': str(payment.order_id),
            'amount': float(payment.amount),
            'payment_method': payment.payment_method,
            'gateway': payment.gateway
        })
        
        response_data = PaymentSerializer(payment).data
        
        # Add gateway-specific data
        if payment.gateway == 'razorpay':
            razorpay = RazorpayService()
            order_data = razorpay.create_order(payment.amount, str(payment.order_id))
            response_data['gateway_data'] = order_data
        elif payment.gateway == 'stripe':
            stripe_service = StripeService()
            intent_data = stripe_service.create_payment_intent(payment.amount, str(payment.order_id))
            response_data['gateway_data'] = intent_data
        
        return Response(response_data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def refund(self, request, pk=None):
        payment = self.get_object()
        
        serializer = RefundRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        refund_amount = serializer.validated_data.get('amount', payment.amount)
        reason = serializer.validated_data['reason']
        
        if payment.status != 'completed':
            return Response(
                {'error': 'Only completed payments can be refunded'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create refund record
        refund = Refund.objects.create(
            payment=payment,
            amount=refund_amount,
            reason=reason,
            status='processing'
        )
        
        # Process refund through gateway
        try:
            if payment.gateway == 'razorpay':
                razorpay = RazorpayService()
                refund_data = razorpay.create_refund(payment.gateway_payment_id, refund_amount)
                refund.gateway_refund_id = refund_data.get('id')
                refund.status = 'completed'
            elif payment.gateway == 'stripe':
                stripe_service = StripeService()
                refund_data = stripe_service.create_refund(payment.gateway_payment_id, refund_amount)
                refund.gateway_refund_id = refund_data.get('id')
                refund.status = 'completed'
            
            refund.processed_at = timezone.now()
            refund.save()
            
            # Update payment
            payment.status = 'refunded'
            payment.refunded_at = timezone.now()
            payment.refund_amount = refund_amount
            payment.refund_reason = reason
            payment.save()
            
            # Publish event
            publish_payment_event('refund.processed', {
                'payment_id': str(payment.id),
                'refund_amount': float(refund_amount),
                'reason': reason
            })
            
        except Exception as e:
            refund.status = 'failed'
            refund.save()
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response(RefundSerializer(refund).data)

    @action(detail=False, methods=['get'], url_path='order/(?P<order_id>[^/.]+)')
    def order_payments(self, request, order_id=None):
        payments = self.queryset.filter(order_id=order_id)
        serializer = self.get_serializer(payments, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='razorpay/create-order')
    def razorpay_create_order(self, request):
        amount = request.data.get('amount')
        order_id = request.data.get('order_id')
        
        razorpay = RazorpayService()
        order_data = razorpay.create_order(amount, order_id)
        
        return Response(order_data)

    @action(detail=False, methods=['post'], url_path='razorpay/verify')
    def razorpay_verify(self, request):
        razorpay = RazorpayService()
        is_valid = razorpay.verify_payment(
            request.data.get('razorpay_order_id'),
            request.data.get('razorpay_payment_id'),
            request.data.get('razorpay_signature')
        )
        
        if is_valid:
            # Update payment status
            payment = Payment.objects.filter(
                gateway_order_id=request.data.get('razorpay_order_id')
            ).first()
            
            if payment:
                payment.status = 'completed'
                payment.gateway_payment_id = request.data.get('razorpay_payment_id')
                payment.gateway_signature = request.data.get('razorpay_signature')
                payment.paid_at = timezone.now()
                payment.save()
                
                publish_payment_event('payment.completed', {
                    'payment_id': str(payment.id),
                    'order_id': str(payment.order_id)
                })
            
            return Response({'status': 'success'})
        
        return Response({'status': 'failed'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='stripe/create-intent')
    def stripe_create_intent(self, request):
        amount = request.data.get('amount')
        order_id = request.data.get('order_id')
        
        stripe_service = StripeService()
        intent_data = stripe_service.create_payment_intent(amount, order_id)
        
        return Response(intent_data)

    @action(detail=False, methods=['post'], url_path='stripe/confirm')
    def stripe_confirm(self, request):
        payment_intent_id = request.data.get('payment_intent_id')
        
        stripe_service = StripeService()
        result = stripe_service.confirm_payment(payment_intent_id)
        
        if result.get('status') == 'succeeded':
            payment = Payment.objects.filter(
                gateway_transaction_id=payment_intent_id
            ).first()
            
            if payment:
                payment.status = 'completed'
                payment.paid_at = timezone.now()
                payment.save()
                
                publish_payment_event('payment.completed', {
                    'payment_id': str(payment.id),
                    'order_id': str(payment.order_id)
                })
            
            return Response({'status': 'success'})
        
        return Response({'status': 'failed'}, status=status.HTTP_400_BAD_REQUEST)
