import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentServiceAPI, type Payment, type CreatePaymentRequest, type RefundRequest } from '@/lib/api';
import { toast } from 'sonner';

export function usePayments(page: number = 1, pageSize: number = 10, status?: string) {
  return useQuery({
    queryKey: ['payments', page, pageSize, status],
    queryFn: () => paymentServiceAPI.getPayments(page, pageSize, status),
  });
}

export function usePayment(id: string) {
  return useQuery({
    queryKey: ['payment', id],
    queryFn: () => paymentServiceAPI.getPayment(id),
    enabled: !!id,
  });
}

export function usePaymentsByOrder(orderId: string) {
  return useQuery({
    queryKey: ['payments', 'order', orderId],
    queryFn: () => paymentServiceAPI.getPaymentsByOrder(orderId),
    enabled: !!orderId,
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payment: CreatePaymentRequest) => paymentServiceAPI.createPayment(payment),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Payment initiated successfully');
      return data;
    },
    onError: (error: Error) => {
      toast.error(`Failed to create payment: ${error.message}`);
    },
  });
}

export function useRefundPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, refund }: { id: string; refund: RefundRequest }) =>
      paymentServiceAPI.refundPayment(id, refund),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment', variables.id] });
      toast.success('Payment refunded successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to refund payment: ${error.message}`);
    },
  });
}

// Razorpay Integration
export function useCreateRazorpayOrder() {
  return useMutation({
    mutationFn: ({ amount, orderId }: { amount: number; orderId: string }) =>
      paymentServiceAPI.createRazorpayOrder(amount, orderId),
    onError: (error: Error) => {
      toast.error(`Failed to create Razorpay order: ${error.message}`);
    },
  });
}

export function useVerifyRazorpayPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }) => paymentServiceAPI.verifyRazorpayPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Payment verified successfully');
    },
    onError: (error: Error) => {
      toast.error(`Payment verification failed: ${error.message}`);
    },
  });
}

// Stripe Integration
export function useCreateStripePaymentIntent() {
  return useMutation({
    mutationFn: ({ amount, orderId }: { amount: number; orderId: string }) =>
      paymentServiceAPI.createStripePaymentIntent(amount, orderId),
    onError: (error: Error) => {
      toast.error(`Failed to create Stripe payment intent: ${error.message}`);
    },
  });
}

export function useConfirmStripePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentIntentId: string) =>
      paymentServiceAPI.confirmStripePayment(paymentIntentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Payment confirmed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Payment confirmation failed: ${error.message}`);
    },
  });
}
