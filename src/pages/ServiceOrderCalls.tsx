import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ServiceOrderCall {
  id: string;
  service_order_id: string;
  reason: string;
  resolved: boolean;
  created_at: string;
  service_orders?: {
    order_number: string;
  };
}

const ServiceOrderCalls: React.FC = () => {
  const [calls, setCalls] = useState<ServiceOrderCall[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCalls = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('service_order_calls')
      .select(`
        *,
        service_orders (
          order_number
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar chamados:', error);
    } else {
      setCalls(data || []);
    }

    setLoading(false);
  };

  const resolveCall = async (id: string) => {
    const { error } = await supabase
      .from('service_order_calls')
      .update({ resolved: true })
      .eq('id', id);

    if (error) {
      console.error('Erro ao resolver chamado:', error);
    } else {
      await fetchCalls();
    }
  };

  useEffect(() => {
    fetchCalls();
  }, []);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-slate-800">Chamados de Ordens em Espera</h1>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-600">
          <Loader2 className="animate-spin" />
          Carregando chamados...
        </div>
      ) : calls.length === 0 ? (
        <p className="text-slate-600">Nenhum chamado em aberto.</p>
      ) : (
        calls.map((call) => (
          <Card key={call.id}>
            <CardHeader className="flex justify-between items-center">
              <div>
                <CardTitle>
                  OS #{call.service_orders?.order_number || call.service_order_id}
                </CardTitle>
                <p className="text-sm text-slate-600 mt-1">{call.reason}</p>
              </div>
              <Badge variant={call.resolved ? 'secondary' : 'default'}>
                {call.resolved ? 'Resolvido' : 'Em Aberto'}
              </Badge>
            </CardHeader>
            <CardContent className="flex justify-end">
              {!call.resolved && (
                <Button
                  variant="success"
                  className="gap-1"
                  onClick={() => resolveCall(call.id)}
                >
                  <CheckCircle size={16} />
                  Marcar como Resolvido
                </Button>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default ServiceOrderCalls;
