
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, DollarSign, User, Phone, MapPin, FileText, AlertCircle } from 'lucide-react';
import { ServiceOrder } from '@/types/database';
import TaskManagement from './TaskManagement';
import ImageUpload from './ImageUpload';

interface OrderDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: ServiceOrder & { 
    assigned_worker?: { name: string };
    created_by_user?: { name: string };
  };
}

const OrderDetailsDialog = ({ open, onOpenChange, order }: OrderDetailsDialogProps) => {
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
      'received': 'bg-blue-100 text-blue-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'planning': 'bg-purple-100 text-purple-800',
      'production': 'bg-orange-100 text-orange-800',
      'quality_control': 'bg-indigo-100 text-indigo-800',
      'ready_for_shipment': 'bg-cyan-100 text-cyan-800',
      'in_transit': 'bg-pink-100 text-pink-800',
      'delivered': 'bg-green-100 text-green-800',
      'invoiced': 'bg-emerald-100 text-emerald-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colorMap[status as keyof typeof colorMap] || 'bg-gray-100 text-gray-800';
  };

  const getUrgencyColor = (urgency: string) => {
    const colorMap = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-red-100 text-red-800'
    };
    return colorMap[urgency as keyof typeof colorMap] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Ordem de Serviço - {order.order_number}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="tasks">Tarefas</TabsTrigger>
            <TabsTrigger value="images">Imagens</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6 mt-6">
            {/* Status e Urgência */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <Badge className={`mt-1 ${getStatusColor(order.status)}`}>
                  {getStatusLabel(order.status)}
                </Badge>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">Urgência</label>
                <Badge className={`mt-1 ${getUrgencyColor(order.urgency)}`}>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {getUrgencyLabel(order.urgency)}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Informações do Cliente */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informações do Cliente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <User className="h-4 w-4" />
                    Nome do Cliente
                  </label>
                  <p className="mt-1 text-sm text-gray-900">{order.client_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    Contato
                  </label>
                  <p className="mt-1 text-sm text-gray-900">{order.client_contact}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Endereço
                </label>
                <p className="mt-1 text-sm text-gray-900">{order.client_address}</p>
              </div>
            </div>

            <Separator />

            {/* Detalhes do Serviço */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Detalhes do Serviço</h3>
              <div>
                <label className="text-sm font-medium text-gray-700">Descrição do Serviço</label>
                <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                  {order.service_description}
                </p>
              </div>
            </div>

            <Separator />

            {/* Informações Adicionais */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informações Adicionais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Data de Abertura
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(order.opening_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                {order.deadline && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Prazo
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(order.deadline).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {order.sale_value && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      Valor da Venda
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {Number(order.sale_value).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      })}
                    </p>
                  </div>
                )}
                {order.assigned_worker && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <User className="h-4 w-4" />
                      Operário Responsável
                    </label>
                    <p className="mt-1 text-sm text-gray-900">{order.assigned_worker.name}</p>
                  </div>
                )}
              </div>

              {order.created_by_user && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Criado por</label>
                  <p className="mt-1 text-sm text-gray-900">{order.created_by_user.name}</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="mt-6">
            <TaskManagement serviceOrderId={order.id} />
          </TabsContent>

          <TabsContent value="images" className="mt-6">
            <ImageUpload serviceOrderId={order.id} title="Imagens da Ordem de Serviço" />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <div className="text-center py-8 text-slate-500">
              <p>Histórico de alterações em desenvolvimento...</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsDialog;
