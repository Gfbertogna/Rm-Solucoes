import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ServiceOrderTask, TaskTimeLog, ServiceOrderImage, TaskProductUsage } from '@/types/database';
import { toast } from 'sonner';

export const useServiceOrderTasks = (serviceOrderId: string) => {
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['service-order-tasks', serviceOrderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_order_tasks')
        .select(`
          *,
          assigned_worker:profiles!assigned_worker_id(name),
          created_by_user:profiles!created_by(name)
        `)
        .eq('service_order_id', serviceOrderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (ServiceOrderTask & { 
        assigned_worker?: { name: string };
        created_by_user?: { name: string };
      })[];
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
          priority: taskData.priority || 'medium',
          estimated_hours: taskData.estimated_hours,
          created_by: taskData.created_by,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-order-tasks', serviceOrderId] });
      toast.success('Tarefa criada com sucesso!');
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

  return {
    tasks,
    isLoading,
    createTask: createTaskMutation.mutate,
    updateTask: updateTaskMutation.mutate,
    deleteTask: deleteTaskMutation.mutate,
    isCreating: createTaskMutation.isPending,
    isUpdating: updateTaskMutation.isPending,
    isDeleting: deleteTaskMutation.isPending,
  };
};

export const useTimeTracking = (taskId: string) => {
  const queryClient = useQueryClient();

  const { data: timeLogs = [] } = useQuery({
    queryKey: ['task-time-logs', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_time_logs')
        .select(`
          *,
          worker:profiles!worker_id(name)
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (TaskTimeLog & { worker: { name: string } })[];
    },
  });

  const startTimeMutation = useMutation({
    mutationFn: async (workerId: string) => {
      const { data, error } = await supabase
        .from('task_time_logs')
        .insert({
          task_id: taskId,
          worker_id: workerId,
          start_time: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-time-logs', taskId] });
      toast.success('Cronômetro iniciado!');
    },
  });

  const stopTimeMutation = useMutation({
    mutationFn: async ({ id, description }: { id: string; description?: string }) => {
      const endTime = new Date();
      const { data: timeLog, error: fetchError } = await supabase
        .from('task_time_logs')
        .select('start_time')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const startTime = new Date(timeLog.start_time);
      const hoursWorked = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

      const { data, error } = await supabase
        .from('task_time_logs')
        .update({
          end_time: endTime.toISOString(),
          description,
          hours_worked: hoursWorked,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-time-logs', taskId] });
      toast.success('Tempo registrado com sucesso!');
    },
  });

  return {
    timeLogs,
    startTimer: startTimeMutation.mutate,
    stopTimer: stopTimeMutation.mutate,
    isStarting: startTimeMutation.isPending,
    isStopping: stopTimeMutation.isPending,
  };
};

export const useServiceOrderImages = (serviceOrderId?: string, taskId?: string) => {
  const queryClient = useQueryClient();

  const { data: images = [] } = useQuery({
    queryKey: ['service-order-images', serviceOrderId, taskId],
    queryFn: async () => {
      let query = supabase
        .from('service_order_images')
        .select(`
          *,
          uploaded_by_user:profiles!uploaded_by(name)
        `);

      if (serviceOrderId) {
        query = query.eq('service_order_id', serviceOrderId);
      }
      if (taskId) {
        query = query.eq('task_id', taskId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as (ServiceOrderImage & { uploaded_by_user: { name: string } })[];
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: async ({ file, description }: { file: File; description?: string }) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${serviceOrderId || taskId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('service-order-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from('service_order_images')
        .insert({
          service_order_id: serviceOrderId,
          task_id: taskId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: (await supabase.auth.getUser()).data.user?.id!,
          description,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-order-images', serviceOrderId, taskId] });
      toast.success('Imagem enviada com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao enviar imagem: ' + error.message);
    },
  });

  return {
    images,
    uploadImage: uploadImageMutation.mutate,
    isUploading: uploadImageMutation.isPending,
  };
};

export const useTaskProductUsage = (taskId: string) => {
  const queryClient = useQueryClient();

  const { data: productUsage = [] } = useQuery({
    queryKey: ['task-product-usage', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_product_usage')
        .select(`
          *,
          inventory_item:inventory_items(name, current_quantity),
          created_by_user:profiles!created_by(name)
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (TaskProductUsage & { 
        inventory_item: { name: string; current_quantity: number };
        created_by_user?: { name: string };
      })[];
    },
  });

  const addProductUsageMutation = useMutation({
    mutationFn: async ({ itemId, quantityUsed, createdBy }: { 
      itemId: string; 
      quantityUsed: number; 
      createdBy?: string;
    }) => {
      const { data, error } = await supabase
        .from('task_product_usage')
        .insert({
          task_id: taskId,
          item_id: itemId,
          quantity_used: quantityUsed,
          created_by: createdBy,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-product-usage', taskId] });
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast.success('Uso de produto registrado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao registrar uso: ' + error.message);
    },
  });

  const removeProductUsageMutation = useMutation({
    mutationFn: async (usageId: string) => {
      const { error } = await supabase
        .from('task_product_usage')
        .delete()
        .eq('id', usageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-product-usage', taskId] });
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast.success('Uso de produto removido com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao remover uso: ' + error.message);
    },
  });

  return {
    productUsage,
    addProductUsage: addProductUsageMutation.mutate,
    removeProductUsage: removeProductUsageMutation.mutate,
    isAdding: addProductUsageMutation.isPending,
    isRemoving: removeProductUsageMutation.isPending,
  };
};
