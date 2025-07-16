import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ServiceOrder, Profile } from '@/types/database';
import { toast } from 'sonner';

const getNextOrderNumber = async (): Promise<string> => {
  const { data, error } = await supabase
    .from('service_orders')
    .select('order_number')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) throw new Error('Erro ao buscar última ordem de serviço');

  const lastOrderNumber = data?.[0]?.order_number || 'OS000';
  const lastNumber = parseInt(lastOrderNumber.replace('OS', ''), 10);
  const nextNumber = lastNumber + 1;

  return `OS${String(nextNumber).padStart(3, '0')}`;
};

export const useServiceOrders = () => {
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['service-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_orders')
        .select(`
          *,
          assigned_worker:profiles!assigned_worker_id(name),
          created_by_user:profiles!created_by(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data as (ServiceOrder & {
        assigned_worker?: { name: string };
        created_by_user?: { name: string };
      })[];
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: Partial<ServiceOrder>) => {
      const orderNumber = await getNextOrderNumber();

      const { data, error } = await supabase
        .from('service_orders')
        .insert({
          order_number: orderNumber,
          client_name: orderData.client_name || '',
          client_contact: orderData.client_contact || '',
          client_address: orderData.client_address || '',
          service_description: orderData.service_description || '',
          sale_value: orderData.sale_value || 0,
          status: 'pending', // ou o status inicial que você deseja
          urgency: orderData.urgency || 'medium',
          assigned_worker_id: orderData.assigned_worker_id,
          deadline: orderData.deadline,
          client_id: orderData.client_id,
          opening_date: orderData.opening_date || new Date().toISOString(),
          created_by: orderData.created_by,
          service_start_date: orderData.service_start_date || null, // se usar esse campo no filtro da fatura
          service_end_date: orderData.service_end_date || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
      toast.success('Ordem de serviço criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar ordem de serviço: ' + error.message);
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ServiceOrder> & { id: string }) => {
      const { data, error } = await supabase
        .from('service_orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
      toast.success('Ordem de serviço atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar ordem de serviço: ' + error.message);
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('service_orders')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
      toast.success('Ordem de serviço excluída com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir ordem de serviço: ' + error.message);
    },
  });

  return {
    orders,
    isLoading,
    createOrder: createOrderMutation.mutate,
    updateOrder: updateOrderMutation.mutate,
    deleteOrder: deleteOrderMutation.mutate,
    isCreating: createOrderMutation.isPending,
    isUpdating: updateOrderMutation.isPending,
    isDeleting: deleteOrderMutation.isPending,
  };
};

export const useWorkers = () => {
  const { data: workers = [] } = useQuery({
    queryKey: ['workers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, role')
        .eq('role', 'worker');

      if (error) throw error;
      return data as Profile[];
    },
  });

  return { workers };
};
