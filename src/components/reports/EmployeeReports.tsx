
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Clock, Target, TrendingUp, Loader2 } from 'lucide-react';

const EmployeeReports = () => {
  const { data: employeeStats, isLoading } = useQuery({
    queryKey: ['employee-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_task_stats')
        .select('*')
        .order('total_hours_worked', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="flex items-center gap-2">
          <Loader2 className="animate-spin" size={20} />
          <span>Carregando relatórios dos funcionários...</span>
        </div>
      </div>
    );
  }

  const totalWorkers = employeeStats?.length || 0;
  const totalHours = employeeStats?.reduce((sum, emp) => sum + (Number(emp.total_hours_worked) || 0), 0) || 0;
  const totalTasks = employeeStats?.reduce((sum, emp) => sum + (Number(emp.total_tasks) || 0), 0) || 0;
  const avgHoursPerWorker = totalWorkers > 0 ? totalHours / totalWorkers : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Relatórios dos Funcionários</h2>
        <p className="text-gray-600 mt-1">Estatísticas de desempenho e produtividade</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Funcionários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWorkers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Horas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours.toFixed(1)}h</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média de Horas/Funcionário</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgHoursPerWorker.toFixed(1)}h</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle>Desempenho Individual dos Funcionários</CardTitle>
        </CardHeader>
        <CardContent>
          {employeeStats && employeeStats.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Total de Tarefas</TableHead>
                  <TableHead>Tarefas Concluídas</TableHead>
                  <TableHead>Total de Horas</TableHead>
                  <TableHead>Tempo Médio por Tarefa</TableHead>
                  <TableHead>Taxa de Conclusão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeeStats.map((employee) => {
                  const completionRate = employee.total_tasks > 0 
                    ? ((employee.completed_tasks / employee.total_tasks) * 100).toFixed(1)
                    : '0.0';
                  
                  return (
                    <TableRow key={employee.worker_id}>
                      <TableCell className="font-medium">{employee.worker_name}</TableCell>
                      <TableCell>{employee.total_tasks}</TableCell>
                      <TableCell>{employee.completed_tasks}</TableCell>
                      <TableCell>{Number(employee.total_hours_worked).toFixed(1)}h</TableCell>
                      <TableCell>{Number(employee.avg_hours_per_task).toFixed(1)}h</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          Number(completionRate) >= 80 
                            ? 'bg-green-100 text-green-800'
                            : Number(completionRate) >= 60
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {completionRate}%
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p>Nenhum dado de funcionário encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeReports;
