import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useClients } from '@/hooks/useClients';
import { useServiceOrdersForInvoice } from '@/hooks/useServiceOrdersForInvoice';
import { createInvoice } from '@/services/invoiceService';
import { toast } from 'sonner';

interface ExtraItem {
  description: string;
  value: number;
}

interface NewInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

const NewInvoiceDialog: React.FC<NewInvoiceDialogProps> = ({
  open,
  onOpenChange,
  onCreated,
}) => {
  const [clientId, setClientId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [extras, setExtras] = useState<ExtraItem[]>([{ description: '', value: 0 }]);

  const { clients } = useClients();
  const client = clients.find((c) => c.id === clientId);

  // Só ativa o hook quando todos os campos obrigatórios estiverem preenchidos
  const shouldFetchOrders = !!clientId && !!startDate && !!endDate;
  const {
    serviceOrders,
    totalValue,
    totalTime,
  } = useServiceOrdersForInvoice(clientId, startDate, endDate);

  const handleAddExtra = () => {
    setExtras([...extras, { description: '', value: 0 }]);
  };

  const handleExtraChange = (
    index: number,
    field: keyof ExtraItem,
    value: string
  ) => {
    const updated = [...extras];
    updated[index] = {
      ...updated[index],
      [field]: field === 'value' ? parseFloat(value) || 0 : value,
    };
    setExtras(updated);
  };

  const handleCreateInvoice = async () => {
    if (!clientId || !startDate || !endDate) {
      toast.warning('Preencha cliente e período.');
      return;
    }

    if (serviceOrders.length === 0) {
      toast.warning('Nenhuma OS disponível para faturar.');
      return;
    }

    const response = await createInvoice({
      client_id: clientId,
      client_name: client?.name || 'Cliente',
      start_date: startDate,
      end_date: endDate,
      orders: serviceOrders.map((os) => ({
        id: os.id,
        order_number: os.order_number,
        sale_value: os.sale_value,
        total_hours: os.total_hours,
      })),
      extras,
      total_value: totalValue,
      total_time: totalTime,
    });

    if (response?.error) {
      toast.error('Erro ao criar fatura: ' + response.error.message);
    } else {
      toast.success('Fatura criada com sucesso!');
      onOpenChange(false);
      onCreated?.();

      // Resetar estado
      setClientId('');
      setStartDate('');
      setEndDate('');
      setExtras([{ description: '', value: 0 }]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Criar Nova Fatura</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cliente */}
          <div>
            <Label>Cliente</Label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="">Selecione</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          {/* Período */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Início</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label>Fim</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* OS Selecionadas */}
          <div>
            <Label>Ordens de Serviço</Label>
            {!shouldFetchOrders ? (
              <p className="text-sm text-muted-foreground">
                Selecione o cliente e o período para listar OSs.
              </p>
            ) : serviceOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma OS encontrada neste período.
              </p>
            ) : (
              <>
                {serviceOrders.map((os) => (
                  <div key={os.id} className="border rounded p-2 my-2">
                    <p className="font-medium">OS {os.order_number}</p>
                    <p>Valor: R$ {os.sale_value.toFixed(2)}</p>
                    <p>Tempo: {os.total_hours.toFixed(2)}h</p>
                  </div>
                ))}
                <p className="font-semibold mt-2">
                  Total: R$ {totalValue.toFixed(2)} | {totalTime.toFixed(2)}h
                </p>
              </>
            )}
          </div>

          {/* Valores Extras */}
          <div>
            <Label>Valores Extras</Label>
            {extras.map((extra, i) => (
              <div key={i} className="flex gap-2 items-center mb-2">
                <Input
                  placeholder="Descrição"
                  value={extra.description}
                  onChange={(e) =>
                    handleExtraChange(i, 'description', e.target.value)
                  }
                />
                <Input
                  placeholder="Valor"
                  type="number"
                  value={extra.value}
                  onChange={(e) =>
                    handleExtraChange(i, 'value', e.target.value)
                  }
                />
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={handleAddExtra}>
              Adicionar Valor Extra
            </Button>
          </div>

          {/* Botão de Salvar */}
          <div className="pt-4 flex justify-end">
            <Button onClick={handleCreateInvoice}>Salvar Fatura</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewInvoiceDialog;
