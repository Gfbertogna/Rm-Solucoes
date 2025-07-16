import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types/database';

export const useClients = () => {
  const fetchClients = async (): Promise<Client[]> => {
    const { data, error } = await supabase
      .from('clients')
      .select('id, name, contact, address')
      .order('name', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  };

  const {
    data: clients = [],
    isLoading,
    isError,
    error,
  } = useQuery<Client[], Error>({
    queryKey: ['clients'],
    queryFn: fetchClients,
  });

  return {
    clients,
    isLoading,
    isError,
    error,
  };
};
