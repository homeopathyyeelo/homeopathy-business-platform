import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderServiceAPI, type Order, type CreateOrderRequest } from '@/lib/api';
import { toast } from 'sonner';

export function useOrders(page: number = 1, pageSize: number = 10, status?: string) {
  return useQuery({
    queryKey: ['orders', page, pageSize, status],
    queryFn: () => orderServiceAPI.getOrders(page, pageSize, status),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => orderServiceAPI.getOrder(id),
    enabled: !!id,
  });
}

export function useOrdersByCustomer(customerId: string) {
  return useQuery({
    queryKey: ['orders', 'customer', customerId],
    queryFn: () => orderServiceAPI.getOrdersByCustomer(customerId),
    enabled: !!customerId,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (order: CreateOrderRequest) => orderServiceAPI.createOrder(order),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success(`Order ${data.order_number} created successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to create order: ${error.message}`);
    },
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Order> }) =>
      orderServiceAPI.updateOrder(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', variables.id] });
      toast.success('Order updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update order: ${error.message}`);
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      orderServiceAPI.cancelOrder(id, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', variables.id] });
      toast.success('Order cancelled successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to cancel order: ${error.message}`);
    },
  });
}

export function useConfirmOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => orderServiceAPI.confirmOrder(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', data.id] });
      toast.success(`Order ${data.order_number} confirmed`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to confirm order: ${error.message}`);
    },
  });
}

export function useDownloadInvoice() {
  return useMutation({
    mutationFn: async (id: string) => {
      const blob = await orderServiceAPI.getInvoice(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast.success('Invoice downloaded successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to download invoice: ${error.message}`);
    },
  });
}
