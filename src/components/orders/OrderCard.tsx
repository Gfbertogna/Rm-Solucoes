// src/components/orders/OrderCard.tsx
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  DollarSign,
  Edit,
  Eye,
  Trash2,
  User,
  Clock,
  ListTodo,
  CheckCircle,
} from 'lucide-react';
import { ServiceOrder } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ClientLogo from '@/components/ui/client-logo';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { createInvoice } from '@/services/invoiceService';

interface OrderCardProps {
  order: ServiceOrder & { assigned_worker?: { name: string } };
  onEdit: (order: ServiceOrder) => void;
  onDelete: (order: ServiceOrder) => void;
  onView: (order: ServiceOrder & { assigned_worker?: { name: string } }) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onEdit, onDelete, onView }) => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const canEdit = profile && ['admin', 'manager'].includes(profile.role);
  const canDelete = profile && ['admin', 'manager'].includes(profile.role);

  const handleManageTasks = () => navigate(`/tasks/${order.id}`);

  const handleApproveQualityControl = async () => {
    const { error } = await supabase
      .from('service_orders')
      .update({ status: 'ready_for_pickup' })
      .eq('id', order.id);

    if (error) {
      toast.error('Erro ao aprovar controle de qualidade');
    } else {
      toast.success('Controle de qualidade aprovado! OS agora está Aguardando Retirada.');
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
    }
  };

  const handleMoveToAwaitingInstallation = async () => {
    const { error } = await supabase
      .from('service_orders')
      .update({ status: 'awaiting_installation' })
      .eq('id', order.id);

    if (error) {
      toast.error('Erro ao mover para Aguardando Instalação');
    } else {
      toast.success('OS movida para Aguardando Instalação.');
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
    }
  };

  const handleMoveToToInvoice = async () => {
    const { error } = await supabase
      .from('service_orders')
      .update({ status: 'to_invoice' })
      .eq('id', order.id);

    if (error) {
      toast.error('Erro ao marcar OS para faturamento manual.');
    } else {
      toast.success('OS marcada como "Faturar". Acesse a tela de Faturas.');
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
    }
  };

  const handleImmediateInvoice = async () => {
    if (!order.client_id || !order.client_name || !order.opening_date) {
      toast.error('Dados da OS incompletos para gerar fatura.');
      return;
    }

    const startDate = order.service_start_date || order.opening_date.split('T')[0];
    const endDate = new Date().toISOString().split('T')[0];

    const invoicePayload = {
      client_id: order.client_id,
      client_name: order.client_name,
      start_date: startDate,
      end_date: endDate,
      extras: [],
      orders: [
        {
          id: order.id,
          order_number: order.order_number,
          sale_value: order.sale_value || 0,
          total_hours: order.total_hours || 0,
        },
      ],
      total_value: order.sale_value || 0,
      total_time: order.total_hours || 0,
    };

    const { error } = await createInvoice(invoicePayload);

    if (error) {
      toast.error('Erro ao gerar fatura: ' + error.message);
      return;
    }

    await supabase
      .from('service_orders')
      .update({ 
        status: 'invoiced' })
      .eq('id', order.id);

    toast.success('Fatura gerada com sucesso!');
    queryClient.invalidateQueries({ queryKey: ['service-orders'] });
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
    navigate('/invoices');
  };

  const getStatusColor = (status: string) => ({
    received: 'bg-blue-100 text-blue-800',
    pending: 'bg-yellow-100 text-yellow-800',
    planning: 'bg-purple-100 text-purple-800',
    production: 'bg-orange-100 text-orange-800',
    quality_control: 'bg-pink-100 text-pink-800',
    ready_for_shipment: 'bg-cyan-100 text-cyan-800',
    in_transit: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-teal-100 text-teal-800',
    invoiced: 'bg-gray-100 text-gray-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    on_hold: 'bg-yellow-200 text-yellow-900',
    stopped: 'bg-red-200 text-red-900',
    ready_for_pickup: 'bg-lime-100 text-lime-800',
    awaiting_installation: 'bg-blue-100 text-blue-800',
    to_invoice: 'bg-gray-200 text-gray-900',
  }[status] || 'bg-gray-100 text-gray-800');

  const getStatusText = (status: string) => ({
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
    ready_for_pickup: 'Aguardando Retirada',
    awaiting_installation: 'Aguardando Instalação',
    to_invoice: 'Faturar',
    finalized: 'Finalizado',
  }[status] || status);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <ClientLogo clientName={order.client_name} size="md" />
            <div>
              <h3 className="font-semibold text-lg text-slate-800">OS {order.order_number}</h3>
              <p className="text-slate-600 font-medium">{order.client_name}</p>
            </div>
          </div>
          <Badge className={getStatusColor(order.status)}>{getStatusText(order.status)}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="bg-slate-50 p-3 rounded-md">
          <p className="text-sm line-clamp-3">{order.service_description}</p>
        </div>

        <div className="grid gap-2 text-sm">
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

          <div className="text-slate-600">
            Urgência:{' '}
            <span className="font-medium">
              {order.urgency === 'high' ? 'Alta' : order.urgency === 'medium' ? 'Média' : 'Baixa'}
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
              <span>
                Valor: R${' '}
                {order.sale_value.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          )}
        </div>

        {/* Ações baseadas no status */}
        {order.status === 'quality_control' && canEdit && (
          <div className="pt-2">
            <Button
              onClick={handleApproveQualityControl}
              className="bg-lime-600 hover:bg-lime-700 text-white"
            >
              <CheckCircle size={16} className="mr-2" />
              Aprovar Controle de Qualidade
            </Button>
          </div>
        )}

        {order.status === 'ready_for_pickup' && canEdit && (
          <div className="pt-2">
            <Button
              onClick={handleMoveToAwaitingInstallation}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <CheckCircle size={16} className="mr-2" />
              Confirmar Retirada / Agendar Instalação
            </Button>
          </div>
        )}

        {order.status === 'awaiting_installation' && canEdit && (
          <div className="pt-2 flex gap-2 flex-wrap">
            <Button
              onClick={handleMoveToToInvoice}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              <CheckCircle size={16} className="mr-2" />
              Confirmar Instalação
            </Button>

            <Button
              onClick={handleImmediateInvoice}
              className="bg-gray-700 hover:bg-gray-800 text-white"
            >
              <CheckCircle size={16} className="mr-2" />
              Gerar Fatura Imediata
            </Button>
          </div>
        )}

        <div className="flex justify-between items-center pt-2 border-t">
          <span className="text-xs text-slate-500">
            Criada em {new Date(order.created_at || '').toLocaleDateString('pt-BR')}
          </span>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => onView(order)} className="h-8 w-8 p-0">
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
