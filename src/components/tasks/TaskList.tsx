import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Clock, User, FileText } from 'lucide-react';
import { useServiceOrderTasks } from '@/hooks/useServiceOrderTasks';
import { useAuth } from '@/contexts/AuthContext';
import { CreateTaskDialog } from '@/components/orders/CreateTaskDialog';
import { TaskTimeTracker } from './TaskTimeTracker';
import { ServiceOrderTimeReport } from './ServiceOrderTimeReport';
import { ServiceOrderTask, TaskStatus } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';

interface TaskListProps {
  serviceOrderId: string;
  orderNumber: string;
  clientName: string;
}

export const TaskList: React.FC<TaskListProps> = ({ 
  serviceOrderId, 
  orderNumber, 
  clientName 
}) => {
  const { profile } = useAuth();
  const { tasks, isLoading, updateTask, deleteTask } = useServiceOrderTasks(serviceOrderId);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [showTimeReport, setShowTimeReport] = useState(false);

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

  const canManageTasks = profile && ['admin', 'manager'].includes(profile.role);

  const handleTaskStatusUpdate = async (taskId: string, newStatus: TaskStatus) => {
    await updateTask({ id: taskId, status: newStatus });

    if (newStatus === 'completed') {
      const { data: remaining } = await supabase
        .from('service_order_tasks')
        .select('id')
        .eq('service_order_id', serviceOrderId)
        .neq('status', 'completed');

      if (remaining?.length === 0) {
        await supabase
          .from('service_orders')
          .update({ status: 'quality_control' })
          .eq('id', serviceOrderId);
      }
    }
  };

  const toggleTaskExpand = (taskId: string) => {
    setExpandedTask(expandedTask === taskId ? null : taskId);
  };

  const hasCompletedTasks = tasks.some(task => task.status === 'completed');

  if (isLoading) {
    return <div className="p-4">Carregando tarefas...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Tarefas - OS {orderNumber}</h2>
          <p className="text-gray-600">{clientName}</p>
        </div>
        <div className="flex gap-2">
          {hasCompletedTasks && (
            <Button
              variant="outline"
              onClick={() => setShowTimeReport(!showTimeReport)}
              className="flex items-center gap-2"
            >
              <FileText size={16} />
              {showTimeReport ? 'Ocultar' : 'Ver'} Relatório
            </Button>
          )}
          {canManageTasks && (
            <CreateTaskDialog serviceOrderId={serviceOrderId}>
              <Button>
                <Plus size={16} className="mr-2" />
                Nova Tarefa
              </Button>
            </CreateTaskDialog>
          )}
        </div>
      </div>

      {showTimeReport && hasCompletedTasks && (
        <ServiceOrderTimeReport
          serviceOrderId={serviceOrderId}
          orderNumber={orderNumber}
          clientName={clientName}
        />
      )}

      <div className="space-y-4">
        {tasks.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">Nenhuma tarefa cadastrada</p>
            </CardContent>
          </Card>
        ) : (
          tasks.map((task) => (
            <Card key={task.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{task.title}</CardTitle>
                    {task.description && (
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      {task.assigned_worker?.name && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <User size={14} />
                          <span>{task.assigned_worker.name}</span>
                        </div>
                      )}
                      {task.estimated_hours && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Clock size={14} />
                          <span>{task.estimated_hours}h estimadas</span>
                        </div>
                      )}
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
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleTaskExpand(task.id)}
                  >
                    <Clock size={14} className="mr-1" />
                    {expandedTask === task.id ? 'Ocultar Timer' : 'Mostrar Timer'}
                  </Button>
                  
                  {task.status === 'pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTaskStatusUpdate(task.id, 'in_progress')}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Iniciar Tarefa
                    </Button>
                  )}
                  
                  {task.status === 'in_progress' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTaskStatusUpdate(task.id, 'completed')}
                      className="text-green-600 hover:text-green-700"
                    >
                      Concluir Tarefa
                    </Button>
                  )}

                  {canManageTasks && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteTask(task.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={14} className="mr-1" />
                      Excluir
                    </Button>
                  )}
                </div>

                {expandedTask === task.id && (
                  <TaskTimeTracker
                    taskId={task.id}
                    taskTitle={task.title}
                    assignedWorkerId={task.assigned_worker_id || undefined}
                    assignedWorkerName={task.assigned_worker?.name}
                    estimatedHours={task.estimated_hours || undefined}
                  />
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
