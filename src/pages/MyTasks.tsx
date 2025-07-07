import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Clock, AlertCircle, User, Filter, Loader2 } from 'lucide-react';
import { ServiceOrderTask } from '@/types/database';
import ClientLogo from '@/components/ui/client-logo';

interface TaskWithOrder extends ServiceOrderTask {
  service_orders: {
    id: string;
    order_number: string;
    client_name: string;
    status: string;
    urgency: string;
  };
  assigned_worker?: { name: string };
}

const MyTasks = () => {
  const { profile } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['my-tasks', profile?.id],
    queryFn: async (): Promise<TaskWithOrder[]> => {
      if (!profile?.id) {
        console.log('No profile ID available');
        return [];
      }
      
      console.log('Fetching tasks for user:', profile.id);
      
      const { data, error } = await supabase
        .from('service_order_tasks')
        .select(`
          *,
          service_orders!inner(
            id,
            order_number,
            client_name,
            status,
            urgency
          ),
          assigned_worker:profiles!assigned_worker_id(name)
        `)
        .eq('assigned_worker_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
        throw error;
      }
      
      console.log('Tasks fetched:', data?.length || 0);
      return (data || []) as TaskWithOrder[];
    },
    enabled: !!profile?.id,
  });

  const getFilteredTasks = () => {
    if (!tasks) return [];
    
    let filteredTasks = tasks;

    if (statusFilter !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.priority === priorityFilter);
    }

    return filteredTasks;
  };

  const getStatusColor = (status: string) => {
    const colorMap = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colorMap[status as keyof typeof colorMap] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colorMap = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-red-100 text-red-800'
    };
    return colorMap[priority as keyof typeof colorMap] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const statusMap = {
      'pending': 'Pendente',
      'in_progress': 'Em Andamento',
      'completed': 'Concluída',
      'cancelled': 'Cancelada'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getPriorityLabel = (priority: string) => {
    const priorityMap = {
      'low': 'Baixa',
      'medium': 'Média',
      'high': 'Alta'
    };
    return priorityMap[priority as keyof typeof priorityMap] || priority;
  };

  const getUrgencyLabel = (urgency: string) => {
    const urgencyMap = {
      'low': 'Baixa',
      'medium': 'Média',
      'high': 'Alta'
    };
    return urgencyMap[urgency as keyof typeof urgencyMap] || urgency;
  };

  const handleStartTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('service_order_tasks')
        .update({ status: 'in_progress' })
        .eq('id', taskId);

      if (error) throw error;
      
      // Refetch tasks to update the UI
      window.location.reload();
    } catch (error) {
      console.error('Error starting task:', error);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('service_order_tasks')
        .update({ status: 'completed' })
        .eq('id', taskId);

      if (error) throw error;
      
      // Refetch tasks to update the UI
      window.location.reload();
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="animate-spin" size={20} />
          <span>Carregando suas tarefas...</span>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Query error:', error);
    return (
      <div className="p-6">
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-red-500">
              <AlertCircle size={48} className="mx-auto mb-4" />
              <p className="text-lg font-medium">Erro ao carregar tarefas</p>
              <p className="text-sm mt-1">
                Ocorreu um erro ao buscar suas tarefas. Tente recarregar a página.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile || profile.role !== 'worker') {
    return (
      <div className="p-6">
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-slate-500">
              <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Acesso Restrito</p>
              <p className="text-sm mt-1">
                Esta página é apenas para operários (workers).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredTasks = getFilteredTasks();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Minhas Tarefas
        </h1>
        <p className="text-slate-600 mt-1">
          Gerencie todas as suas tarefas atribuídas de forma organizada
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter size={20} />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as prioridades</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <Card key={task.id} className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <ClientLogo 
                      clientName={task.service_orders.client_name} 
                      size="md"
                    />
                    <div>
                      <CardTitle className="text-lg font-semibold">
                        {task.title}
                      </CardTitle>
                      <p className="text-sm text-slate-600 mt-1">
                        OS {task.service_orders.order_number} - {task.service_orders.client_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Badge className={getStatusColor(task.status)}>
                      {getStatusLabel(task.status)}
                    </Badge>
                    <Badge className={getPriorityColor(task.priority)}>
                      {getPriorityLabel(task.priority)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {task.description && (
                  <div className="bg-slate-50 p-3 rounded-md">
                    <p className="text-sm line-clamp-3">{task.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-2 text-sm">
                  {task.estimated_hours && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock size={16} />
                      <span>{task.estimated_hours}h estimadas</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-600">
                    <User size={16} />
                    <span>Urgência da OS: {getUrgencyLabel(task.service_orders.urgency)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs text-slate-500">
                    Criada em {new Date(task.created_at).toLocaleDateString('pt-BR')}
                  </span>
                  <div className="flex gap-2">
                    {task.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-blue-600 hover:text-blue-700"
                        onClick={() => handleStartTask(task.id)}
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        Iniciar
                      </Button>
                    )}
                    {task.status === 'in_progress' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 hover:text-green-700"
                        onClick={() => handleCompleteTask(task.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Concluir
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-slate-500">
                <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Nenhuma tarefa encontrada</p>
                <p className="text-sm mt-1">
                  {statusFilter !== 'all' || priorityFilter !== 'all'
                    ? 'Tente ajustar os filtros de busca'
                    : 'Você não tem tarefas atribuídas no momento'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MyTasks;
