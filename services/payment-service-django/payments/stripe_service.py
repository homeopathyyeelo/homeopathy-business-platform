import stripe
from django.conf import settings


class StripeService:
    def __init__(self):
        stripe.api_key = settings.STRIPE_SECRET_KEY

    def create_payment_intent(self, amount, order_id):
        """Create Stripe payment intent"""
        amount_in_cents = int(float(amount) * 100)
        
        intent = stripe.PaymentIntent.create(
            amount=amount_in_cents,
            currency='inr',
            metadata={'order_id': order_id}
        )
        
        return {
            'client_secret': intent.client_secret,
            'payment_intent_id': intent.id
        }

    def confirm_payment(self, payment_intent_id):
        """Confirm payment intent"""
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        return {
            'status': intent.status,
            'amount': intent.amount / 100
        }

    def create_refund(self, payment_intent_id, amount):
        """Create refund"""
        amount_in_cents = int(float(amount) * 100)
        
        refund = stripe.Refund.create(
            payment_intent=payment_intent_id,
            amount=amount_in_cents
        )
        
        return {
            'id': refund.id,
            'status': refund.status
        }

    def retrieve_payment_intent(self, payment_intent_id):
        """Retrieve payment intent"""
        return stripe.PaymentIntent.retrieve(payment_intent_id)
