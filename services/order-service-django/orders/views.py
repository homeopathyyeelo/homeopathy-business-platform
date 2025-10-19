from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.http import HttpResponse
from decimal import Decimal

from .models import Order, OrderItem, OrderStatusHistory, Invoice
from .serializers import (
    OrderSerializer, 
    CreateOrderSerializer, 
    OrderItemSerializer,
    OrderStatusHistorySerializer,
    InvoiceSerializer
)
from .kafka_producer import publish_order_event


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().prefetch_related('items', 'status_history')
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'payment_status', 'customer_id']
    search_fields = ['order_number', 'customer_name', 'customer_email']
    ordering_fields = ['created_at', 'total_amount']
    ordering = ['-created_at']

    def create(self, request, *args, **kwargs):
        serializer = CreateOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        items_data = data.pop('items')
        
        # Calculate totals
        subtotal = Decimal('0.00')
        for item in items_data:
            item_total = item['unit_price'] * item['quantity']
            item_tax = (item_total * item['tax_rate']) / 100
            item['tax_amount'] = item_tax
            item['total_price'] = item_total + item_tax - item.get('discount', Decimal('0.00'))
            subtotal += item['total_price']
        
        # Create order
        order = Order.objects.create(
            customer_id=data['customer_id'],
            customer_name=data['customer_name'],
            customer_email=data['customer_email'],
            customer_phone=data['customer_phone'],
            shipping_address=data['shipping_address'],
            shipping_city=data['shipping_city'],
            shipping_state=data['shipping_state'],
            shipping_pincode=data['shipping_pincode'],
            shipping_country=data.get('shipping_country', 'India'),
            billing_address=data.get('billing_address', ''),
            billing_city=data.get('billing_city', ''),
            billing_state=data.get('billing_state', ''),
            billing_pincode=data.get('billing_pincode', ''),
            payment_method=data.get('payment_method', ''),
            notes=data.get('notes', ''),
            subtotal=subtotal,
            status='pending',
            payment_status='pending'
        )
        
        # Generate order number
        order.order_number = f"ORD-{order.created_at.strftime('%Y%m%d')}-{str(order.id).split('-')[0].upper()}"
        order.calculate_total()
        order.save()
        
        # Create order items
        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
        
        # Create status history
        OrderStatusHistory.objects.create(
            order=order,
            from_status=None,
            to_status='pending',
            notes='Order created'
        )
        
        # Publish Kafka event
        publish_order_event('order.created', {
            'order_id': str(order.id),
            'order_number': order.order_number,
            'customer_id': str(order.customer_id),
            'total_amount': float(order.total_amount),
            'items_count': len(items_data)
        })
        
        serializer = OrderSerializer(order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        order = self.get_object()
        
        if order.status != 'pending':
            return Response(
                {'error': 'Only pending orders can be confirmed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        old_status = order.status
        order.status = 'confirmed'
        order.confirmed_at = timezone.now()
        order.save()
        
        OrderStatusHistory.objects.create(
            order=order,
            from_status=old_status,
            to_status='confirmed',
            notes='Order confirmed'
        )
        
        publish_order_event('order.confirmed', {
            'order_id': str(order.id),
            'order_number': order.order_number
        })
        
        serializer = OrderSerializer(order)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        order = self.get_object()
        reason = request.data.get('reason', '')
        
        if order.status in ['delivered', 'cancelled']:
            return Response(
                {'error': 'Cannot cancel this order'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        old_status = order.status
        order.status = 'cancelled'
        order.cancelled_at = timezone.now()
        order.save()
        
        OrderStatusHistory.objects.create(
            order=order,
            from_status=old_status,
            to_status='cancelled',
            notes=reason or 'Order cancelled'
        )
        
        publish_order_event('order.cancelled', {
            'order_id': str(order.id),
            'reason': reason
        })
        
        serializer = OrderSerializer(order)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def invoice(self, request, pk=None):
        order = self.get_object()
        
        # Get or create invoice
        invoice, created = Invoice.objects.get_or_create(
            order=order,
            defaults={
                'invoice_number': f"INV-{order.order_number}",
                'subtotal': order.subtotal,
                'tax_amount': order.tax_amount,
                'discount_amount': order.discount_amount,
                'total_amount': order.total_amount
            }
        )
        
        # Generate PDF (simplified)
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="invoice-{invoice.invoice_number}.pdf"'
        
        # TODO: Implement PDF generation
        response.write(b'PDF content here')
        
        return response

    @action(detail=False, methods=['get'], url_path='customer/(?P<customer_id>[^/.]+)')
    def customer_orders(self, request, customer_id=None):
        orders = self.queryset.filter(customer_id=customer_id)
        page = self.paginate_queryset(orders)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(orders, many=True)
        return Response(serializer.data)
