import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, DollarSign, Edit, Eye, Trash2, User, Clock, ListTodo } from 'lucide-react';
import { ServiceOrder } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ClientLogo from '@/components/ui/client-logo';

interface OrderCardProps {
  order: ServiceOrder & { assigned_worker?: { name: string } };
  onEdit: (order: ServiceOrder) => void;
  onDelete: (order: ServiceOrder) => void;
  onView: (order: ServiceOrder & { assigned_worker?: { name: string } }) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onEdit, onDelete, onView }) => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    const colorMap = {
      'received': 'bg-blue-100 text-blue-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'planning': 'bg-purple-100 text-purple-800',
      'production': 'bg-orange-100 text-orange-800',
      'quality_control': 'bg-pink-100 text-pink-800',
      'ready_for_shipment': 'bg-cyan-100 text-cyan-800',
      'in_transit': 'bg-indigo-100 text-indigo-800',
      'delivered': 'bg-teal-100 text-teal-800',
      'invoiced': 'bg-gray-100 text-gray-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colorMap[status as keyof typeof colorMap] || 'bg-gray-100 text-gray-800';
  };

  const getUrgencyColor = (urgency: string) => {
    const colorMap = {
      'low': 'text-green-500',
      'medium': 'text-yellow-500',
      'high': 'text-red-500'
    };
    return colorMap[urgency as keyof typeof colorMap] || 'text-gray-500';
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      received: 'Recebida',
      pending: 'Pendente',
      planning: 'Planejamento',
      production: 'Produção',
      quality_control: 'Controle de Qualidade',
      ready_for_shipment: 'Pronta p/ Envio',
      in_transit: 'Em Trânsito',
      delivered: 'Entregue',
      invoiced: 'Faturada',
      completed: 'Concluída',
      cancelled: 'Cancelada',
      on_hold: 'Em espera',
      stopped: 'Paralisada',
      ready_for_pickup: 'Aguardando retirada',
      awaiting_installation: 'Aguardando instalação',
      to_invoice: 'Faturar',
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getUrgencyText = (urgency: string) => {
    const urgencyMap = {
      'low': 'Baixa',
      'medium': 'Média',
      'high': 'Alta'
    };
    return urgencyMap[urgency as keyof typeof urgencyMap] || urgency;
  };

  const canEdit = profile && ['admin', 'manager'].includes(profile.role);
  const canDelete = profile && ['admin', 'manager'].includes(profile.role);

  const handleManageTasks = () => {
    navigate(`/tasks/${order.id}`);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <ClientLogo 
              clientName={order.client_name} 
              size="md"
            />
            <div>
              <h3 className="font-semibold text-lg text-slate-800">
                OS {order.order_number}
              </h3>
              <p className="text-slate-600 font-medium">{order.client_name}</p>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Badge className={getStatusColor(order.status)}>
              {getStatusText(order.status)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="bg-slate-50 p-3 rounded-md">
          <p className="text-sm line-clamp-3">{order.service_description}</p>
        </div>

        <div className="grid grid-cols-1 gap-2 text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar size={16} />
            <span>Abertura: {new Date(order.opening_date).toLocaleDateString('pt-BR')}</span>
          </div>
          
          {order.deadline && (
            <div className="flex items-center gap-2 text-slate-600">
              <Clock size={16} />
              <span>Prazo: {new Date(order.deadline).toLocaleDateString('pt-BR')}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-slate-600">
            <span className={`font-medium ${getUrgencyColor(order.urgency)}`}>
              Urgência: {getUrgencyText(order.urgency)}
            </span>
          </div>
          
          {order.assigned_worker?.name && (
            <div className="flex items-center gap-2 text-slate-600">
              <User size={16} />
              <span>Responsável: {order.assigned_worker.name}</span>
            </div>
          )}
          
          {order.sale_value && (
            <div className="flex items-center gap-2 text-slate-600">
              <DollarSign size={16} />
              <span>Valor: R$ {order.sale_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-2 border-t">
          <span className="text-xs text-slate-500">
            Criada em {new Date(order.created_at || '').toLocaleDateString('pt-BR')}
          </span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(order)}
              className="h-8 w-8 p-0"
            >
              <Eye size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManageTasks}
              className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700"
              title="Gerenciar Tarefas"
            >
              <ListTodo size={16} />
            </Button>
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(order)}
                className="h-8 w-8 p-0"
              >
                <Edit size={16} />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(order)}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
              >
                <Trash2 size={16} />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderCard;