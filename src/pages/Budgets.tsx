import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, ShoppingCart, Trash2 } from 'lucide-react';
import { useBudgets } from '@/hooks/useBudgets';
import CreateBudgetDialog from '@/components/budgets/CreateBudgetDialog';
import BudgetDetailsDialog from '@/components/budgets/BudgetDetailsDialog';
import EditBudgetDialog from '@/components/budgets/EditBudgetDialog';
import { BudgetFilters } from '@/components/budgets/BudgetFilters';
import { BudgetPDFGenerator } from '@/components/budgets/BudgetPDFGenerator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Budgets = () => {
  const [selectedBudget, setSelectedBudget] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    clientName: '',
    dateFrom: '',
    dateTo: '',
  });

  const { budgets, isLoading, createOrderFromBudget, isCreatingOrder } = useBudgets(filters);

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'draft': 'bg-gray-100 text-gray-800',
      'sent': 'bg-blue-100 text-blue-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'expired': 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      'draft': 'Rascunho',
      'sent': 'Enviado',
      'approved': 'Aprovado',
      'rejected': 'Rejeitado',
      'expired': 'Expirado',
    };
    return labels[status] || status;
  };

  const handleCreateOrder = (budgetId: string) => {
    createOrderFromBudget(budgetId);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('budgets').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao excluir orçamento: ' + error.message);
    } else {
      toast.success('Orçamento excluído com sucesso!');
      location.reload();
    }
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      clientName: '',
      dateFrom: '',
      dateTo: '',
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Orçamentos</h1>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Orçamento
        </Button>
      </div>

      <BudgetFilters
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={clearFilters}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="bg-gray-200 h-20"></CardHeader>
              <CardContent className="h-32 bg-gray-100"></CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((budget) => (
            <Card key={budget.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{budget.budget_number}</CardTitle>
                    <p className="text-sm text-gray-600">{budget.client_name}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(budget.status)}>
                      {getStatusLabel(budget.status)}
                    </Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(budget.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {budget.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-lg text-green-600">
                      R$ {budget.total_value.toFixed(2)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(budget.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  {budget.valid_until && (
                    <p className="text-xs text-gray-500">
                      Válido até: {new Date(budget.valid_until).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                  <div className="flex flex-wrap justify-between items-center gap-2 pt-2">
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedBudget(budget);
                          setShowDetailsDialog(true);
                        }}
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        Ver
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedBudget(budget);
                          setShowEditDialog(true);
                        }}
                      >
                        ✏️ Editar
                      </Button>

                      <BudgetPDFGenerator budget={budget} />
                    </div>

                    {budget.status === 'sent' && (
                      <Button
                        size="sm"
                        onClick={() => handleCreateOrder(budget.id)}
                        disabled={isCreatingOrder}
                        className="whitespace-nowrap hover:bg-green-600 hover:text-white transition-colors duration-200"
                      >
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        Criar OS
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {budgets.length === 0 && !isLoading && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              Nenhum orçamento encontrado
            </h3>
            <p className="text-gray-500 mb-4">
              {Object.values(filters).some((f) => f)
                ? 'Tente ajustar os filtros de busca.'
                : 'Comece criando seu primeiro orçamento.'}
            </p>
            {!Object.values(filters).some((f) => f) && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Orçamento
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <CreateBudgetDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />

      {selectedBudget && showDetailsDialog && (
        <BudgetDetailsDialog
          budget={selectedBudget}
          onClose={() => {
            setShowDetailsDialog(false);
            setSelectedBudget(null);
          }}
        />
      )}

      {selectedBudget && showEditDialog && (
        <EditBudgetDialog
          open={showEditDialog}
          onOpenChange={(open) => {
            setShowEditDialog(open);
            if (!open) setSelectedBudget(null);
          }}
          budget={selectedBudget}
        />
      )}
    </div>
  );
};

export default Budgets;
