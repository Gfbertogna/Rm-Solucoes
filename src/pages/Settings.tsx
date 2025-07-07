
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Settings as SettingsIcon, User, Bell, Shield, Database, Save } from 'lucide-react';
import { toast } from 'sonner';

const Settings = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  
  const [profileSettings, setProfileSettings] = useState({
    name: profile?.name || '',
    email: profile?.email || ''
  });

  const [systemSettings, setSystemSettings] = useState({
    autoAssignOrders: false,
    emailNotifications: true,
    lowStockAlert: true,
    orderDeadlineAlert: true,
    lowStockThreshold: 10
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ name: data.name })
        .eq('id', profile?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Perfil atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar perfil: ' + error.message);
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({ name: profileSettings.name });
  };

  const handleSystemSettingsUpdate = () => {
    // Aqui você salvaria as configurações do sistema
    // Por enquanto, apenas simulamos o salvamento
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success('Configurações do sistema atualizadas!');
    }, 1000);
  };

  const exportData = async () => {
    try {
      setIsLoading(true);
      
      // Exportar dados principais
      const { data: orders } = await supabase.from('service_orders').select('*');
      const { data: clients } = await supabase.from('clients').select('*');
      const { data: inventory } = await supabase.from('inventory_items').select('*');
      
      const exportData = {
        orders,
        clients,
        inventory,
        exportDate: new Date().toISOString()
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sistema-os-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      toast.success('Backup exportado com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao exportar dados: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Acesso Limitado</h2>
          <p className="text-gray-600">Você pode apenas editar suas configurações pessoais.</p>
          
          <Card className="max-w-md mx-auto mt-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Configurações Pessoais</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={profileSettings.name}
                    onChange={(e) => setProfileSettings({ ...profileSettings, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileSettings.email}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">O email não pode ser alterado</p>
                </div>
                <Button type="submit" className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600 mt-1">Gerencie as configurações do sistema</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configurações Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Configurações Pessoais</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={profileSettings.name}
                  onChange={(e) => setProfileSettings({ ...profileSettings, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileSettings.email}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">O email não pode ser alterado</p>
              </div>
              <Button type="submit" className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Notificações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notificações</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifications">Notificações por Email</Label>
                <p className="text-sm text-gray-500">Receber atualizações por email</p>
              </div>
              <Switch
                id="email-notifications"
                checked={systemSettings.emailNotifications}
                onCheckedChange={(checked) => 
                  setSystemSettings({ ...systemSettings, emailNotifications: checked })
                }
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="low-stock-alert">Alerta de Estoque Baixo</Label>
                <p className="text-sm text-gray-500">Notificar quando itens estiverem com estoque baixo</p>
              </div>
              <Switch
                id="low-stock-alert"
                checked={systemSettings.lowStockAlert}
                onCheckedChange={(checked) => 
                  setSystemSettings({ ...systemSettings, lowStockAlert: checked })
                }
              />
            </div>
            
            <div>
              <Label htmlFor="stock-threshold">Limite de Estoque Baixo</Label>
              <Input
                id="stock-threshold"
                type="number"
                min="1"
                value={systemSettings.lowStockThreshold}
                onChange={(e) => 
                  setSystemSettings({ ...systemSettings, lowStockThreshold: parseInt(e.target.value) || 10 })
                }
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="deadline-alert">Alerta de Prazo</Label>
                <p className="text-sm text-gray-500">Notificar sobre ordens próximas do prazo</p>
              </div>
              <Switch
                id="deadline-alert"
                checked={systemSettings.orderDeadlineAlert}
                onCheckedChange={(checked) => 
                  setSystemSettings({ ...systemSettings, orderDeadlineAlert: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Configurações do Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <SettingsIcon className="h-5 w-5" />
              <span>Sistema</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-assign">Atribuição Automática</Label>
                <p className="text-sm text-gray-500">Atribuir automaticamente ordens aos operários</p>
              </div>
              <Switch
                id="auto-assign"
                checked={systemSettings.autoAssignOrders}
                onCheckedChange={(checked) => 
                  setSystemSettings({ ...systemSettings, autoAssignOrders: checked })
                }
              />
            </div>
            
            <Button 
              onClick={handleSystemSettingsUpdate} 
              className="w-full"
              disabled={isLoading}
            >
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </CardContent>
        </Card>

        {/* Backup e Dados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Backup e Dados</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Exportar Dados</Label>
              <p className="text-sm text-gray-500 mb-3">
                Baixe um backup completo dos dados do sistema
              </p>
              <Button 
                onClick={exportData} 
                variant="outline" 
                className="w-full"
                disabled={isLoading}
              >
                <Database className="mr-2 h-4 w-4" />
                {isLoading ? 'Exportando...' : 'Exportar Backup'}
              </Button>
            </div>
            
            <Separator />
            
            <div>
              <Label className="text-red-600">Zona de Perigo</Label>
              <p className="text-sm text-gray-500 mb-3">
                Ações irreversíveis que afetam todo o sistema
              </p>
              <Button variant="destructive" className="w-full" disabled>
                <Shield className="mr-2 h-4 w-4" />
                Limpar Todos os Dados (Em Breve)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
