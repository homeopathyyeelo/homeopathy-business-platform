import razorpay
import hmac
import hashlib
from django.conf import settings


class RazorpayService:
    def __init__(self):
        self.client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

    def create_order(self, amount, order_id):
        """Create Razorpay order"""
        amount_in_paise = int(float(amount) * 100)
        
        data = {
            'amount': amount_in_paise,
            'currency': 'INR',
            'receipt': f'order_{order_id}',
            'payment_capture': 1
        }
        
        order = self.client.order.create(data=data)
        return order

    def verify_payment(self, razorpay_order_id, razorpay_payment_id, razorpay_signature):
        """Verify Razorpay payment signature"""
        try:
            params_dict = {
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': razorpay_payment_id,
                'razorpay_signature': razorpay_signature
            }
            
            self.client.utility.verify_payment_signature(params_dict)
            return True
        except:
            return False

    def create_refund(self, payment_id, amount):
        """Create refund"""
        amount_in_paise = int(float(amount) * 100)
        
        refund = self.client.payment.refund(payment_id, amount_in_paise)
        return refund

    def fetch_payment(self, payment_id):
        """Fetch payment details"""
        return self.client.payment.fetch(payment_id)
