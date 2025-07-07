
import { useCallback } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

interface ReportData {
  ordersStats?: {
    totalOrders: number;
    totalRevenue: number;
    chartData: Array<{ status: string; count: number }>;
  };
  employeesCount?: number;
  inventoryStats?: {
    totalItems: number;
    lowStockItems: number;
    totalQuantity: number;
  };
}

export const useReportExport = () => {
  const exportToExcel = useCallback((data: ReportData, dateRange: string) => {
    try {
      const workbook = XLSX.utils.book_new();
      
      // Resumo geral
      const summaryData = [
        ['Relatório de Dados do Sistema'],
        ['Período:', dateRange === 'current_month' ? 'Mês Atual' : 
                   dateRange === 'last_month' ? 'Mês Passado' :
                   dateRange === 'current_week' ? 'Esta Semana' :
                   dateRange === 'last_week' ? 'Semana Passada' :
                   'Período selecionado'],
        ['Data de Geração:', new Date().toLocaleDateString('pt-BR')],
        [],
        ['RESUMO GERAL'],
        ['Total de Ordens:', data.ordersStats?.totalOrders || 0],
        ['Receita Total:', `R$ ${data.ordersStats?.totalRevenue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`],
        ['Total de Funcionários:', data.employeesCount || 0],
        ['Itens em Estoque:', data.inventoryStats?.totalItems || 0],
        ['Itens com Estoque Baixo:', data.inventoryStats?.lowStockItems || 0],
      ];
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo');

      // Status das ordens
      if (data.ordersStats?.chartData) {
        const statusData = [
          ['Status das Ordens de Serviço'],
          [],
          ['Status', 'Quantidade'],
          ...data.ordersStats.chartData.map(item => [item.status, item.count])
        ];
        
        const statusSheet = XLSX.utils.aoa_to_sheet(statusData);
        XLSX.utils.book_append_sheet(workbook, statusSheet, 'Status das Ordens');
      }

      // Salvar arquivo
      const fileName = `relatorio_${dateRange}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      toast.success('Relatório Excel exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      toast.error('Erro ao exportar relatório Excel');
    }
  }, []);

  const exportToPDF = useCallback(async (elementId: string, fileName: string) => {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        toast.error('Elemento não encontrado para exportação');
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      // Adicionar título
      pdf.setFontSize(16);
      pdf.text('Relatório do Sistema', pdfWidth / 2, 20, { align: 'center' });
      pdf.setFontSize(12);
      pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pdfWidth / 2, 30, { align: 'center' });
      
      // Adicionar imagem
      pdf.addImage(imgData, 'PNG', imgX, 40, imgWidth * ratio, imgHeight * ratio);
      
      pdf.save(`${fileName}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Relatório PDF exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar relatório PDF');
    }
  }, []);

  return {
    exportToExcel,
    exportToPDF
  };
};
