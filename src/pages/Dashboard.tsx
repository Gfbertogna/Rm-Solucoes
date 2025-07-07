
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useServiceOrders } from '@/hooks/useServiceOrders';
import OrderCard from '@/components/orders/OrderCard';
import CreateOrderDialog from '@/components/orders/CreateOrderDialog';
import EditOrderDialog from '@/components/orders/EditOrderDialog';
import EditOrderDialogManager from '@/components/orders/EditOrderDialogManager';
import DeleteOrderDialog from '@/components/orders/DeleteOrderDialog';
import OrderDetailsDialog from '@/components/orders/OrderDetailsDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Package, Users, ClipboardList, TrendingUp, Loader2 } from 'lucide-react';
import { ServiceOrder } from '@/types/database';

const Dashboard = () => {
  const { profile } = useAuth();
  const { orders, isLoading } = useServiceOrders();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder & { assigned_worker?: { name: string } } | null>(null);

  const isAdmin = profile?.role === 'admin';
  const isManager = profile?.role === 'manager';
  const canManageOrders = isAdmin || isManager;

  // Filtrar apenas as ordens mais recentes para o dashboard
  const recentOrders = orders.slice(0, 5);

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
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="animate-spin" size={20} />
          <span>Carregando dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Dashboard
          </h1>
          <p className="text-slate-600 mt-1">
            Visão geral do sistema de ordens de serviço
          </p>
        </div>
        {canManageOrders && (
          <Button 
            className="bg-[#2D3D2C] hover:bg-[#374C36] text-white"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus size={20} className="mr-2" />
            Nova OS
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de OS</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Produção</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter(order => order.status === 'production').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finalizadas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter(order => order.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter(order => order.urgency === 'high').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Ordens de Serviço Recentes</CardTitle>
          <CardDescription>
            Últimas 5 ordens de serviço criadas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentOrders.length > 0 ? (
            recentOrders.map((order) => (
              <OrderCard 
                key={order.id} 
                order={order}
                onEdit={canManageOrders ? () => handleEditOrder(order) : undefined}
                onDelete={canManageOrders ? () => handleDeleteOrder(order) : undefined}
                onView={() => handleViewOrder(order)}
              />
            ))
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Package size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhuma ordem encontrada</p>
              <p className="text-sm mt-1">
                Ainda não há ordens de serviço cadastradas
              </p>
            </div>
          )}
        </CardContent>
      </Card>

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

export default Dashboard;
