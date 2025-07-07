
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Package, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProductUsageProps {
  taskId: string;
}

interface TaskProductUsage {
  id: string;
  quantity_used: number;
  created_at: string;
  inventory_item: {
    name: string;
    current_quantity: number;
  };
}

interface InventoryItem {
  id: string;
  name: string;
  current_quantity: number;
}

const ProductUsage = ({ taskId }: ProductUsageProps) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState('');

  // Buscar produtos utilizados na tarefa
  const { data: productUsage = [] } = useQuery({
    queryKey: ['task-product-usage', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_product_usage')
        .select(`
          *,
          inventory_item:inventory_items(name, current_quantity)
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TaskProductUsage[];
    },
  });

  // Buscar itens do estoque disponíveis
  const { data: inventoryItems = [] } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as InventoryItem[];
    },
  });

  // Adicionar uso de produto
  const addProductUsageMutation = useMutation({
    mutationFn: async ({ itemId, quantityUsed }: { itemId: string; quantityUsed: number }) => {
      const { data, error } = await supabase
        .from('task_product_usage')
        .insert({
          task_id: taskId,
          item_id: itemId,
          quantity_used: quantityUsed,
          created_by: profile?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-product-usage', taskId] });
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast.success('Uso de produto registrado com sucesso!');
      setShowAddDialog(false);
      setSelectedItemId('');
      setQuantity('');
    },
    onError: (error: any) => {
      toast.error('Erro ao registrar uso: ' + error.message);
    },
  });

  // Remover uso de produto
  const removeProductUsageMutation = useMutation({
    mutationFn: async (usageId: string) => {
      const { error } = await supabase
        .from('task_product_usage')
        .delete()
        .eq('id', usageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-product-usage', taskId] });
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast.success('Uso de produto removido com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao remover uso: ' + error.message);
    },
  });

  const handleAddUsage = () => {
    if (!selectedItemId || !quantity) return;

    const quantityNum = parseInt(quantity);
    if (quantityNum <= 0) {
      toast.error('Quantidade deve ser maior que zero');
      return;
    }

    const selectedItem = inventoryItems.find(item => item.id === selectedItemId);
    if (selectedItem && quantityNum > selectedItem.current_quantity) {
      toast.error('Quantidade insuficiente em estoque');
      return;
    }

    addProductUsageMutation.mutate({ itemId: selectedItemId, quantityUsed: quantityNum });
  };

  const canManageUsage = profile?.role === 'admin' || profile?.role === 'manager';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Produtos Utilizados
          </CardTitle>
          {canManageUsage && (
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Produto
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Uso de Produto</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="item">Produto</Label>
                    <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {inventoryItems.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} (Estoque: {item.current_quantity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="quantity">Quantidade Utilizada</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="Digite a quantidade..."
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAddDialog(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleAddUsage}
                      disabled={!selectedItemId || !quantity || addProductUsageMutation.isPending}
                    >
                      {addProductUsageMutation.isPending ? 'Registrando...' : 'Registrar Uso'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {productUsage.length === 0 ? (
          <p className="text-slate-500 text-center py-4">
            Nenhum produto utilizado nesta tarefa.
          </p>
        ) : (
          <div className="space-y-3">
            {productUsage.map((usage) => (
              <div key={usage.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
                <div>
                  <span className="font-medium">{usage.inventory_item.name}</span>
                  <Badge variant="outline" className="ml-2">
                    {usage.quantity_used} unidades
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">
                    {new Date(usage.created_at).toLocaleDateString('pt-BR')}
                  </span>
                  {canManageUsage && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeProductUsageMutation.mutate(usage.id)}
                      disabled={removeProductUsageMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductUsage;
