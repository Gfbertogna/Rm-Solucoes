
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';

const CreateWorkerCard = () => {
  const { profile, createUser } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const createWorkerMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; password: string }) => {
      console.log('=== CREATE WORKER FROM DASHBOARD ===');
      console.log('Creating worker with data:', data);
      console.log('Current user profile:', profile);

      if (!profile) {
        throw new Error('Usuário não autenticado');
      }

      if (profile.role !== 'manager') {
        throw new Error('Apenas gerentes podem usar esta função');
      }

      console.log('Calling createUser function...');
      const result = await createUser(data.email, data.password, data.name, 'worker');
      console.log('createUser result:', result);
      
      if (result.error) {
        console.error('Create worker error:', result.error);
        throw result.error;
      }
      
      console.log('Worker created successfully:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Operário criado com sucesso!');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error('Create worker error:', error);
      toast.error('Erro ao criar operário: ' + (error.message || 'Erro desconhecido'));
    },
  });

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== HANDLE CREATE WORKER SUBMIT ===');
    console.log('Form data:', formData);
    
    if (!profile) {
      toast.error('Usuário não autenticado');
      return;
    }

    if (profile.role !== 'manager') {
      toast.error('Apenas gerentes podem criar operários');
      return;
    }

    console.log('Submitting create worker:', formData);
    createWorkerMutation.mutate(formData);
  };

  // Só mostrar para gerentes
  if (!profile || profile.role !== 'manager') {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Cadastrar Operário</CardTitle>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} size="sm">
                <UserPlus className="mr-2 h-4 w-4" />
                Novo Operário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Operário</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="worker-name">Nome</Label>
                  <Input
                    id="worker-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Nome completo do operário"
                  />
                </div>
                <div>
                  <Label htmlFor="worker-email">Email</Label>
                  <Input
                    id="worker-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div>
                  <Label htmlFor="worker-password">Senha</Label>
                  <Input
                    id="worker-password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createWorkerMutation.isPending}
                >
                  {createWorkerMutation.isPending ? 'Criando...' : 'Criar Operário'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">
          Como gerente, você pode cadastrar novos operários para sua equipe.
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Os operários terão acesso às ordens de serviço atribuídas a eles.
        </p>
      </CardContent>
    </Card>
  );
};

export default CreateWorkerCard;
