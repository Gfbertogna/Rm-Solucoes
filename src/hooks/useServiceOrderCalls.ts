import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ServiceOrderCall } from '@/types/database';
import { toast } from 'sonner';

export const useServiceOrderCalls = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [calls, setCalls] = useState<ServiceOrderCall[]>([]);

  // Buscar todos os chamados (com número da OS)
  const fetchCalls = async () => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('service_order_calls')
        .select(
          `
          *,
          service_orders (
            order_number
          )
        `
        )
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setCalls(data as ServiceOrderCall[]);
    } catch (err) {
      toast.error('Erro ao buscar chamados');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Criar chamado
  const createCall = async (call: {
    service_order_id: string;
    reason: string;
    created_by: string; // ✅ tornado obrigatório
  }) => {
    try {
      const { error } = await supabase.from('service_order_calls').insert([call]);

      if (error) {
        throw error;
      }

      toast.success('Chamado criado com sucesso');
      await fetchCalls(); // ✅ garantir atualização da lista
    } catch (err) {
      toast.error('Erro ao criar chamado');
      console.error(err);
    }
  };

  // Marcar como resolvido
  const resolveCall = async (id: string, resolved_by: string) => {
    try {
      const { error } = await supabase
        .from('service_order_calls')
        .update({
          resolved: true,
          resolved_by,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast.success('Chamado resolvido');
      await fetchCalls(); // ✅ atualizar lista após resolução
    } catch (err) {
      toast.error('Erro ao resolver chamado');
      console.error(err);
    }
  };

  return {
    calls,
    isLoading,
    fetchCalls,
    createCall,
    resolveCall,
  };
};
