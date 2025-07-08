// TaskManagement.tsx
import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ServiceOrderTask } from '@/types/database';

interface TaskManagementProps {
  serviceOrderId: string;
}

interface ActiveTimer {
  logId: string;
  startTime: string; // ISO string
}

const TaskManagement = ({ serviceOrderId }: TaskManagementProps) => {
  const { profile } = useAuth();
  const [activeTimers, setActiveTimers] = useState<{ [taskId: string]: ActiveTimer }>({});
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['service-order-tasks', serviceOrderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_order_tasks')
        .select(`*, assigned_worker:profiles!assigned_worker_id(name)`)
        .eq('service_order_id', serviceOrderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (ServiceOrderTask & { assigned_worker?: { name: string } })[];
    },
  });

  // Busca timers abertos do usuário para as tarefas
  useEffect(() => {
    async function loadActiveTimers() {
      if (!profile?.id || tasks.length === 0) return;

      const { data: openLogs, error } = await supabase
        .from('task_time_logs')
        .select('id, task_id, start_time')
        .eq('worker_id', profile.id)
        .is('end_time', null)
        .in('task_id', tasks.map(t => t.id));

      if (error) {
        toast.error('Erro ao carregar timers ativos: ' + error.message);
        return;
      }

      const timers: { [taskId: string]: ActiveTimer } = {};
      openLogs?.forEach(log => {
        if (log.task_id && log.id && log.start_time) {
          timers[log.task_id] = { logId: log.id, startTime: log.start_time };
        }
      });

      setActiveTimers(timers);
    }

    loadActiveTimers();
  }, [profile?.id, tasks]);

  const handleStartTimer = async (taskId: string) => {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('task_time_logs')
      .insert({
        task_id: taskId,
        worker_id: profile?.id,
        start_time: now,
      })
      .select()
      .single();

    if (!error && data?.id) {
      setActiveTimers((prev) => ({
        ...prev,
        [taskId]: { logId: data.id, startTime: now }
      }));
      toast.success('Contagem iniciada!');
      queryClient.invalidateQueries(['task-time-logs', taskId]);
    } else {
      toast.error('Erro ao iniciar contagem: ' + error?.message);
    }
  };

  const handleStopTimer = async (taskId: string) => {
    const timer = activeTimers[taskId];
    if (!timer) return;

    const { data: logData, error: fetchError } = await supabase
      .from('task_time_logs')
      .select('start_time')
      .eq('id', timer.logId)
      .single();

    if (fetchError || !logData?.start_time) {
      toast.error('Erro ao buscar horário de início: ' + fetchError?.message);
      return;
    }

    const start = new Date(logData.start_time).getTime();
    const end = new Date().getTime();
    const duration = (end - start) / 1000 / 60 / 60; // em horas

    const { error: updateError } = await supabase
      .from('task_time_logs')
      .update({
        end_time: new Date().toISOString(),
        hours_worked: duration,
      })
      .eq('id', timer.logId);

    if (updateError) {
      toast.error('Erro ao pausar contagem: ' + updateError.message);
      return;
    }

    setActiveTimers((prev) => {
      const copy = { ...prev };
      delete copy[taskId];
      return copy;
    });

    toast.success('Contagem pausada!');
    queryClient.invalidateQueries(['task-time-logs', taskId]);
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'high': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  if (tasksLoading) return <p>Carregando tarefas...</p>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Tarefas</h3>

      <div className="space-y-2">
        {tasks.map((task) => (
          <Card key={task.id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium">{task.title}</h4>
                  <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                  <Badge variant="outline" className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                </div>

                <p className="text-sm text-gray-600 mb-2">{task.description}</p>

                <p className="text-xs text-gray-500 mb-2">
                  Responsável: {task.assigned_worker?.name || 'Não atribuído'}
                </p>

                {/* Horas acumuladas (finalizadas + timer ativo) */}
                <TimeTrackerDisplay
                  taskId={task.id}
                  activeTimer={activeTimers[task.id]}
                />

                {/* Botões iniciar/pausar */}
                {profile?.role === 'worker' && profile.id === task.assigned_worker_id && (
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      onClick={() => handleStartTimer(task.id)}
                      disabled={!!activeTimers[task.id]}
                    >
                      Iniciar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStopTimer(task.id)}
                      disabled={!activeTimers[task.id]}
                    >
                      Pausar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TaskManagement;

// Componente que soma todas as horas já registradas + tempo do timer ativo
const TimeTrackerDisplay = ({
  taskId,
  activeTimer,
}: {
  taskId: string;
  activeTimer?: ActiveTimer;
}) => {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['task-time-logs', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_time_logs')
        .select('*')
        .eq('task_id', taskId);

      if (error) throw error;
      return data || [];
    },
  });

  const [activeElapsedSeconds, setActiveElapsedSeconds] = React.useState(0);

  React.useEffect(() => {
    if (!activeTimer) {
      setActiveElapsedSeconds(0);
      return;
    }

    const start = new Date(activeTimer.startTime).getTime();

    const interval = setInterval(() => {
      const now = Date.now();
      setActiveElapsedSeconds(Math.floor((now - start) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer]);

  if (isLoading) return <p>Carregando horas...</p>;

  // Função para formatar segundos para hh:mm:ss
  const formatSeconds = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${hours.toString().padStart(2, '0')}:` +
           `${minutes.toString().padStart(2, '0')}:` +
           `${seconds.toString().padStart(2, '0')}`;
  };

  // Logs finalizados (com end_time)
  const finishedLogs = logs.filter(log => log.end_time);

  // Soma total de segundos dos logs finalizados (priorizando hours_worked)
  const totalSecondsFromFinishedLogs = finishedLogs.reduce((sum, log) => {
    if (log.hours_worked != null) {
      return sum + log.hours_worked * 3600;
    }
    if (log.start_time && log.end_time) {
      const start = new Date(log.start_time).getTime();
      const end = new Date(log.end_time).getTime();
      return sum + (end - start) / 1000;
    }
    return sum;
  }, 0);

  // Total geral incluindo o log ativo
  const totalSeconds = totalSecondsFromFinishedLogs + activeElapsedSeconds;

  return (
    <div className="text-sm text-gray-700 font-mono space-y-1">
      {/* Mostrar cada intervalo (log) finalizado */}
      {finishedLogs.map((log) => {
        let seconds = 0;
        if (log.hours_worked != null) {
          seconds = log.hours_worked * 3600;
        } else if (log.start_time && log.end_time) {
          seconds = (new Date(log.end_time).getTime() - new Date(log.start_time).getTime()) / 1000;
        }
        return (
          <p key={log.id}>
            Horas Trabalhadas: {formatSeconds(seconds)}
          </p>
        );
      })}

      {/* Mostrar log ativo em tempo real, se houver */}
      {activeTimer && (
        <p>
          Horas Trabalhando Agora: {formatSeconds(activeElapsedSeconds)}
        </p>
      )}

      {/* Mostrar total acumulado */}
      <p className="font-semibold mt-1 border-t pt-1">
        Total Acumulado: {formatSeconds(totalSeconds)}
      </p>
    </div>
  );
};
