import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useReports } from '@/hooks/useReports';

interface EnhancedStatusChartProps {
  dateRange?: { from: Date; to: Date };
}

export const EnhancedStatusChart: React.FC<EnhancedStatusChartProps> = ({ dateRange }) => {
  const { statusStats } = useReports(dateRange);

  const formatStatusName = (status: string) => {
    const statusNames: { [key: string]: string } = {
      'received': 'Recebido',
      'pending': 'Pendente',
      'planning': 'Planejamento',
      'production': 'Produção',
      'quality_control': 'Controle Qualidade',
      'ready_for_shipment': 'Pronto p/ Envio',
      'in_transit': 'Em Trânsito',
      'delivered': 'Entregue',
      'invoiced': 'Faturado',
      'completed': 'Concluído',
      'cancelled': 'Cancelado',
    };
    return statusNames[status] || status;
  };

  const chartData = statusStats.map((stat: any) => ({
    status: formatStatusName(stat.status),
    count: stat.count,
    fill: stat.color,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow">
          <p className="font-semibold">{label}</p>
          <p className="text-blue-600">
            Quantidade: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status das Ordens de Serviço</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="status" 
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={12}
            />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="count" 
              name="Quantidade"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
