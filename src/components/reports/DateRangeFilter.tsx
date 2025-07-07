
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock } from 'lucide-react';

interface DateRangeFilterProps {
  value: string;
  onValueChange: (value: string) => void;
}

const DateRangeFilter = ({ value, onValueChange }: DateRangeFilterProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar size={20} />
          Período
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione o período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current_month">Mês Atual</SelectItem>
            <SelectItem value="last_month">Mês Passado</SelectItem>
            <SelectItem value="current_week">Esta Semana</SelectItem>
            <SelectItem value="last_week">Semana Passada</SelectItem>
            <SelectItem value="last_30_days">Últimos 30 Dias</SelectItem>
            <SelectItem value="last_90_days">Últimos 90 Dias</SelectItem>
            <SelectItem value="current_year">Ano Atual</SelectItem>
            <SelectItem value="all_time">Todo o Período</SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
};

export default DateRangeFilter;
