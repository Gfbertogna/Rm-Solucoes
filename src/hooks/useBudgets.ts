
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Budget, BudgetItem } from '@/types/database';
import { toast } from 'sonner';

export const useBudgets = (filters?: {
  search?: string;
  status?: string;
  clientName?: string;
  dateFrom?: string;
  dateTo?: string;
}) => {
  const queryClient = useQueryClient();

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets', filters],
    queryFn: async () => {
      let query = supabase
        .from('budgets')
        .select(`
          *,
          budget_items(*),
          created_by_user:profiles!created_by(name)
        `)
        .order('created_at', { ascending: false });

      if (filters?.search) {
        query = query.or(`budget_number.ilike.%${filters.search}%,client_name.ilike.%${filters.search}%`);
      }

      if (filters?.status ) {
        query = query.eq('status', filters.status);
      }

      if (filters?.clientName) {
        query = query.ilike('client_name', `%${filters.clientName}%`);
      }

      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as (Budget & { 
        budget_items: BudgetItem[];
        created_by_user?: { name: string };
      })[];
    },
  });

  const createBudgetMutation = useMutation({
    mutationFn: async ({ budgetData, items }: { 
      budgetData: Partial<Budget>; 
      items: Partial<BudgetItem>[] 
    }) => {
      const { data: budgetNumber } = await supabase.rpc('generate_budget_number');
      
      const { data: budget, error: budgetError } = await supabase
        .from('budgets')
        .insert({
          budget_number: budgetNumber,
          client_name: budgetData.client_name || '',
          client_contact: budgetData.client_contact || '',
          client_address: budgetData.client_address || '',
          description: budgetData.description || '',
          total_value: budgetData.total_value || 0,
          valid_until: budgetData.valid_until,
          client_id: budgetData.client_id,
          created_by: budgetData.created_by,
          status: budgetData.status || 'draft',
        })
        .select()
        .single();

      if (budgetError) throw budgetError;

      if (items.length > 0) {
        const { error: itemsError } = await supabase
          .from('budget_items')
          .insert(
            items.map(item => ({
              budget_id: budget.id,
              service_name: item.service_name || '',
              description: item.description,
              quantity: item.quantity || 1,
              unit_price: item.unit_price || 0,
              total_price: item.total_price || 0,
              service_id: item.service_id,
            }))
          );

        if (itemsError) throw itemsError;
      }

      return budget;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast.success('Orçamento criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar orçamento: ' + error.message);
    },
  });

  const createOrderFromBudgetMutation = useMutation({
    mutationFn: async (budgetId: string) => {
      const { data: budget, error: budgetError } = await supabase
        .from('budgets')
        .select('*')
        .eq('id', budgetId)
        .single();

      if (budgetError) throw budgetError;

      const { data: orderNumber } = await supabase.rpc('generate_order_number');
      
      const { data: order, error: orderError } = await supabase
        .from('service_orders')
        .insert({
          order_number: orderNumber,
          client_name: budget.client_name,
          client_contact: budget.client_contact,
          client_address: budget.client_address,
          service_description: budget.description,
          sale_value: budget.total_value,
          status: 'received',
          urgency: 'medium',
          budget_id: budgetId,
          opening_date: new Date().toISOString().split('T')[0],
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Atualizar status do orçamento para aprovado
      await supabase
        .from('budgets')
        .update({ status: 'approved' })
        .eq('id', budgetId);

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
      toast.success('Ordem de serviço criada a partir do orçamento!');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar OS: ' + error.message);
    },
  });

  return {
    budgets,
    isLoading,
    createBudget: createBudgetMutation.mutate,
    createOrderFromBudget: createOrderFromBudgetMutation.mutate,
    isCreating: createBudgetMutation.isPending,
    isCreatingOrder: createOrderFromBudgetMutation.isPending,
  };
};
