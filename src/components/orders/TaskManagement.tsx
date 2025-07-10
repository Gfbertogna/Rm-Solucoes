import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ServiceOrderTask, TaskPriority, TaskStatus } from '@/types/database';

interface TaskManagementProps {
  serviceOrderId: string;
}

const TaskManagement = ({ serviceOrderId }: TaskManagementProps) => {
  const { profile } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_worker_id: '',
    priority: 'medium' as TaskPriority,
    estimated_hours: '',
    status: 'pending' as TaskStatus,
    status_details: '',
  });

  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['service-order-tasks', serviceOrderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_order_tasks')
        .select(`
          *,
          assigned_worker:profiles!assigned_worker_id(name)
        `)
        .eq('service_order_id', serviceOrderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (ServiceOrderTask & { assigned_worker?: { name: string } })[];
    },
  });

  const { data: workers = [] } = useQuery({
    queryKey: ['workers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('role', 'worker');

      if (error) throw error;
      return data || [];
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: Partial<ServiceOrderTask>) => {
      const { data, error } = await supabase
        .from('service_order_tasks')
        .insert({
          service_order_id: serviceOrderId,
          title: taskData.title || '',
          description: taskData.description,
          assigned_worker_id: taskData.assigned_worker_id,
          status: taskData.status || 'pending',
          status_details: taskData.status_details,
          priority: taskData.priority || 'medium',
          estimated_hours: taskData.estimated_hours,
          created_by: profile?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-order-tasks', serviceOrderId] });
      toast.success('Tarefa criada com sucesso!');
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error('Erro ao criar tarefa: ' + error.message);
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ServiceOrderTask> & { id: string }) => {
      const { data, error } = await supabase
        .from('service_order_tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-order-tasks', serviceOrderId] });
      toast.success('Tarefa atualizada com sucesso!');
      setEditingTask(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar tarefa: ' + error.message);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('service_order_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-order-tasks', serviceOrderId] });
      toast.success('Tarefa excluída com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir tarefa: ' + error.message);
    },
  });

  const createTask = createTaskMutation.mutate;
  const updateTask = updateTaskMutation.mutate;
  const deleteTask = deleteTaskMutation.mutate;
  const isCreating = createTaskMutation.isPending;
  const isUpdating = updateTaskMutation.isPending;
  const isDeleting = deleteTaskMutation.isPending;

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      assigned_worker_id: '',
      priority: 'medium',
      estimated_hours: '',
      status: 'pending',
      status_details: '',
    });
  };

  const handleEdit = (task: any) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      assigned_worker_id: task.assigned_worker_id || '',
      priority: task.priority,
      estimated_hours: task.estimated_hours?.toString() || '',
      status: task.status,
      status_details: task.status_details || '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const taskData = {
      title: formData.title,
      description: formData.description || null,
      assigned_worker_id: formData.assigned_worker_id || null,
      priority: formData.priority,
      estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
      status: formData.status,
      status_details: formData.status_details || null,
      created_by: profile?.id,
    };

    if (editingTask) {
      updateTask({ id: editingTask.id, ...taskData });
    } else {
      createTask(taskData);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-500 text-white';
      case 'in_progress': return 'bg-blue-500 text-white';
      case 'completed': return 'bg-green-500 text-white';
      case 'cancelled': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'in_progress': return 'Em Andamento';
      case 'completed': return 'Concluída';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'high': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'low': return 'Baixa';
      case 'medium': return 'Média';
      case 'high': return 'Alta';
      default: return priority;
    }
  };

  const canManage = profile && ['admin', 'manager'].includes(profile.role);

  if (isLoading) {
    return <p>Carregando tarefas...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Tarefas</h3>
        {canManage && (
          <Button onClick={() => setIsCreateDialogOpen(true)} size="sm">
            <Plus size={16} />
            Nova Tarefa
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {tasks.map((task) => (
          <Card key={task.id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium">{task.title}</h4>
                  <Badge className={getStatusColor(task.status)}>
                    {getStatusText(task.status)}
                  </Badge>
                  <Badge variant="outline" className={getPriorityColor(task.priority)}>
                    {getPriorityText(task.priority)}
                  </Badge>
                </div>
                
                {task.description && (
                  <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                )}
                
                {task.status_details && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2">
                    <p className="text-sm text-blue-800">
                      <strong>Status:</strong> {task.status_details}
                    </p>
                  </div>
                )}
                
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  {task.assigned_worker?.name && (
                    <span>Responsável: {task.assigned_worker.name}</span>
                  )}
                  {task.estimated_hours && (
                    <span>Estimativa: {task.estimated_hours}h</span>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                {canManage && (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(task)}>
                      <Edit size={16} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => deleteTask(task.id)}
                      disabled={isDeleting}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Nova Tarefa</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="status_details">Detalhes do Status</Label>
              <Textarea
                id="status_details"
                value={formData.status_details}
                onChange={(e) => setFormData({ ...formData, status_details: e.target.value })}
                placeholder="Informações adicionais sobre o status da tarefa..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Prioridade</Label>
                <Select value={formData.priority} onValueChange={(value: TaskPriority) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value: TaskStatus) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="assigned_worker">Responsável</Label>
                <Select value={formData.assigned_worker_id} onValueChange={(value) => setFormData({ ...formData, assigned_worker_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {workers.map((worker) => (
                      <SelectItem key={worker.id} value={worker.id}>
                        {worker.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="estimated_hours">Horas Estimadas</Label>
                <Input
                  id="estimated_hours"
                  type="number"
                  step="0.5"
                  value={formData.estimated_hours}
                  onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? 'Criando...' : 'Criar Tarefa'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Tarefa</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Same form fields as create dialog */}
            <div>
              <Label htmlFor="edit-title">Título</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-status_details">Detalhes do Status</Label>
              <Textarea
                id="edit-status_details"
                value={formData.status_details}
                onChange={(e) => setFormData({ ...formData, status_details: e.target.value })}
                placeholder="Informações adicionais sobre o status da tarefa..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-priority">Prioridade</Label>
                <Select value={formData.priority} onValueChange={(value: TaskPriority) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select value={formData.status} onValueChange={(value: TaskStatus) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-assigned_worker">Responsável</Label>
                <Select value={formData.assigned_worker_id} onValueChange={(value) => setFormData({ ...formData, assigned_worker_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {workers.map((worker) => (
                      <SelectItem key={worker.id} value={worker.id}>
                        {worker.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="edit-estimated_hours">Horas Estimadas</Label>
                <Input
                  id="edit-estimated_hours"
                  type="number"
                  step="0.5"
                  value={formData.estimated_hours}
                  onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingTask(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Atualizando...' : 'Atualizar Tarefa'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskManagement;
