
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Plus, Edit, Trash2, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

const Employees = () => {
  const { profile, createUser } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'worker' as 'admin' | 'manager' | 'worker'
  });
  const [createFormData, setCreateFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'worker' as 'admin' | 'manager' | 'worker'
  });

  const { data: employees = [], isLoading, refetch } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching employees:', error);
        throw error;
      }
      return data as Profile[];
    },
    enabled: !!profile && ['admin', 'manager'].includes(profile.role),
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Profile> & { id: string }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating employee:', error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Funcionário atualizado com sucesso!');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error('Update employee error:', error);
      toast.error('Erro ao atualizar funcionário: ' + error.message);
    },
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; password: string; role: string }) => {
      if (!profile) {
        throw new Error('Usuário não autenticado');
      }

      if (!['admin', 'manager'].includes(profile.role)) {
        throw new Error('Usuário não tem permissão para criar funcionários');
      }

      const result = await createUser(data.email, data.password, data.name, data.role);
      
      if (result.error) {
        throw result.error;
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Funcionário criado com sucesso!');
      setIsCreateDialogOpen(false);
      resetCreateForm();
    },
    onError: (error: any) => {
      console.error('Create employee error:', error);
      toast.error('Erro ao criar funcionário: ' + (error.message || 'Erro desconhecido'));
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('=== DELETE EMPLOYEE MUTATION ===');
      console.log('Tentando excluir funcionário ID:', id);
      console.log('Usuário atual:', profile);
      
      // Verificar se há ordens de serviço associadas
      const { data: orders, error: ordersError } = await supabase
        .from('service_orders')
        .select('id, order_number')
        .or(`assigned_worker_id.eq.${id},created_by.eq.${id}`)
        .limit(5);

      if (ordersError) {
        console.error('Erro ao verificar ordens de serviço:', ordersError);
        throw new Error('Erro ao verificar ordens de serviço associadas');
      }

      console.log('Ordens encontradas:', orders);

      // Verificar se há tarefas associadas
      const { data: tasks, error: tasksError } = await supabase
        .from('service_order_tasks')
        .select('id, title')
        .or(`assigned_worker_id.eq.${id},created_by.eq.${id}`)
        .limit(5);

      if (tasksError) {
        console.error('Erro ao verificar tarefas:', tasksError);
        throw new Error('Erro ao verificar tarefas associadas');
      }

      console.log('Tarefas encontradas:', tasks);

      // Se houver associações, bloquear exclusão
      if (orders && orders.length > 0) {
        const orderNumbers = orders.map(o => o.order_number).join(', ');
        throw new Error(`Não é possível excluir funcionário. Existem ${orders.length} ordem(ns) de serviço associada(s): ${orderNumbers}`);
      }

      if (tasks && tasks.length > 0) {
        const taskTitles = tasks.map(t => t.title).slice(0, 3).join(', ');
        const moreText = tasks.length > 3 ? ` e mais ${tasks.length - 3}` : '';
        throw new Error(`Não é possível excluir funcionário. Existem ${tasks.length} tarefa(s) associada(s): ${taskTitles}${moreText}`);
      }

      // Tentar excluir o funcionário
      console.log('Nenhuma associação encontrada, prosseguindo com exclusão...');
      
      const { data: deletedProfile, error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id)
        .select()
        .single();
      
      if (deleteError) {
        console.error('Erro na exclusão do profile:', deleteError);
        console.error('Código do erro:', deleteError.code);
        console.error('Detalhes do erro:', deleteError.details);
        console.error('Hint do erro:', deleteError.hint);
        throw new Error(`Erro ao excluir funcionário: ${deleteError.message}`);
      }

      console.log('Profile excluído com sucesso:', deletedProfile);

      // Tentar excluir o usuário do auth (se possível)
      try {
        const { error: authError } = await supabase.auth.admin.deleteUser(id);
        if (authError) {
          console.warn('Aviso: Não foi possível excluir usuário do auth:', authError.message);
          // Não falha a operação se não conseguir excluir do auth
        } else {
          console.log('Usuário excluído do auth também');
        }
      } catch (authError) {
        console.warn('Aviso: Erro ao tentar excluir do auth:', authError);
        // Não falha a operação se não conseguir excluir do auth
      }

      return { success: true, deleted: deletedProfile };
    },
    onSuccess: (result) => {
      console.log('Exclusão bem-sucedida:', result);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Funcionário excluído com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro na exclusão:', error);
      toast.error(error.message || 'Erro ao excluir funcionário');
    },
  });

  const resetForm = () => {
    setFormData({ name: '', email: '', role: 'worker' });
    setEditingEmployee(null);
  };

  const resetCreateForm = () => {
    setCreateFormData({ name: '', email: '', password: '', role: 'worker' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingEmployee) {
      updateEmployeeMutation.mutate({ id: editingEmployee.id, ...formData });
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile) {
      toast.error('Usuário não autenticado');
      return;
    }

    if (!['admin', 'manager'].includes(profile.role)) {
      toast.error('Usuário não tem permissão para criar funcionários');
      return;
    }

    createEmployeeMutation.mutate(createFormData);
  };

  const handleEdit = (employee: Profile) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      role: employee.role
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (employee: Profile) => {
    const confirmMessage = `Tem certeza que deseja excluir o funcionário ${employee.name}?\n\nEsta ação não pode ser desfeita.\n\nAtenção: Se houver ordens de serviço ou tarefas associadas, a exclusão não será permitida.`;
    
    if (window.confirm(confirmMessage)) {
      console.log('=== INICIANDO EXCLUSÃO ===');
      console.log('Funcionário a ser excluído:', employee.name, employee.id);
      console.log('Usuário que está excluindo:', profile?.name, profile?.role);
      deleteEmployeeMutation.mutate(employee.id);
    }
  };

  const getAvailableRoles = () => {
    if (!profile) return [];
    
    if (profile.role === 'admin') {
      return [
        { value: 'manager', label: 'Gerente' },
        { value: 'worker', label: 'Operário' }
      ];
    }
    
    if (profile.role === 'manager') {
      return [
        { value: 'worker', label: 'Operário' }
      ];
    }
    
    return [];
  };

  const getEditableRoles = () => {
    if (!profile) return [];
    
    if (profile.role === 'admin') {
      return [
        { value: 'admin', label: 'Administrador' },
        { value: 'manager', label: 'Gerente' },
        { value: 'worker', label: 'Operário' }
      ];
    }
    
    if (profile.role === 'manager') {
      return [
        { value: 'manager', label: 'Gerente' },
        { value: 'worker', label: 'Operário' }
      ];
    }
    
    return [];
  };

  const canDeleteEmployee = (employee: Profile) => {
    if (!profile) return false;
    
    // Admin pode deletar qualquer um exceto outros admins
    if (profile.role === 'admin') {
      return employee.role !== 'admin';
    }
    
    // Manager pode deletar apenas workers
    if (profile.role === 'manager') {
      return employee.role === 'worker';
    }
    
    return false;
  };

  const canEditEmployee = (employee: Profile) => {
    if (!profile) return false;
    
    // Admin pode editar qualquer um
    if (profile.role === 'admin') {
      return true;
    }
    
    // Manager pode editar apenas workers
    if (profile.role === 'manager') {
      return employee.role === 'worker';
    }
    
    return false;
  };

  const canCreateEmployees = () => {
    if (!profile) return false;
    return ['admin', 'manager'].includes(profile.role);
  };

  const hasAccess = () => {
    if (!profile) return false;
    return ['admin', 'manager'].includes(profile.role);
  };

  if (!hasAccess()) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h2>
          <p className="text-gray-600">Apenas administradores e gerentes podem gerenciar funcionários.</p>
          <p className="text-sm text-gray-500 mt-2">Seu perfil atual: {profile?.role || 'Não identificado'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Funcionários</h1>
          <p className="text-gray-600 mt-1">Gerencie os funcionários da empresa</p>
        </div>
        <div className="flex space-x-2">
          {canCreateEmployees() && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetCreateForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Funcionário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Novo Funcionário</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="create-name">Nome</Label>
                    <Input
                      id="create-name"
                      value={createFormData.name}
                      onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-email">Email</Label>
                    <Input
                      id="create-email"
                      type="email"
                      value={createFormData.email}
                      onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-password">Senha</Label>
                    <Input
                      id="create-password"
                      type="password"
                      value={createFormData.password}
                      onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-role">Perfil</Label>
                    <Select 
                      value={createFormData.role} 
                      onValueChange={(value: 'admin' | 'manager' | 'worker') => 
                        setCreateFormData({ ...createFormData, role: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o perfil" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableRoles().map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={createEmployeeMutation.isPending}
                  >
                    {createEmployeeMutation.isPending ? 'Criando...' : 'Criar Funcionário'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" style={{ display: 'none' }}>
                Editar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Funcionário</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="role">Perfil</Label>
                  <Select value={formData.role} onValueChange={(value: 'admin' | 'manager' | 'worker') => setFormData({ ...formData, role: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      {getEditableRoles().map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={updateEmployeeMutation.isPending}
                >
                  {updateEmployeeMutation.isPending ? 'Atualizando...' : 'Atualizar Funcionário'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-800">
          <strong>Importante:</strong> Administradores devem ser cadastrados exclusivamente via banco de dados. 
          {profile?.role === 'admin' && ' Você pode cadastrar Gerentes e Operários através desta interface.'}
          {profile?.role === 'manager' && ' Você pode cadastrar apenas Operários através desta interface.'}
        </p>
        <p className="text-sm text-amber-700 mt-2">
          <strong>Nota sobre exclusão:</strong> Funcionários com ordens de serviço ou tarefas associadas não podem ser excluídos. 
          Remova ou transfira as associações antes de tentar excluir.
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando funcionários...</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {employees.map((employee) => (
            <Card key={employee.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-gray-500" />
                  <CardTitle className="text-lg">{employee.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <UserCheck className="h-4 w-4" />
                    <span>{employee.email}</span>
                  </div>
                  <div className="text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      employee.role === 'admin' ? 'bg-red-100 text-red-800' :
                      employee.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {employee.role === 'admin' ? 'Administrador' :
                       employee.role === 'manager' ? 'Gerente' : 'Operário'}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {canEditEmployee(employee) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(employee)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  )}
                  {canDeleteEmployee(employee) && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(employee)}
                      disabled={deleteEmployeeMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      {deleteEmployeeMutation.isPending ? 'Excluindo...' : 'Excluir'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Employees;
