import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

interface ServiceOrder {
  id: string;
  order_number: string;
  sale_value: number;
  total_hours: number;
  service_start_date: string;
}

export function useServiceOrdersForInvoice(
  clientId: string,
  startDate: string,
  endDate: string
) {
  const fetchOrders = async (): Promise<ServiceOrder[]> => {
    // Buscar OSs no status 'to_invoice' e com período dentro de service_start_date
    const { data, error } = await supabase
      .from('service_orders')
      .select('id, order_number, sale_value, service_start_date')
      .eq('client_id', clientId)
      .eq('status', 'to_invoice')
      .gte('service_start_date', startDate)
      .lte('service_start_date', endDate);

    if (error) {
      console.error('Erro ao buscar OSs:', error.message);
      throw error;
    }

    // Para cada OS, buscar horas em task_time_logs
    const ordersWithHours = await Promise.all(
      (data || []).map(async (os) => {
        const { data: logs, error: logsError } = await supabase
          .from('task_time_logs')
          .select('hours_worked')
          .eq('service_order_id', os.id);

        if (logsError) {
          console.error(`Erro ao buscar logs da OS ${os.id}:`, logsError.message);
        }

        const total_hours =
          logs?.reduce((sum, log) => sum + (log.hours_worked || 0), 0) || 0;

        return {
          id: os.id,
          order_number: os.order_number,
          sale_value: os.sale_value || 0,
          total_hours,
          service_start_date: os.service_start_date,
        };
      })
    );

    return ordersWithHours;
  };

  const { data = [], isLoading } = useQuery<ServiceOrder[]>({
    queryKey: ['service-orders-invoice', clientId, startDate, endDate],
    queryFn: fetchOrders,
    enabled: !!clientId && !!startDate && !!endDate,
  });

  const totalValue = useMemo(
    () => data.reduce((sum, os) => sum + (os.sale_value || 0), 0),
    [data]
  );

  const totalTime = useMemo(
    () => data.reduce((sum, os) => sum + (os.total_hours || 0), 0),
    [data]
  );

  return {
    serviceOrders: data,
    totalValue,
    totalTime,
    isLoading,
  };
}
