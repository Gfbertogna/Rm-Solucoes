
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useServiceOrders, useWorkers } from '@/hooks/useServiceOrders';
import { useClients } from '@/hooks/useClients';
import { useAuth } from '@/contexts/AuthContext';

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateOrderDialog: React.FC<CreateOrderDialogProps> = ({ open, onOpenChange }) => {
  const { profile } = useAuth();
  const { createOrder, isCreating } = useServiceOrders();
  const { workers } = useWorkers();
  const { clients, isLoading: isLoadingClients } = useClients();
  
  const [formData, setFormData] = useState({
    client_id: '',
    client_name: '',
    client_contact: '',
    client_address: '',
    service_description: '',
    sale_value: '',
    urgency: 'medium' as 'low' | 'medium' | 'high',
    assigned_worker_id: '',
    deadline: '',
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        client_id: '',
        client_name: '',
        client_contact: '',
        client_address: '',
        service_description: '',
        sale_value: '',
        urgency: 'medium',
        assigned_worker_id: '',
        deadline: '',
      });
    }
  }, [open]);

  // Handle client selection
  const handleClientChange = (clientId: string) => {
    const selectedClient = clients.find(client => client.id === clientId);
    if (selectedClient) {
      setFormData(prev => ({
        ...prev,
        client_id: clientId,
        client_name: selectedClient.name,
        client_contact: selectedClient.contact,
        client_address: selectedClient.address,
      }));
    } else {
      // "new_client" option selected
      setFormData(prev => ({
        ...prev,
        client_id: '',
        client_name: '',
        client_contact: '',
        client_address: '',
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const orderData = {
      ...formData,
      sale_value: formData.sale_value ? parseFloat(formData.sale_value) : undefined,
      deadline: formData.deadline || undefined,
      assigned_worker_id: formData.assigned_worker_id || undefined,
      client_id: formData.client_id || undefined,
      created_by: profile?.id,
    };

    createOrder(orderData);
    onOpenChange(false);
  };

  const canSetSaleValue = profile?.role === 'admin';
  const canAssignWorker = profile?.role !== 'worker';
 

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Ordem de Serviço</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client Selection */}
          <div className="space-y-2">
            <Label htmlFor="client_select">Cliente</Label>
            <Select 
              value={formData.client_id || 'new_client'} 
              onValueChange={handleClientChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente ou cadastre novo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new_client">+ Cadastrar novo cliente</SelectItem>
                {!isLoadingClients && clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_name">Nome do Cliente *</Label>
              <Input
                id="client_name"
                value={formData.client_name}
                onChange={(e) => setFormData(prev => ({ ...prev, client_name: e.target.value }))}
                required
                disabled={!!formData.client_id}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="client_contact">Contato do Cliente *</Label>
              <Input
                id="client_contact"
                value={formData.client_contact}
                onChange={(e) => setFormData(prev => ({ ...prev, client_contact: e.target.value }))}
                required
                disabled={!!formData.client_id}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="client_address">Endereço do Cliente *</Label>
            <Input
              id="client_address"
              value={formData.client_address}
              onChange={(e) => setFormData(prev => ({ ...prev, client_address: e.target.value }))}
              required
              disabled={!!formData.client_id}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="service_description">Descrição do Serviço *</Label>
            <Textarea
              id="service_description"
              value={formData.service_description}
              onChange={(e) => setFormData(prev => ({ ...prev, service_description: e.target.value }))}
              rows={3}
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {canSetSaleValue && (
              <div className="space-y-2">
                <Label htmlFor="sale_value">Valor de Venda (R$)</Label>
                <Input
                  id="sale_value"
                  type="number"
                  step="0.01"
                  value={formData.sale_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, sale_value: e.target.value }))}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="urgency">Urgência</Label>
              <Select value={formData.urgency} onValueChange={(value: 'low' | 'medium' | 'high') => 
                setFormData(prev => ({ ...prev, urgency: value }))
              }>
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
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {canAssignWorker && (
              <div className="space-y-2">
                <Label htmlFor="assigned_worker_id">Operário Atribuído</Label>
                <Select value={formData.assigned_worker_id} onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, assigned_worker_id: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um operário" />
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
            )}
            
            <div className="space-y-2">
              <Label htmlFor="deadline">Prazo de Conclusão</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Criando...' : 'Criar Ordem'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateOrderDialog;
