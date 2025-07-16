import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Trash2 } from 'lucide-react';
import { InvoicePDFGenerator } from './InvoicePDFGenerator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { deleteInvoice } from '@/services/invoiceService';

interface Invoice {
  id: string;
  created_at: string;
  client_id?: string;
  client_name: string;
  orders: {
    id: string;
    sale_value: number;
    service_time: number;
  }[];
  extras?: {
    description: string;
    value: number;
  }[];
  total_value: number;
  total_time?: number;
}

interface InvoiceTableProps {
  invoices: Invoice[];
  onDelete?: () => void; // para atualizar lista ao excluir
}

const InvoiceTable: React.FC<InvoiceTableProps> = ({ invoices, onDelete }) => {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const handleDelete = async (invoiceId: string) => {
    const confirmed = confirm('Tem certeza que deseja excluir esta fatura?');
    if (!confirmed) return;

    try {
      await deleteInvoice(invoiceId);
      onDelete?.(); // atualiza a lista após deletar
    } catch (err: any) {
      alert('Erro ao deletar fatura: ' + err.message);
    }
  };

  const getFakeDateRange = (createdAt: string) => {
    const date = new Date(createdAt);
    const start = format(date, 'dd/MM/yyyy');
    const end = format(date, 'dd/MM/yyyy');
    return { start, end };
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      {invoices.map((invoice) => {
        const { start, end } = getFakeDateRange(invoice.created_at);

        return (
          <Card key={invoice.id}>
            <CardHeader>
              <CardTitle>
                Fatura emitida em{' '}
                {format(new Date(invoice.created_at), "dd 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>
                <strong>Cliente:</strong> {invoice.client_name}
              </p>
              <p>
                <strong>Total de OSs:</strong> {invoice.orders.length}
              </p>
              <p>
                <strong>Valor Total:</strong> R$ {invoice.total_value.toFixed(2)}
              </p>
              {invoice.total_time !== undefined && (
                <p>
                  <strong>Tempo Total:</strong> {invoice.total_time.toFixed(2)} horas
                </p>
              )}
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedInvoice(invoice)}
                >
                  <FileText size={16} className="mr-2" />
                  Gerar PDF
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(invoice.id)}
                >
                  <Trash2 size={16} className="mr-2 text-red-600" />
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {selectedInvoice && (
        <InvoicePDFGenerator
          invoice={{
            id: selectedInvoice.id,
            number: selectedInvoice.id, // Usando o id como número
            client_name: selectedInvoice.client_name,
            start_date: format(new Date(selectedInvoice.created_at), 'dd/MM/yyyy'),
            end_date: format(new Date(selectedInvoice.created_at), 'dd/MM/yyyy'),
            total_value: selectedInvoice.total_value,
            total_hours: selectedInvoice.total_time || 0,
            service_orders: selectedInvoice.orders.map(order => ({
              id: order.id,
              order_number: order.id,
              sale_value: order.sale_value,
              total_hours: order.service_time,
            })),
            extras: selectedInvoice.extras,
          }}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
};

export default InvoiceTable;
