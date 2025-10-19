from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal
import uuid


class Payment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]

    METHOD_CHOICES = [
        ('card', 'Card'),
        ('upi', 'UPI'),
        ('netbanking', 'Net Banking'),
        ('wallet', 'Wallet'),
        ('cash', 'Cash'),
        ('cod', 'Cash on Delivery'),
    ]

    GATEWAY_CHOICES = [
        ('razorpay', 'Razorpay'),
        ('stripe', 'Stripe'),
        ('paypal', 'PayPal'),
        ('manual', 'Manual'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_id = models.UUIDField(db_index=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.00'))])
    currency = models.CharField(max_length=3, default='INR')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', db_index=True)
    payment_method = models.CharField(max_length=20, choices=METHOD_CHOICES)
    gateway = models.CharField(max_length=20, choices=GATEWAY_CHOICES)
    
    # Gateway specific fields
    gateway_transaction_id = models.CharField(max_length=255, null=True, blank=True, db_index=True)
    gateway_payment_id = models.CharField(max_length=255, null=True, blank=True)
    gateway_order_id = models.CharField(max_length=255, null=True, blank=True)
    gateway_signature = models.CharField(max_length=255, null=True, blank=True)
    
    # Customer info
    customer_id = models.UUIDField(db_index=True)
    customer_email = models.EmailField()
    customer_phone = models.CharField(max_length=20)
    
    # Additional info
    description = models.TextField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    # Error handling
    error_code = models.CharField(max_length=50, null=True, blank=True)
    error_message = models.TextField(null=True, blank=True)
    
    # Timestamps
    paid_at = models.DateTimeField(null=True, blank=True)
    refunded_at = models.DateTimeField(null=True, blank=True)
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    refund_reason = models.TextField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payments'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['order_id', '-created_at']),
            models.Index(fields=['customer_id', '-created_at']),
            models.Index(fields=['gateway_transaction_id']),
        ]

    def __str__(self):
        return f"Payment {self.id} - {self.amount} {self.currency}"


class Transaction(models.Model):
    TYPE_CHOICES = [
        ('charge', 'Charge'),
        ('refund', 'Refund'),
        ('capture', 'Capture'),
        ('void', 'Void'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='transactions')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20)
    gateway_transaction_id = models.CharField(max_length=255, null=True, blank=True)
    response_data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'transactions'
        ordering = ['-created_at']

    def __str__(self):
        return f"Transaction {self.type} - {self.amount}"


class Refund(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='refunds')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    gateway_refund_id = models.CharField(max_length=255, null=True, blank=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'refunds'
        ordering = ['-created_at']

    def __str__(self):
        return f"Refund {self.id} - {self.amount}"
