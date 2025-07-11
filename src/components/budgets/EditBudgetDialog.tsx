import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface BudgetItem {
  id?: number;
  service_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface EditBudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget: any; // ideal tipar melhor
}

const EditBudgetDialog: React.FC<EditBudgetDialogProps> = ({
  open,
  onOpenChange,
  budget,
}) => {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    client_name: '',
    client_contact: '',
    client_address: '',
    description: '',
    valid_until: '',
    status: 'pendente',
  });

  const [items, setItems] = useState<BudgetItem[]>([]);

  // Puxa itens do orçamento quando abrir modal e tiver budget
  useEffect(() => {
    if (budget && open) {
      setFormData({
        client_name: budget.client_name || '',
        client_contact: budget.client_contact || '',
        client_address: budget.client_address || '',
        description: budget.description || '',
        valid_until: budget.valid_until?.split('T')[0] || '',
        status: budget.status || 'pendente',
      });

      // Puxar itens do banco
      supabase
        .from('budget_items')
        .select('*')
        .eq('budget_id', budget.id)
        .then(({ data, error }) => {
          if (error) {
            toast.error('Erro ao carregar itens: ' + error.message);
            setItems([]);
          } else {
            setItems(
              (data || []).map((item: any) => ({
                id: item.id,
                service_name: item.service_name,
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total_price: item.total_price,
              }))
            );
          }
        });
    } else {
      setFormData({
        client_name: '',
        client_contact: '',
        client_address: '',
        description: '',
        valid_until: '',
        status: 'pendente',
      });
      setItems([]);
    }
  }, [budget, open]);

  // Handle form changes
  const handleItemChange = (index: number, field: keyof BudgetItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Recalcula total_price se quantity ou unit_price mudar
    if (field === 'quantity' || field === 'unit_price') {
      const qty = Number(newItems[index].quantity) || 0;
      const price = Number(newItems[index].unit_price) || 0;
      newItems[index].total_price = qty * price;
    }

    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        service_name: '',
        description: '',
        quantity: 1,
        unit_price: 0,
        total_price: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  // Total geral do orçamento
  const getTotalValue = () => {
    return items.reduce((acc, item) => acc + (item.total_price || 0), 0);
  };

  // Mutação para atualizar orçamento + itens
  const updateBudget = useMutation({
    mutationFn: async () => {
      // Atualiza orçamento principal
      const { error } = await supabase
        .from('budgets')
        .update({
          client_name: formData.client_name,
          client_contact: formData.client_contact,
          client_address: formData.client_address,
          description: formData.description,
          valid_until: formData.valid_until,
          status: formData.status,
          total_value: getTotalValue(),
        })
        .eq('id', budget.id);
      if (error) throw error;

      // Deleta todos os itens antigos
      const { error: delError } = await supabase
        .from('budget_items')
        .delete()
        .eq('budget_id', budget.id);
      if (delError) throw delError;

      // Insere os itens atualizados
      const itemsToInsert = items.map((item) => ({
        budget_id: budget.id,
        service_name: item.service_name,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }));

      const { error: insError } = await supabase
        .from('budget_items')
        .insert(itemsToInsert);
      if (insError) throw insError;
    },
    onSuccess: () => {
      toast.success('Orçamento atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar orçamento: ' + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBudget.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Orçamento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados do orçamento */}
          <div>
            <Label>Nome do Cliente</Label>
            <Input
              value={formData.client_name}
              onChange={(e) =>
                setFormData({ ...formData, client_name: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label>Contato</Label>
            <Input
              value={formData.client_contact}
              onChange={(e) =>
                setFormData({ ...formData, client_contact: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label>Endereço</Label>
            <Input
              value={formData.client_address}
              onChange={(e) =>
                setFormData({ ...formData, client_address: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label>Válido até</Label>
            <Input
              type="date"
              value={formData.valid_until}
              onChange={(e) =>
                setFormData({ ...formData, valid_until: e.target.value })
              }
            />
          </div>

          <div>
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="reprovado">Reprovado</SelectItem>
                <SelectItem value="sent">Enviado</SelectItem>         
              </SelectContent>
            </Select>
          </div>

          {/* Itens do orçamento */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <Label>Itens do Orçamento</Label>
              <Button
                type="button"
                onClick={handleAddItem}
                variant="outline"
                size="sm"
              >
                <Plus size={16} /> Adicionar Item
              </Button>
            </div>

            {items.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhum item adicionado.
              </p>
            )}

            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={item.id ?? index}
                  className="border rounded-lg p-4 space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">Item {index + 1}</h4>
                    <Button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      variant="ghost"
                      size="sm"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Serviço</Label>
                      <Input
                        value={item.service_name}
                        onChange={(e) =>
                          handleItemChange(index, 'service_name', e.target.value)
                        }
                        required
                      />
                    </div>

                    <div>
                      <Label>Descrição</Label>
                      <Input
                        value={item.description || ''}
                        onChange={(e) =>
                          handleItemChange(index, 'description', e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Quantidade</Label>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(index, 'quantity', Number(e.target.value))
                        }
                        required
                      />
                    </div>

                    <div>
                      <Label>Preço Unitário</Label>
                      <Input
                        type="number"
                        step={0.01}
                        min={0}
                        value={item.unit_price}
                        onChange={(e) =>
                          handleItemChange(index, 'unit_price', Number(e.target.value))
                        }
                        required
                      />
                    </div>

                    <div>
                      <Label>Total</Label>
                      <Input
                        type="number"
                        step={0.01}
                        value={item.total_price}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <span className="text-lg font-bold">
              Total: R$ {getTotalValue().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateBudget.isPending}>
                {updateBudget.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditBudgetDialog;
