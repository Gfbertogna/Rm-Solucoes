import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useServiceOrders, useWorkers } from '@/hooks/useServiceOrders';
import OrderCard from '@/components/orders/OrderCard';
import CreateOrderDialog from '@/components/orders/CreateOrderDialog';
import EditOrderDialog from '@/components/orders/EditOrderDialog';
import EditOrderDialogManager from '@/components/orders/EditOrderDialogManager';
import DeleteOrderDialog from '@/components/orders/DeleteOrderDialog';
import OrderDetailsDialog from '@/components/orders/OrderDetailsDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Search, Loader2, Filter } from 'lucide-react';
import { ServiceOrder } from '@/types/database';
import { useIsMobile } from '@/hooks/use-mobile';

const Orders = () => {
  const { profile } = useAuth();
  const { orders, isLoading } = useServiceOrders();
  const { workers } = useWorkers();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [workerFilter, setWorkerFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder & { assigned_worker?: { name: string } } | null>(null);

  const getFilteredOrders = () => {
    let filteredOrders = orders;

    // Filtrar por perfil do usuário (apenas para workers)
    if (profile?.role === 'worker') {
      filteredOrders = filteredOrders.filter(order => 
        order.assigned_worker_id === profile.id || order.created_by === profile.id
      );
    }

    // Filtrar por termo de busca
    if (searchTerm) {
      filteredOrders = filteredOrders.filter(order =>
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.service_description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por status
    if (statusFilter !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.status === statusFilter);
    }

    // Filtrar por prioridade
    if (priorityFilter !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.urgency === priorityFilter);
    }

    // Filtrar por colaborador (apenas para admin e manager)
    if (workerFilter !== 'all' && ['admin', 'manager'].includes(profile?.role || '')) {
      if (workerFilter === 'unassigned') {
        filteredOrders = filteredOrders.filter(order => !order.assigned_worker_id);
      } else {
        filteredOrders = filteredOrders.filter(order => order.assigned_worker_id === workerFilter);
      }
    }

    return filteredOrders;
  };

  const filteredOrders = getFilteredOrders();
  const canCreateOrder = profile?.role !== 'worker' || profile?.role === 'worker';
  const isAdmin = profile?.role === 'admin';
  const isManager = profile?.role === 'manager';
  const isWorker = profile?.role === 'worker';
  const canManageOrders = isAdmin || isManager || isWorker;

  const handleEditOrder = (order: ServiceOrder & { assigned_worker?: { name: string } }) => {
    setSelectedOrder(order);
    setShowEditDialog(true);
  };

  const handleDeleteOrder = (order: ServiceOrder & { assigned_worker?: { name: string } }) => {
    setSelectedOrder(order);
    setShowDeleteDialog(true);
  };

  const handleViewOrder = (order: ServiceOrder & { assigned_worker?: { name: string } }) => {
    setSelectedOrder(order);
    setShowDetailsDialog(true);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="animate-spin" size={20} />
          <span>Carregando ordens de serviço...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isMobile ? 'p-4' : 'p-6'}`}>
      {/* Header */}
      <div className={`flex ${isMobile ? 'flex-col gap-4' : 'justify-between items-start'}`}>
        <div>
          <h1 className={`font-bold text-slate-800 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
            {profile?.role === 'worker' ? 'Minhas Ordens de Serviço' : 'Ordens de Serviço'}
          </h1>
          <p className={`text-slate-600 mt-1 ${isMobile ? 'text-sm' : ''}`}>
            {profile?.role === 'worker' 
              ? 'Gerencie suas ordens de serviço atribuídas'
              : 'Gerencie todas as ordens de serviço do sistema'
            }
          </p>
        </div>
        {canCreateOrder && canManageOrders && (
          <Button 
            className={`bg-[#2D3D2C] hover:bg-[#374C36] text-white ${isMobile ? 'w-full' : ''}`}
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus size={20} className="mr-2" />
            Nova OS
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : 'text-lg'}`}>
            <Filter size={20} />
            Filtros
          </CardTitle>
          <CardDescription className={isMobile ? 'text-sm' : ''}>
            Use os filtros abaixo para encontrar ordens específicas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`flex gap-4 ${isMobile ? 'flex-col' : 'flex-wrap'}`}>
            <div className={`${isMobile ? 'w-full' : 'flex-1 min-w-64'}`}>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Buscar por número, cliente ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className={isMobile ? 'w-full' : 'w-48'}>
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="production">Em Produção</SelectItem>
                  <SelectItem value="on_hold">Em Espera</SelectItem>
                  <SelectItem value="stopped">Paralisado</SelectItem>
                  <SelectItem value="quality_control">Controle de Qualidade</SelectItem>
                  <SelectItem value="ready_for_pickup">Aguardando Retirada</SelectItem>
                  <SelectItem value="awaiting_installation">Aguardando Instalação</SelectItem>
                  <SelectItem value="to_invoice">Faturar</SelectItem>
                  <SelectItem value="completed">Finalizado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>

              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className={isMobile ? 'w-full' : 'w-48'}>
                <SelectValue placeholder="Filtrar por prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as prioridades</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
              </SelectContent>
            </Select>

            {canManageOrders && (
              <Select value={workerFilter} onValueChange={setWorkerFilter}>
                <SelectTrigger className={isMobile ? 'w-full' : 'w-48'}>
                  <SelectValue placeholder="Filtrar por colaborador" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os colaboradores</SelectItem>
                  <SelectItem value="unassigned">Não atribuído</SelectItem>
                  {workers.map((worker) => (
                    <SelectItem key={worker.id} value={worker.id}>
                      {worker.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <OrderCard 
              key={order.id} 
              order={order}
              onEdit={canManageOrders ? () => handleEditOrder(order) : undefined}
              onDelete={canManageOrders ? () => handleDeleteOrder(order) : undefined}
              onView={() => handleViewOrder(order)}
            />
          ))
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-slate-500">
                <Search size={48} className="mx-auto mb-4 opacity-50" />
                <p className={`font-medium ${isMobile ? 'text-base' : 'text-lg'}`}>Nenhuma ordem encontrada</p>
                <p className={`mt-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || workerFilter !== 'all'
                    ? 'Tente ajustar os filtros de busca'
                    : 'Ainda não há ordens de serviço cadastradas'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialogs */}
      <CreateOrderDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
      />
      
      {selectedOrder && (
        <>
          {/* Use different edit dialog based on user role */}
          {isAdmin ? (
            <EditOrderDialog
              open={showEditDialog}
              onOpenChange={setShowEditDialog}
              order={selectedOrder}
            />
          ) : (
            <EditOrderDialogManager
              open={showEditDialog}
              onOpenChange={setShowEditDialog}
              order={selectedOrder}
            />
          )}
          
          <DeleteOrderDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            order={selectedOrder}
          />

          <OrderDetailsDialog
            open={showDetailsDialog}
            onOpenChange={setShowDetailsDialog}
            order={selectedOrder}
          />
        </>
      )}
    </div>
  );
};

export default Orders;
