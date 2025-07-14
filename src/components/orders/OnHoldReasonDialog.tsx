import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface OnHoldReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceOrderId: string;
  onReasonSubmitted: (reason: string) => void; // Corrigido aqui
}

const OnHoldReasonDialog = ({
  open,
  onOpenChange,
  serviceOrderId,
  onReasonSubmitted,
}: OnHoldReasonDialogProps) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) return;

    setLoading(true);
    try {
      // Apenas envia o motivo para o componente pai
      onReasonSubmitted(reason.trim());
      onOpenChange(false);
      setReason('');
    } catch (err) {
      console.error('Erro ao enviar motivo:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Informe o motivo da espera</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Descreva o motivo do impedimento..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <Button onClick={handleSubmit} disabled={loading || !reason.trim()}>
          {loading ? 'Salvando...' : 'Confirmar'}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default OnHoldReasonDialog;
