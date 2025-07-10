import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ServiceOrder } from '@/types/database';
import { useServiceOrders } from '@/hooks/useServiceOrders';
import { AlertTriangle } from 'lucide-react';

interface DeleteOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: ServiceOrder | null;
}

const DeleteOrderDialog: React.FC<DeleteOrderDialogProps> = ({ open, onOpenChange, order }) => {
  const { deleteOrder, isDeleting } = useServiceOrders();

  const handleDelete = async () => {
    if (order) {
      deleteOrder(order.id);
      onOpenChange(false);
    }
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-500" size={24} />
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </div>
          <DialogDescription className="text-left pt-2">
            Tem certeza que deseja excluir a ordem de serviço <strong>{order.order_number}</strong>?
            <br /><br />
            <span className="text-red-600">Esta ação não pode ser desfeita.</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Excluindo...' : 'Excluir'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteOrderDialog;
