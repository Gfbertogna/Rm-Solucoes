import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Clock } from 'lucide-react';
import { ServiceOrderTask, TaskTimeLog } from '@/types/database';

interface ServiceOrderTimeReportProps {
  serviceOrderId: string;
  orderNumber: string;
  clientName: string;
}

interface TaskWithTimeLogs extends ServiceOrderTask {
  assigned_worker?: { name: string };
  time_logs: (TaskTimeLog & { worker: { name: string } })[];
  total_hours: number;
}

export const ServiceOrderTimeReport: React.FC<ServiceOrderTimeReportProps> = ({
  serviceOrderId,
  orderNumber,
  clientName,
}) => {
  const { data: tasksWithTime = [], isLoading } = useQuery({
    queryKey: ['service-order-time-report', serviceOrderId],
    queryFn: async () => {
      // Buscar tarefas com logs de tempo
      const { data: tasks, error: tasksError } = await supabase
        .from('service_order_tasks')
        .select(`
          *,
          assigned_worker:profiles!assigned_worker_id(name),
          time_logs:task_time_logs(
            *,
            worker:profiles!worker_id(name)
          )
        `)
        .eq('service_order_id', serviceOrderId)
        .order('created_at', { ascending: true });

      if (tasksError) throw tasksError;

      // Calcular total de horas para cada tarefa
      const tasksWithTotalHours = tasks.map(task => ({
        ...task,
        total_hours: task.time_logs?.reduce((total: number, log: any) => 
          total + (log.hours_worked || 0), 0) || 0
      }));

      return tasksWithTotalHours as TaskWithTimeLogs[];
    },
  });

  const getTotalServiceHours = () => {
    return tasksWithTime.reduce((total, task) => total + task.total_hours, 0);
  };

  const getTotalEstimatedHours = () => {
    return tasksWithTime.reduce((total, task) => total + (task.estimated_hours || 0), 0);
  };

  const generateFullReport = () => {
    const totalWorked = getTotalServiceHours();
    const totalEstimated = getTotalEstimatedHours();
    const variance = totalWorked - totalEstimated;
    
    let report = `RELATÓRIO COMPLETO DE HORAS\n`;
    report += `Ordem de Serviço: ${orderNumber}\n`;
    report += `Cliente: ${clientName}\n`;
    report += `Data do Relatório: ${new Date().toLocaleDateString('pt-BR')}\n`;
    report += `=====================================\n\n`;

    report += `RESUMO GERAL:\n`;
    report += `Horas Estimadas: ${totalEstimated.toFixed(2)}h\n`;
    report += `Horas Trabalhadas: ${totalWorked.toFixed(2)}h\n`;
    report += `Variação: ${variance > 0 ? '+' : ''}${variance.toFixed(2)}h\n`;
    report += `Eficiência: ${totalEstimated > 0 ? ((totalEstimated / totalWorked) * 100).toFixed(1) : 'N/A'}%\n\n`;

    report += `DETALHAMENTO POR TAREFA:\n`;
    report += `========================\n\n`;

    tasksWithTime.forEach((task, index) => {
      report += `${index + 1}. ${task.title}\n`;
      report += `   Responsável: ${task.assigned_worker?.name || 'Não atribuído'}\n`;
      report += `   Status: ${getStatusLabel(task.status)}\n`;
      report += `   Prioridade: ${getPriorityLabel(task.priority)}\n`;
      report += `   Estimado: ${task.estimated_hours || 0}h\n`;
      report += `   Trabalhado: ${task.total_hours.toFixed(2)}h\n`;
      
      if (task.estimated_hours) {
        const taskVariance = task.total_hours - task.estimated_hours;
        report += `   Variação: ${taskVariance > 0 ? '+' : ''}${taskVariance.toFixed(2)}h\n`;
      }
      
      if (task.description) {
        report += `   Descrição: ${task.description}\n`;
      }

      if (task.time_logs && task.time_logs.length > 0) {
        report += `   Sessões de Trabalho:\n`;
        task.time_logs.forEach((log, logIndex) => {
          if (log.hours_worked) {
            const date = new Date(log.start_time).toLocaleDateString('pt-BR');
            const startTime = new Date(log.start_time).toLocaleTimeString('pt-BR', { 
              hour: '2-digit', minute: '2-digit' 
            });
            const endTime = log.end_time ? new Date(log.end_time).toLocaleTimeString('pt-BR', { 
              hour: '2-digit', minute: '2-digit' 
            }) : 'Em andamento';
            
            report += `     ${logIndex + 1}. ${date} ${startTime}-${endTime} (${log.hours_worked.toFixed(2)}h) - ${log.worker.name}\n`;
            if (log.description) {
              report += `        "${log.description}"\n`;
            }
          }
        });
      }
      report += `\n`;
    });

    // Download do relatório
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-completo-${orderNumber.replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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

  if (isLoading) {
    return <div>Carregando relatório...</div>;
  }

  const totalWorked = getTotalServiceHours();
  const totalEstimated = getTotalEstimatedHours();
  const variance = totalWorked - totalEstimated;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText size={20} />
            Relatório de Horas - OS {orderNumber}
          </span>
          <Button onClick={generateFullReport} className="flex items-center gap-2">
            <Download size={16} />
            Baixar Relatório
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {totalEstimated.toFixed(1)}h
            </div>
            <div className="text-sm text-gray-500">Estimado</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {totalWorked.toFixed(1)}h
            </div>
            <div className="text-sm text-gray-500">Trabalhado</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {variance > 0 ? '+' : ''}{variance.toFixed(1)}h
            </div>
            <div className="text-sm text-gray-500">Variação</div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-sm">Resumo por Tarefa</h4>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {tasksWithTime.map((task) => (
              <div key={task.id} className="bg-gray-50 p-3 rounded text-sm">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium">{task.title}</span>
                  <span className="font-mono text-green-600">
                    {task.total_hours.toFixed(2)}h
                  </span>
                </div>
                <div className="text-gray-600 text-xs">
                  {task.assigned_worker?.name || 'Não atribuído'} • 
                  Estimado: {task.estimated_hours || 0}h
                  {task.estimated_hours && (
                    <span className={task.total_hours > task.estimated_hours ? 'text-red-600 ml-1' : 'text-green-600 ml-1'}>
                      ({task.total_hours > task.estimated_hours ? '+' : ''}{(task.total_hours - task.estimated_hours).toFixed(1)}h)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};