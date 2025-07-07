
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';

const ServiceReports = () => {
  const { data: overdueData, isLoading: overdueLoading } = useQuery({
    queryKey: ['overdue-analysis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('overdue_analysis')
        .select('*')
        .order('days_overdue', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: urgencyData, isLoading: urgencyLoading } = useQuery({
    queryKey: ['urgency-analysis'],
    queryFn: async () => {
      const { data: orders, error: ordersError } = await supabase
        .from('service_orders')
        .select('urgency, status, order_number, client_name, deadline')
        .not('status', 'in', '(completed,delivered,cancelled)');

      const { data: tasks, error: tasksError } = await supabase
        .from('service_order_tasks')
        .select(`
          priority,
          status,
          title,
          service_order_id,
          service_orders!inner(urgency, order_number, client_name)
        `)
        .not('status', 'in', '(completed,cancelled)');

      if (ordersError) throw ordersError;
      if (tasksError) throw tasksError;

      return { orders, tasks };
    },
  });

  if (overdueLoading || urgencyLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="flex items-center gap-2">
          <Loader2 className="animate-spin" size={20} />
          <span>Carregando relatórios de serviços...</span>
        </div>
      </div>
    );
  }

  const overdueOrders = overdueData?.filter(item => item.type === 'order' && item.days_overdue > 0) || [];
  const overdueTasks = overdueData?.filter(item => item.type === 'task' && item.days_overdue > 0) || [];
  const urgentOrders = urgencyData?.orders?.filter(order => order.urgency === 'high') || [];
  const urgentTasks = urgencyData?.tasks?.filter(task => 
    task.priority === 'high' || task.service_orders.urgency === 'high'
  ) || [];

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Relatórios de Serviços</h2>
        <p className="text-gray-600 mt-1">Análise de atrasos, urgências e status dos serviços</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">OS Atrasadas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueOrders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas Atrasadas</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{overdueTasks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">OS Urgentes</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{urgentOrders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas Urgentes</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{urgentTasks.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs com Relatórios Detalhados */}
      <Tabs defaultValue="overdue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overdue">Itens Atrasados</TabsTrigger>
          <TabsTrigger value="urgent">Itens Urgentes</TabsTrigger>
          <TabsTrigger value="priority">Por Prioridade</TabsTrigger>
        </TabsList>

        <TabsContent value="overdue" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* OS Atrasadas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Ordens de Serviço Atrasadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {overdueOrders.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>OS</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Dias de Atraso</TableHead>
                        <TableHead>Funcionário</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overdueOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.order_number}</TableCell>
                          <TableCell>{order.client_name}</TableCell>
                          <TableCell>
                            <Badge variant="destructive">{order.days_overdue} dias</Badge>
                          </TableCell>
                          <TableCell>{order.assigned_worker || 'Não atribuído'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center py-4 text-gray-500">Nenhuma OS atrasada</p>
                )}
              </CardContent>
            </Card>

            {/* Tarefas Atrasadas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  Tarefas Atrasadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {overdueTasks.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tarefa</TableHead>
                        <TableHead>OS</TableHead>
                        <TableHead>Dias de Atraso</TableHead>
                        <TableHead>Funcionário</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overdueTasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell className="font-medium">{task.name}</TableCell>
                          <TableCell>{task.order_number}</TableCell>
                          <TableCell>
                            <Badge variant="destructive">{task.days_overdue} dias</Badge>
                          </TableCell>
                          <TableCell>{task.assigned_worker || 'Não atribuído'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center py-4 text-gray-500">Nenhuma tarefa atrasada</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="urgent" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* OS Urgentes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  Ordens de Serviço Urgentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {urgentOrders.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>OS</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Prazo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {urgentOrders.map((order) => (
                        <TableRow key={order.order_number}>
                          <TableCell className="font-medium">{order.order_number}</TableCell>
                          <TableCell>{order.client_name}</TableCell>
                          <TableCell>
                            <Badge className={getUrgencyColor(order.status)}>{order.status}</Badge>
                          </TableCell>
                          <TableCell>
                            {order.deadline ? new Date(order.deadline).toLocaleDateString('pt-BR') : 'Sem prazo'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center py-4 text-gray-500">Nenhuma OS urgente</p>
                )}
              </CardContent>
            </Card>

            {/* Tarefas Urgentes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-red-500" />
                  Tarefas Urgentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {urgentTasks.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tarefa</TableHead>
                        <TableHead>OS</TableHead>
                        <TableHead>Prioridade</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {urgentTasks.map((task) => (
                        <TableRow key={task.title}>
                          <TableCell className="font-medium">{task.title}</TableCell>
                          <TableCell>{task.service_orders.order_number}</TableCell>
                          <TableCell>
                            <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getUrgencyColor(task.status)}>{task.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center py-4 text-gray-500">Nenhuma tarefa urgente</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="priority" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Prioridade/Urgência</CardTitle>
            </CardHeader>
            <CardContent>
              {urgencyData && (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {urgencyData.orders?.filter(o => o.urgency === 'high').length || 0}
                    </div>
                    <div className="text-sm text-gray-600">OS Alta Urgência</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {urgencyData.orders?.filter(o => o.urgency === 'medium').length || 0}
                    </div>
                    <div className="text-sm text-gray-600">OS Média Urgência</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {urgencyData.orders?.filter(o => o.urgency === 'low').length || 0}
                    </div>
                    <div className="text-sm text-gray-600">OS Baixa Urgência</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ServiceReports;
