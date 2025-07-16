import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { FileText, X } from 'lucide-react';

interface ExtraItem {
  description: string;
  value?: number;
}

interface ServiceOrder {
  id: string;
  order_number: string;
  sale_value?: number;
  total_hours?: number;
}

interface Invoice {
  id: string;
  number: string;
  client_name: string;
  start_date: string;
  end_date: string;
  total_value?: number;
  total_hours?: number;
  service_orders: ServiceOrder[];
  extras?: ExtraItem[];
}

interface Props {
  invoice: Invoice;
  onClose: () => void;
}

export const InvoicePDFGenerator: React.FC<Props> = ({ invoice, onClose }) => {
  const generatePDF = () => {
    const doc = new jsPDF();
    const title = `Fatura #${invoice.number}`;

    doc.setFontSize(18);
    doc.text(title, 14, 20);

    doc.setFontSize(12);
    doc.text(`Cliente: ${invoice.client_name}`, 14, 30);
    doc.text(`Período: ${invoice.start_date} - ${invoice.end_date}`, 14, 38);

    autoTable(doc, {
      startY: 48,
      head: [['OS', 'Valor (R$)', 'Horas']],
      body: invoice.service_orders.map((os) => [
        `#${os.order_number}`,
        (os.sale_value ?? 0).toFixed(2),
        (os.total_hours ?? 0).toFixed(2),
      ]),
    });

    let currentY = doc.lastAutoTable?.finalY || 60;

    if (invoice.extras && invoice.extras.length > 0) {
      doc.text('Valores Extras', 14, currentY + 10);
      autoTable(doc, {
        startY: currentY + 14,
        head: [['Descrição', 'Valor (R$)']],
        body: invoice.extras.map((extra) => [
          extra.description,
          (extra.value ?? 0).toFixed(2),
        ]),
      });
      currentY = doc.lastAutoTable?.finalY || currentY + 30;
    }

    doc.setFontSize(12);
    doc.text(
      `Total Geral: R$ ${(invoice.total_value ?? 0).toFixed(2)}`,
      14,
      currentY + 10
    );
    doc.text(
      `Tempo Total: ${(invoice.total_hours ?? 0).toFixed(2)}h`,
      14,
      currentY + 18
    );

    doc.save(`Fatura-${invoice.number}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">Gerar PDF da Fatura</h2>

        <div className="space-y-2 text-sm">
          <p><strong>Cliente:</strong> {invoice.client_name}</p>
          <p><strong>Período:</strong> {invoice.start_date} a {invoice.end_date}</p>
          <p><strong>OSs incluídas:</strong> {invoice.service_orders.length}</p>
          <p><strong>Total:</strong> R$ {(invoice.total_value ?? 0).toFixed(2)}</p>
          <p><strong>Horas totais:</strong> {(invoice.total_hours ?? 0).toFixed(2)}h</p>
        </div>

        <div className="flex justify-end mt-6 gap-2">
          <Button variant="outline" onClick={onClose}>
            <X size={16} className="mr-2" />
            Cancelar
          </Button>
          <Button onClick={generatePDF}>
            <FileText size={16} className="mr-2" />
            Baixar PDF
          </Button>
        </div>
      </div>
    </div>
  );
};
