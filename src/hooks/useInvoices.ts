import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useInvoices() {
  const fetchInvoices = async () => {
    const { data, error } = await supabase
      .from('invoices')
      .select('id, number, client_name, start_date, end_date, total_value')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  };

  const { data, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: fetchInvoices,
  });

  return {
    invoices: data || [],
    isLoading,
  };
}
