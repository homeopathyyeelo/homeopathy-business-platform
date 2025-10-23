from rest_framework import serializers
from .models import Order, OrderItem, OrderStatusHistory, Invoice


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderStatusHistory
        fields = '__all__'
        read_only_fields = ('id', 'created_at')


class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    invoice = InvoiceSerializer(read_only=True)

    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ('id', 'order_number', 'created_at', 'updated_at')

    def create(self, validated_data):
        items_data = self.context.get('items', [])
        order = Order.objects.create(**validated_data)
        
        # Generate order number
        order.order_number = f"ORD-{order.created_at.strftime('%Y%m%d')}-{order.id.hex[:8].upper()}"
        order.save()

        # Create order items
        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)

        # Calculate total
        order.calculate_total()
        order.save()

        return order


class CreateOrderSerializer(serializers.Serializer):
    customer_id = serializers.UUIDField()
    customer_name = serializers.CharField(max_length=255)
    customer_email = serializers.EmailField()
    customer_phone = serializers.CharField(max_length=20)
    items = OrderItemSerializer(many=True)
    shipping_address = serializers.CharField()
    shipping_city = serializers.CharField(max_length=100)
    shipping_state = serializers.CharField(max_length=100)
    shipping_pincode = serializers.CharField(max_length=20)
    shipping_country = serializers.CharField(max_length=100, default='India')
    billing_address = serializers.CharField(required=False, allow_blank=True)
    billing_city = serializers.CharField(max_length=100, required=False, allow_blank=True)
    billing_state = serializers.CharField(max_length=100, required=False, allow_blank=True)
    billing_pincode = serializers.CharField(max_length=20, required=False, allow_blank=True)
    payment_method = serializers.CharField(max_length=50, required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)
