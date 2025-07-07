
import { useMemo } from 'react';

export const useDateRange = (period: string) => {
  return useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    switch (period) {
      case 'current_week': {
        const startOfWeek = new Date(startOfDay);
        startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return { startDate: startOfWeek, endDate: endOfWeek };
      }
      
      case 'last_week': {
        const startOfLastWeek = new Date(startOfDay);
        startOfLastWeek.setDate(startOfDay.getDate() - startOfDay.getDay() - 7);
        const endOfLastWeek = new Date(startOfLastWeek);
        endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
        endOfLastWeek.setHours(23, 59, 59, 999);
        return { startDate: startOfLastWeek, endDate: endOfLastWeek };
      }
      
      case 'current_month': {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        return { startDate: startOfMonth, endDate: endOfMonth };
      }
      
      case 'last_month': {
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        return { startDate: startOfLastMonth, endDate: endOfLastMonth };
      }
      
      case 'last_30_days': {
        const startDate = new Date(startOfDay);
        startDate.setDate(startOfDay.getDate() - 30);
        return { startDate, endDate: endOfDay };
      }
      
      case 'last_90_days': {
        const startDate = new Date(startOfDay);
        startDate.setDate(startOfDay.getDate() - 90);
        return { startDate, endDate: endOfDay };
      }
      
      case 'current_year': {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        return { startDate: startOfYear, endDate: endOfYear };
      }
      
      case 'all_time':
      default:
        return { startDate: null, endDate: null };
    }
  }, [period]);
};
