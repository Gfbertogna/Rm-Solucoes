import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';
import { Budget, BudgetItem } from '@/types/database';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '@/integrations/supabase/client';

interface BudgetPDFGeneratorProps {
  budget: Budget & { budget_items: BudgetItem[] };
}

export const BudgetPDFGenerator: React.FC<BudgetPDFGeneratorProps> = ({ budget }) => {
  const generatePDFDocument = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let y = 20;

    // Cabeçalho da empresa
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('RMSoluções', 20, y);
    doc.setFont(undefined, 'normal');
    doc.text('MARCIO JOSE LASTORIA 26654674880', 20, y += 7);
    doc.text('CNPJ: 19.957.948/0001-68', 20, y += 7);
    doc.text('Avenida Ângelo Franzini, 2438, barracão', 20, y += 7);
    doc.text('Residencial Bosque de Versalles, Araras-SP', 20, y += 7);
    doc.text('CEP 13609-391', 20, y += 7);
    doc.text('Email: rmsoldas@hotmail.com', 20, y += 7);
    doc.text('Telefone: (19) 99652-4173', 20, y += 7);
    y += 10;

    // Título
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text(`Orçamento ${budget.budget_number}`, pageWidth / 2, y, { align: 'center' });
    y += 15;

    // Data
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Data: ${new Date(budget.created_at).toLocaleDateString('pt-BR')}`, 20, y);
    y += 10;

    // Cliente
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Dados do Cliente', 20, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Nome: ${budget.client_name}`, 20, y);
    y += 6;
    doc.text(`Contato: ${budget.client_contact}`, 20, y);
    y += 6;
    doc.text(`Endereço: ${budget.client_address}`, 20, y);
    y += 10;

    // Tabela de Itens
    const items = budget.budget_items.map((item) => [
      item.service_name,
      'und.',
      `R$ ${item.unit_price.toFixed(2)}`,
      item.quantity.toString(),
      `R$ ${item.total_price.toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Descrição', 'Unidade', 'Preço unitário', 'Qtd.', 'Preço']],
      body: items,
      styles: { fontSize: 9 },
    });

    y = doc.lastAutoTable.finalY + 10;

    // Total
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`TOTAL: R$ ${budget.total_value.toFixed(2)}`, pageWidth - 20, y, { align: 'right' });
    y += 10;

    // Meios de pagamento
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Pagamento', 20, y);
    y += 7;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Transferência bancária, dinheiro, cheque ou pix.', 20, y);
    y += 6;
    doc.text('PIX: 19957948000168', 20, y);
    y += 10;

    // Dados bancários
    doc.setFont(undefined, 'bold');
    doc.text('Dados Bancários', 20, y);
    y += 7;

    doc.setFont(undefined, 'normal');
    doc.text('Banco: Banco do Brasil', 20, y);
    y += 6;
    doc.text('Agência: 0341-7', 20, y);
    y += 6;
    doc.text('Conta: 65.675-5', 20, y);
    y += 6;
    doc.text('Tipo de conta: Corrente', 20, y);
    y += 6;
    doc.text('Titular: 19.957.948/0001-68', 20, y);
    y += 15;

    // Rodapé
    doc.setFontSize(10);
    doc.setFont(undefined, 'italic');
    doc.text('Agro não pode parar... Indústria não pode parar...', 20, y);
    y += 10;
    doc.setFont(undefined, 'normal');
    doc.text(`Araras, ${new Date().toLocaleDateString('pt-BR')}`, 20, y);
    y += 7;
    doc.text('RMSoluções', 20, y);
    y += 7;
    doc.text('Márcio Lastoria', 20, y);

    return doc;
  };

  const handleDownloadPDF = () => {
    try {
      const doc = generatePDFDocument();
      doc.save(`orcamento_${budget.budget_number}.pdf`);
      toast.success('PDF baixado com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao baixar PDF');
    }
  };

  const sendPDFViaWhatsApp = async () => {
    try {
      const doc = generatePDFDocument();
      const blob = doc.output('blob');
      const fileName = `orcamentos/orcamento_${budget.budget_number.replace(/[^\w.-]/gi, '_')}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from('pdfs')
        .upload(fileName, blob, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('pdfs').getPublicUrl(fileName);
      const pdfUrl = data?.publicUrl;
      if (!pdfUrl) throw new Error('Erro ao obter link público');

      const phone = budget.client_contact.replace(/\D/g, '');
      const message = encodeURIComponent(`Olá ${budget.client_name}! Segue seu orçamento: ${pdfUrl}`);
      window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
      toast.success('Orçamento enviado via WhatsApp!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao enviar orçamento');
    }
  };

  return (
    <div className="flex gap-2">
      <Button onClick={handleDownloadPDF} variant="outline" size="sm">
        <Download className="w-4 h-4 mr-2" />
        Baixar PDF
      </Button>
      <Button onClick={sendPDFViaWhatsApp} variant="outline" size="sm">
        <FileText className="w-4 h-4 mr-2" />
        Enviar por WhatsApp
      </Button>
    </div>
  );
};
