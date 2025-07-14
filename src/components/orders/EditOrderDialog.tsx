import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ServiceOrder, OrderStatus, Urgency } from '@/types/database';
import { useServiceOrders, useWorkers } from '@/hooks/useServiceOrders';
import OnHoldReasonDialog from './OnHoldReasonDialog';
import { useServiceOrderCalls } from '@/hooks/useServiceOrderCalls';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface EditOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: ServiceOrder & { assigned_worker?: { name: string } };
}

const EditOrderDialog: React.FC<EditOrderDialogProps> = ({
  open,
  onOpenChange,
  order,
}) => {
  const { updateOrder, isUpdating } = useServiceOrders();
  const { workers } = useWorkers();
  const { createCall } = useServiceOrderCalls();
  const { user } = useAuth(); // ✅ obter usuário autenticado

  const [formData, setFormData] = useState({
    client_name: '',
    client_contact: '',
    client_address: '',
    service_description: '',
    sale_value: '',
    status: 'pending' as OrderStatus,
    urgency: 'medium' as Urgency,
    assigned_worker_id: '',
    deadline: '',
  });

  const [showOnHoldDialog, setShowOnHoldDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);

  useEffect(() => {
    if (order) {
      setFormData({
        client_name: order.client_name || '',
        client_contact: order.client_contact || '',
        client_address: order.client_address || '',
        service_description: order.service_description || '',
        sale_value: order.sale_value?.toString() || '',
        status: order.status,
        urgency: order.urgency,
        assigned_worker_id: order.assigned_worker_id || 'unassigned',
        deadline: order.deadline || '',
      });
    }
  }, [order]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const updateData = {
      id: order.id,
      ...formData,
      sale_value: formData.sale_value ? parseFloat(formData.sale_value) : null,
      assigned_worker_id:
        formData.assigned_worker_id === 'unassigned'
          ? null
          : formData.assigned_worker_id,
      deadline: formData.deadline || null,
    };

    await updateOrder(updateData);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Editar Ordem de Serviço - {order?.order_number}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client_name">Nome do Cliente</Label>
                <Input
                  id="client_name"
                  value={formData.client_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      client_name: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="client_contact">Contato do Cliente</Label>
                <Input
                  id="client_contact"
                  value={formData.client_contact}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      client_contact: e.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="client_address">Endereço do Cliente</Label>
              <Input
                id="client_address"
                value={formData.client_address}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    client_address: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="service_description">Descrição do Serviço</Label>
              <Textarea
                id="service_description"
                value={formData.service_description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    service_description: e.target.value,
                  }))
                }
                required
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sale_value">Valor de Venda (R$)</Label>
                <Input
                  id="sale_value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.sale_value}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      sale_value: e.target.value,
                    }))
                  }
                  placeholder="0,00"
                />
              </div>

              <div>
                <Label htmlFor="deadline">Prazo</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      deadline: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => {
                    if (value === 'on_hold') {
                      setPendingStatus(value as OrderStatus);
                      setShowOnHoldDialog(true);
                    } else {
                      setFormData((prev) => ({
                        ...prev,
                        status: value as OrderStatus,
                      }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="production">Em Produção</SelectItem>
                    <SelectItem value="on_hold">Em Espera</SelectItem>
                    <SelectItem value="stopped">Paralisado</SelectItem>
                    <SelectItem value="quality_control">
                      Controle de Qualidade
                    </SelectItem>
                    <SelectItem value="ready_for_pickup">
                      Aguardando Retirada
                    </SelectItem>
                    <SelectItem value="awaiting_installation">
                      Aguardando Instalação
                    </SelectItem>
                    <SelectItem value="to_invoice">Faturar</SelectItem>
                    <SelectItem value="completed">Finalizado</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="urgency">Urgência</Label>
                <Select
                  value={formData.urgency}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      urgency: value as Urgency,
                    }))
                  }
                >
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
                <Label htmlFor="assigned_worker">Colaborador</Label>
                <Select
                  value={formData.assigned_worker_id}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      assigned_worker_id: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar colaborador" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Não atribuído</SelectItem>
                    {workers.map((worker) => (
                      <SelectItem key={worker.id} value={worker.id}>
                        {worker.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <OnHoldReasonDialog
        open={showOnHoldDialog}
        onOpenChange={setShowOnHoldDialog}
        serviceOrderId={order.id}
        onReasonSubmitted={async (reason) => {
          if (pendingStatus && reason) {
            setFormData((prev) => ({
              ...prev,
              status: pendingStatus,
            }));
            setPendingStatus(null);

            try {
              await createCall({
                service_order_id: order.id,
                reason,
                created_by: user?.id || '', // ✅ via contexto
              });
              toast.success('Chamado criado com sucesso');
            } catch (err) {
              toast.error('Erro ao criar chamado');
              console.error(err);
            }
          }
        }}
      />
    </>
  );
};

export default EditOrderDialog;
