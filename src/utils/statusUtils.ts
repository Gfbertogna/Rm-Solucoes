
import { OrderStatus, Urgency } from '@/types';

export const getStatusLabel = (status: OrderStatus): string => {
  const statusLabels: Record<OrderStatus, string> = {
    received: 'Recebido / Em Análise',
    pending: 'Pendente',
    planning: 'Planejamento / Programação',
    production: 'Em Produção',
    quality_control: 'Inspeção / Controle de Qualidade',
    ready_for_shipment: 'Pronto para Expedição',
    in_transit: 'Em Transporte / Expedido',
    delivered: 'Entregue',
    invoiced: 'Faturado',
    completed: 'Finalizado',
    cancelled: 'Cancelado / Rejeitado'
  };
  return statusLabels[status];
};

export const getStatusColor = (status: OrderStatus): string => {
  const statusColors: Record<OrderStatus, string> = {
    received: 'bg-blue-100 text-blue-800',
    pending: 'bg-yellow-100 text-yellow-800',
    planning: 'bg-purple-100 text-purple-800',
    production: 'bg-orange-100 text-orange-800',
    quality_control: 'bg-indigo-100 text-indigo-800',
    ready_for_shipment: 'bg-cyan-100 text-cyan-800',
    in_transit: 'bg-teal-100 text-teal-800',
    delivered: 'bg-green-100 text-green-800',
    invoiced: 'bg-emerald-100 text-emerald-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800'
  };
  return statusColors[status];
};

export const getUrgencyLabel = (urgency: Urgency): string => {
  const urgencyLabels: Record<Urgency, string> = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta'
  };
  return urgencyLabels[urgency];
};

export const getUrgencyColor = (urgency: Urgency): string => {
  const urgencyColors: Record<Urgency, string> = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800'
  };
  return urgencyColors[urgency];
};
