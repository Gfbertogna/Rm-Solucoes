
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileSpreadsheet, FileText, Download } from 'lucide-react';
import { useReportExport } from '@/hooks/useReportExport';

interface ReportExportButtonsProps {
  data: {
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
  };
  dateRange: string;
}

const ReportExportButtons: React.FC<ReportExportButtonsProps> = ({ data, dateRange }) => {
  const { exportToExcel, exportToPDF } = useReportExport();

  const handleExcelExport = () => {
    exportToExcel(data, dateRange);
  };

  const handlePDFExport = () => {
    exportToPDF('reports-content', 'relatorio_graficos');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Download size={20} />
          Exportar Relatórios
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 flex-wrap">
          <Button 
            onClick={handleExcelExport}
            className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
          >
            <FileSpreadsheet size={16} />
            Exportar Excel
          </Button>
          
          <Button 
            onClick={handlePDFExport}
            className="bg-red-600 hover:bg-red-700 flex items-center gap-2"
          >
            <FileText size={16} />
            Exportar PDF
          </Button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Excel: Dados tabulares • PDF: Gráficos e visualizações
        </p>
      </CardContent>
    </Card>
  );
};

export default ReportExportButtons;
