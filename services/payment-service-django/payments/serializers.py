from rest_framework import serializers
from .models import Payment, Transaction, Refund


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = '__all__'
        read_only_fields = ('id', 'created_at')


class RefundSerializer(serializers.ModelSerializer):
    class Meta:
        model = Refund
        fields = '__all__'
        read_only_fields = ('id', 'created_at')


class PaymentSerializer(serializers.ModelSerializer):
    transactions = TransactionSerializer(many=True, read_only=True)
    refunds = RefundSerializer(many=True, read_only=True)

    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')


class CreatePaymentSerializer(serializers.Serializer):
    order_id = serializers.UUIDField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    currency = serializers.CharField(max_length=3, default='INR')
    payment_method = serializers.ChoiceField(choices=Payment.METHOD_CHOICES)
    gateway = serializers.ChoiceField(choices=Payment.GATEWAY_CHOICES)
    customer_id = serializers.UUIDField()
    customer_email = serializers.EmailField()
    customer_phone = serializers.CharField(max_length=20)
    description = serializers.CharField(required=False, allow_blank=True)


class RefundRequestSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    reason = serializers.CharField()
