import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TaskList } from '@/components/tasks/TaskList';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';


const TaskManagement = () => {
  const { serviceOrderId } = useParams();

  const { data: serviceOrder, isLoading, error } = useQuery({
    queryKey: ['service-order', serviceOrderId],
    queryFn: async () => {
      if (!serviceOrderId) throw new Error('ID da ordem de serviço não fornecido');
      
      const { data, error } = await supabase
        .from('service_orders')
        .select('*')
        .eq('id', serviceOrderId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!serviceOrderId,
  });

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="animate-spin" size={20} />
          <span>Carregando ordem de serviço...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-red-500">
              <AlertCircle size={48} className="mx-auto mb-4" />
              <p className="text-lg font-medium">Erro ao carregar ordem de serviço</p>
              <p className="text-sm mt-1">
                Não foi possível encontrar a ordem de serviço solicitada.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!serviceOrder) {
    return (
      <div className="p-6">
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-gray-500">
              <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Ordem de serviço não encontrada</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <TaskList
        serviceOrderId={serviceOrderId!}
        orderNumber={serviceOrder.order_number}
        clientName={serviceOrder.client_name}
      />
    </div>
  );
};

export default TaskManagement;