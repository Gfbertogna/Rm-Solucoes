
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ServiceOrder, Profile } from '@/types/database';
import { toast } from 'sonner';

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
      // Gerar número da OS
      const { data: orderNumber } = await supabase.rpc('generate_order_number');
      
      const { data, error } = await supabase
        .from('service_orders')
        .insert({
          order_number: orderNumber,
          client_name: orderData.client_name || '',
          client_contact: orderData.client_contact || '',
          client_address: orderData.client_address || '',
          service_description: orderData.service_description || '',
          sale_value: orderData.sale_value,
          status: orderData.status || 'received',
          urgency: orderData.urgency || 'medium',
          assigned_worker_id: orderData.assigned_worker_id,
          deadline: orderData.deadline,
          client_id: orderData.client_id,
          opening_date: orderData.opening_date,
          created_by: orderData.created_by,
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
