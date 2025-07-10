import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useReports } from '@/hooks/useReports';

interface OpenOrdersReportProps {
  dateRange?: { from: Date; to: Date };
}

export const OpenOrdersReport: React.FC<OpenOrdersReportProps> = ({ dateRange }) => {
  const { openServiceOrders, openServices } = useReports(dateRange);

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'received': 'bg-blue-100 text-blue-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'planning': 'bg-purple-100 text-purple-800',
      'production': 'bg-cyan-100 text-cyan-800',
      'quality_control': 'bg-orange-100 text-orange-800',
      'ready_for_shipment': 'bg-green-100 text-green-800',
      'in_transit': 'bg-indigo-100 text-indigo-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getUrgencyColor = (urgency: string) => {
    const colors: { [key: string]: string } = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-red-100 text-red-800',
    };
    return colors[urgency] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Ordens de Serviço em Aberto */}
      <Card>
        <CardHeader>
          <CardTitle>Ordens de Serviço em Aberto</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Urgência</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {openServiceOrders.map((order: any) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.order_number}</TableCell>
                  <TableCell>{order.client_name}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getUrgencyColor(order.urgency)}>
                      {order.urgency}
                    </Badge>
                  </TableCell>
                  <TableCell>{order.assigned_worker?.name || 'Não atribuído'}</TableCell>
                  <TableCell>
                    {order.deadline ? new Date(order.deadline).toLocaleDateString('pt-BR') : '-'}
                  </TableCell>
                  <TableCell>
                    {order.sale_value ? `R$ ${order.sale_value.toFixed(2)}` : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Serviços (Tarefas) em Aberto */}
      <Card>
        <CardHeader>
          <CardTitle>Serviços (Tarefas) em Aberto</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>OS</TableHead>
                <TableHead>Tarefa</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Horas Est.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {openServices.map((service: any) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.service_order.order_number}</TableCell>
                  <TableCell>{service.title}</TableCell>
                  <TableCell>{service.service_order.client_name}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(service.status)}>
                      {service.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getUrgencyColor(service.priority)}>
                      {service.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>{service.assigned_worker?.name || 'Não atribuído'}</TableCell>
                  <TableCell>
                    {service.deadline ? new Date(service.deadline).toLocaleDateString('pt-BR') : '-'}
                  </TableCell>
                  <TableCell>
                    {service.estimated_hours ? `${service.estimated_hours}h` : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};