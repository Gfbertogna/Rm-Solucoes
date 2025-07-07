
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, DollarSign, User, Phone, MapPin, Eye, Edit, Trash2 } from 'lucide-react';
import { ServiceOrder } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';

interface OrderCardProps {
  order: ServiceOrder & { 
    assigned_worker?: { name: string };
    created_by_user?: { name: string };
  };
  onView: (order: ServiceOrder & { 
    assigned_worker?: { name: string };
    created_by_user?: { name: string };
  }) => void;
  onEdit?: (order: ServiceOrder & { 
    assigned_worker?: { name: string };
    created_by_user?: { name: string };
  }) => void;
  onDelete?: (order: ServiceOrder & { 
    assigned_worker?: { name: string };
    created_by_user?: { name: string };
  }) => void;
}

const OrderCard = ({ order, onView, onEdit, onDelete }: OrderCardProps) => {
  const { profile } = useAuth();
  const [clickedBadge, setClickedBadge] = useState<string | null>(null);

  const isAdmin = profile?.role === 'admin';
  const isManager = profile?.role === 'manager';
  const canEdit = isAdmin || isManager;
  const canDelete = isAdmin;

  const getStatusLabel = (status: string) => {
    const statusMap = {
      'received': 'Recebido / Em Análise',
      'pending': 'Pendente',
      'planning': 'Planejamento',
      'production': 'Em Produção',
      'quality_control': 'Controle de Qualidade',
      'ready_for_shipment': 'Pronto para Envio',
      'in_transit': 'Em Trânsito',
      'delivered': 'Entregue',
      'invoiced': 'Faturado',
      'completed': 'Finalizado',
      'cancelled': 'Cancelado'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getUrgencyLabel = (urgency: string) => {
    const urgencyMap = {
      'low': 'Baixa',
      'medium': 'Média',
      'high': 'Alta'
    };
    return urgencyMap[urgency as keyof typeof urgencyMap] || urgency;
  };

  const getStatusColor = (status: string) => {
    const colorMap = {
      'received': 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      'pending': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
      'planning': 'bg-purple-100 text-purple-800 hover:bg-purple-200',
      'production': 'bg-orange-100 text-orange-800 hover:bg-orange-200',
      'quality_control': 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
      'ready_for_shipment': 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200',
      'in_transit': 'bg-pink-100 text-pink-800 hover:bg-pink-200',
      'delivered': 'bg-green-100 text-green-800 hover:bg-green-200',
      'invoiced': 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
      'completed': 'bg-green-100 text-green-800 hover:bg-green-200',
      'cancelled': 'bg-red-100 text-red-800 hover:bg-red-200'
    };
    return colorMap[status as keyof typeof colorMap] || 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  };

  const getUrgencyColor = (urgency: string) => {
    const colorMap = {
      'low': 'bg-green-100 text-green-800 hover:bg-green-200',
      'medium': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
      'high': 'bg-red-100 text-red-800 hover:bg-red-200'
    };
    return colorMap[urgency as keyof typeof colorMap] || 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  };

  const handleBadgeClick = (badgeType: 'status' | 'urgency') => {
    if (!canEdit || !onEdit) return;
    
    setClickedBadge(badgeType);
    setTimeout(() => setClickedBadge(null), 200);
    onEdit(order);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">
              OS {order.order_number}
            </CardTitle>
            <p className="text-sm text-slate-600 mt-1">
              {order.client_name}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Badge 
              className={`cursor-pointer transition-colors ${getStatusColor(order.status)} ${
                clickedBadge === 'status' ? 'scale-95' : ''
              } ${canEdit ? 'hover:scale-105' : ''}`}
              onClick={() => handleBadgeClick('status')}
              title={canEdit ? 'Clique para editar' : ''}
            >
              {getStatusLabel(order.status)}
            </Badge>
            <Badge 
              className={`cursor-pointer transition-colors ${getUrgencyColor(order.urgency)} ${
                clickedBadge === 'urgency' ? 'scale-95' : ''
              } ${canEdit ? 'hover:scale-105' : ''}`}
              onClick={() => handleBadgeClick('urgency')}
              title={canEdit ? 'Clique para editar' : ''}
            >
              {getUrgencyLabel(order.urgency)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Phone size={16} />
            <span>{order.client_contact}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin size={16} />
            <span className="line-clamp-1">{order.client_address}</span>
          </div>
        </div>

        <div className="bg-slate-50 p-3 rounded-md">
          <p className="text-sm line-clamp-3">{order.service_description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar size={16} />
            <span>{new Date(order.opening_date).toLocaleDateString('pt-BR')}</span>
          </div>
          {order.deadline && (
            <div className="flex items-center gap-2 text-slate-600">
              <Clock size={16} />
              <span>{new Date(order.deadline).toLocaleDateString('pt-BR')}</span>
            </div>
          )}
        </div>

        {(order.sale_value || order.assigned_worker) && (
          <div className="grid grid-cols-1 gap-2 text-sm">
            {order.sale_value && (
              <div className="flex items-center gap-2 text-slate-600">
                <DollarSign size={16} />
                <span>
                  {Number(order.sale_value).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  })}
                </span>
              </div>
            )}
            {order.assigned_worker && (
              <div className="flex items-center gap-2 text-slate-600">
                <User size={16} />
                <span>{order.assigned_worker.name}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(order)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver Detalhes
          </Button>
          
          {onEdit && canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(order)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          
          {onDelete && canDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(order)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderCard;
