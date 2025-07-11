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
  serviceImages?: string[];
  signatureImage?: string;
}

const logopath = '/logonum.png';
const assinaturaPath = '/AssinaturaMarcioOficial.png';

const loadImageAsBase64 = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d')?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });
};

export const BudgetPDFGenerator: React.FC<BudgetPDFGeneratorProps> = ({ budget, serviceImages }) => {
  const generatePDFDocument = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let y = 15;

    // Logo e cabeçalho
    try {
      const logoBase64 = await loadImageAsBase64(logopath);
      doc.addImage(logoBase64, 'PNG', 20, 10, 30, 30);
    } catch (e) {
      console.warn('Erro ao carregar o logo', e);
    }

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('RMSoluções', 60, y);
    doc.setFont(undefined, 'normal');
    doc.text('MARCIO JOSE LASTORIA 26654674880 | Email: rmsoldas@hotmail.com', 60, y += 6);
    doc.text('CNPJ: 19.957.948/0001-68                        | Telefone: +55 (19) 99652-4173', 60, y += 6);
    doc.text('Avenida Ângelo Franzini, 2438, barracão', 60, y += 6);
    doc.text('Residencial Bosque de Versalles, Araras-SP', 60, y += 6);
    doc.text('CEP 13609-391', 60, y += 6);
    doc.text(`Data: ${new Date(budget.created_at).toLocaleDateString('pt-BR')}`, 60, y += 6);
    y += 10;

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('RMSoluções - Serralheria / Automação / Caldeiraria Agrícola', 20, y);
    y += 10;

    doc.setFontSize(16);
    doc.text(`Orçamento ${budget.budget_number}`, pageWidth / 2, y, { align: 'center' });
    y += 10;

    // Cliente
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Cliente:', 20, y);
    doc.setFont(undefined, 'normal');
    doc.text(`${budget.client_name}`, 45, y);
    y += 6;
    doc.text(`Contato: ${budget.client_contact}`, 20, y);
    y += 6;
    doc.text(`Endereço: ${budget.client_address}`, 20, y);
    y += 10;

    // Tabela de itens
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
      styles: { fontSize: 10 },
    });

    y = doc.lastAutoTable.finalY + 10;

    // Total
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`TOTAL: R$ ${budget.total_value.toFixed(2)}`, pageWidth - 20, y, { align: 'right' });
    y += 10;

    // Pagamento
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Pagamento', 20, y);
    y += 6;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Transferência bancária, dinheiro, cheque ou pix.', 20, y);
    y += 6;
    doc.text('PIX: 19957948000168', 20, y);
    y += 10;

    // Bancários
    doc.setFont(undefined, 'bold');
    doc.text('Dados Bancários', 20, y);
    y += 6;

    doc.setFont(undefined, 'normal');
    doc.text('Banco: Banco do Brasil', 20, y);
    y += 6;
    doc.text('Agência: 0341-7', 20, y);
    y += 6;
    doc.text('Conta: 65.675-5', 20, y);
    y += 6;
    doc.text('Tipo de conta: Corrente', 20, y);
    y += 6;
    doc.text('Titular da conta (CPF/CNPJ): 19.957.948/0001-68', 20, y);
    y += 10;

    // Fotos dos serviços
    if (serviceImages && serviceImages.length > 0) {
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Fotos dos serviços:', 20, y);
      y += 5;

      for (const imageUrl of serviceImages) {
        try {
          const img = await loadImageAsBase64(imageUrl);
          doc.addImage(img, 'JPEG', 20, y, 60, 45);
          y += 50;
        } catch (e) {
          console.warn('Erro ao carregar imagem', e);
        }
      }
    }

    // Rodapé com assinatura centralizada
    doc.setFontSize(10);
    doc.setFont(undefined, 'italic');
    doc.text('Agro não pode parar... Indústria não pode parar...', pageWidth / 2, y += 10, {
      align: 'center',
    });
      
    
    doc.setFont(undefined, 'bold');
    doc.text(`Araras, ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, y += 8, {
      align: 'center',
    });

    try {
      const assinaturaBase64 = await loadImageAsBase64(assinaturaPath);
      const imgWidth = 50;
      const imgHeight = 20;
      const centerX = (pageWidth - imgWidth) / 2;
      doc.addImage(assinaturaBase64, 'PNG', centerX, y += 5, imgWidth, imgHeight);
    } catch (e) {
      console.warn('Erro ao carregar assinatura', e);
    }

    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(50, y + 25, pageWidth - 50, y + 25);

    doc.setFont(undefined, 'bold');
    doc.text('RMSoluções', pageWidth / 2, y + 32, { align: 'center' });

    doc.setFont(undefined, 'normal');
    doc.text('Márcio Lastoria', pageWidth / 2, y + 38, { align: 'center' });

    return doc;
  };

  const handleDownloadPDF = async () => {
    try {
      const doc = await generatePDFDocument();
      doc.save(`orcamento_${budget.budget_number}.pdf`);
      toast.success('PDF baixado com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao baixar PDF');
    }
  };

  const sendPDFViaWhatsApp = async () => {
    try {
      const doc = await generatePDFDocument();
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
        Enviar WhatsApp
      </Button>
    </div>
  );
};
