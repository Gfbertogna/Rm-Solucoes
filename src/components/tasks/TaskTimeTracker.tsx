import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Square, Clock, User, FileText } from 'lucide-react';
import { useTimeTracking } from '@/hooks/useServiceOrderTasks';
import { useAuth } from '@/contexts/AuthContext';
import { TaskTimeLog } from '@/types/database';

interface TaskTimeTrackerProps {
  taskId: string;
  taskTitle: string;
  assignedWorkerId?: string;
  assignedWorkerName?: string;
  estimatedHours?: number;
}

export const TaskTimeTracker: React.FC<TaskTimeTrackerProps> = ({
  taskId,
  taskTitle,
  assignedWorkerId,
  assignedWorkerName,
  estimatedHours,
}) => {
  const { profile } = useAuth();
  const { timeLogs, startTimer, stopTimer, isStarting, isStopping } = useTimeTracking(taskId);
  const [currentLog, setCurrentLog] = useState<TaskTimeLog | null>(null);
  const [currentSessionTime, setCurrentSessionTime] = useState(0);
  const [showReport, setShowReport] = useState(false);

  // Find active time log
  useEffect(() => {
    const activeLog = timeLogs.find(log => !log.end_time && log.worker_id === profile?.id);
    setCurrentLog(activeLog || null);
  }, [timeLogs, profile?.id]);

  // Update current session time for active log
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (currentLog) {
      interval = setInterval(() => {
        const startTime = new Date(currentLog.start_time);
        const now = new Date();
        const elapsed = (now.getTime() - startTime.getTime()) / 1000; // seconds
        setCurrentSessionTime(elapsed);
      }, 1000);
    } else {
      setCurrentSessionTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentLog]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeRange = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    
    const startFormatted = start.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const endFormatted = end.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    return `${startFormatted} - ${endFormatted}`;
  };

  const getTotalHours = () => {
    const completedHours = timeLogs.reduce((total, log) => total + (log.hours_worked || 0), 0);
    const currentHours = currentSessionTime / 3600;
    return completedHours + currentHours;
  };

  const getTotalCompletedHours = () => {
    return timeLogs.reduce((total, log) => total + (log.hours_worked || 0), 0);
  };

  const handleStart = () => {
    if (profile?.id) {
      startTimer(profile.id);
    }
  };

  const handleStop = () => {
    if (currentLog) {
      const description = prompt('Adicione uma descrição opcional para esta sessão de trabalho:');
      stopTimer({ id: currentLog.id, description: description || undefined });
    }
  };

  const generateTimeReport = () => {
    const completedLogs = timeLogs.filter(log => log.end_time);
    const totalHours = getTotalCompletedHours();
    
    let report = `RELATÓRIO DE HORAS - ${taskTitle}\n`;
    report += `=====================================\n\n`;
    report += `Funcionário: ${assignedWorkerName || 'Não atribuído'}\n`;
    report += `Horas Estimadas: ${estimatedHours || 'N/A'}h\n`;
    report += `Total de Horas Trabalhadas: ${totalHours.toFixed(2)}h\n\n`;
    
    if (estimatedHours) {
      const variance = totalHours - estimatedHours;
      report += `Variação: ${variance > 0 ? '+' : ''}${variance.toFixed(2)}h\n\n`;
    }
    
    report += `SESSÕES DE TRABALHO:\n`;
    report += `--------------------\n`;
    
    completedLogs.forEach((log, index) => {
      const date = new Date(log.start_time).toLocaleDateString('pt-BR');
      const timeRange = formatTimeRange(log.start_time, log.end_time!);
      const duration = log.hours_worked?.toFixed(2) || '0.00';
      
      report += `${index + 1}. ${date} - ${timeRange} (${duration}h)\n`;
      if (log.description) {
        report += `   Descrição: ${log.description}\n`;
      }
    });
    
    // Download do relatório
    const blob = new Blob([report], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-horas-${taskTitle.replace(/\s+/g, '-').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const canControl = profile?.id === assignedWorkerId || ['admin', 'manager'].includes(profile?.role || '');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Clock size={20} />
            {taskTitle}
          </span>
          <div className="flex items-center gap-2">
            <Badge variant={currentLog ? "default" : "secondary"}>
              {currentLog ? 'Em Execução' : 'Parada'}
            </Badge>
            {getTotalCompletedHours() > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={generateTimeReport}
                className="flex items-center gap-1"
              >
                <FileText size={14} />
                Relatório
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Assigned Worker Info */}
        {assignedWorkerName && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User size={16} />
            <span>Responsável: {assignedWorkerName}</span>
          </div>
        )}

        {/* Time Display */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-xl font-mono font-bold text-blue-600">
              {formatTime(currentSessionTime)}
            </div>
            <div className="text-xs text-gray-500">Sessão Atual</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-mono font-bold text-green-600">
              {getTotalCompletedHours().toFixed(2)}h
            </div>
            <div className="text-xs text-gray-500">Total Concluído</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-mono font-bold text-purple-600">
              {getTotalHours().toFixed(2)}h
            </div>
            <div className="text-xs text-gray-500">Total Geral</div>
          </div>
        </div>

        {/* Current Session Info */}
        {currentLog && (
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <div className="text-sm font-medium text-blue-800">Sessão Ativa</div>
            <div className="text-xs text-blue-600">
              Iniciada às {new Date(currentLog.start_time).toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        )}

        {/* Estimated vs Actual */}
        {estimatedHours && (
          <div className="flex justify-between text-sm">
            <span>Estimado: {estimatedHours}h</span>
            <span className={getTotalHours() > estimatedHours ? 'text-red-600' : 'text-green-600'}>
              {getTotalHours() > estimatedHours ? 'Acima' : 'Dentro'} do prazo
            </span>
          </div>
        )}

        {/* Control Buttons */}
        {canControl && (
          <div className="flex gap-2">
            {!currentLog ? (
              <Button 
                onClick={handleStart} 
                disabled={isStarting}
                className="flex-1"
              >
                <Play size={16} className="mr-2" />
                {isStarting ? 'Iniciando...' : 'Iniciar'}
              </Button>
            ) : (
              <Button 
                onClick={handleStop} 
                disabled={isStopping}
                variant="destructive"
                className="flex-1"
              >
                <Square size={16} className="mr-2" />
                {isStopping ? 'Parando...' : 'Parar'}
              </Button>
            )}
          </div>
        )}

        {/* Time Logs History */}
        {timeLogs.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Histórico de Sessões</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReport(!showReport)}
                className="text-xs"
              >
                {showReport ? 'Ocultar' : 'Mostrar'} Detalhes
              </Button>
            </div>
            
            {showReport && (
              <div className="max-h-40 overflow-y-auto space-y-2">
                {timeLogs.map((log) => (
                  <div key={log.id} className="text-xs bg-gray-50 p-3 rounded">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium">{log.worker?.name}</span>
                      <span className="font-mono">
                        {log.hours_worked ? `${log.hours_worked.toFixed(2)}h` : 'Em andamento'}
                      </span>
                    </div>
                    <div className="text-gray-600">
                      {formatTimeRange(log.start_time, log.end_time)}
                    </div>
                    {log.description && (
                      <div className="text-gray-500 mt-1 italic">
                        "{log.description}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {!showReport && (
              <div className="text-xs text-gray-500 text-center py-2">
                {timeLogs.length} sessão(ões) registrada(s)
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};