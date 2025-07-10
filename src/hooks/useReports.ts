import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useReports = (dateRange?: { from: Date; to: Date }) => {
  const { data: openServiceOrders = [] } = useQuery({
    queryKey: ['reports-open-orders', dateRange],
    queryFn: async () => {
      let query = supabase
        .from('service_orders')
        .select(`
          *,
          assigned_worker:profiles!assigned_worker_id(name)
        `)
        .not('status', 'in', '(completed,delivered,cancelled)')
        .order('created_at', { ascending: false });

      if (dateRange?.from) {
        query = query.gte('created_at', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        query = query.lte('created_at', dateRange.to.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: openServices = [] } = useQuery({
    queryKey: ['reports-open-services', dateRange],
    queryFn: async () => {
      let query = supabase
        .from('service_order_tasks')
        .select(`
          *,
          service_order:service_orders!inner(*),
          assigned_worker:profiles!assigned_worker_id(name)
        `)
        .not('status', 'in', '(completed,cancelled)')
        .order('created_at', { ascending: false });

      if (dateRange?.from) {
        query = query.gte('created_at', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        query = query.lte('created_at', dateRange.to.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: statusStats = [] } = useQuery({
    queryKey: ['reports-status-stats', dateRange],
    queryFn: async () => {
      let query = supabase
        .from('service_orders')
        .select('status')
        .order('status');

      if (dateRange?.from) {
        query = query.gte('created_at', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        query = query.lte('created_at', dateRange.to.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      const stats = data.reduce((acc: any, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(stats).map(([status, count]) => ({
        status,
        count,
        color: getStatusColor(status as string)
      }));
    },
  });

  const { data: timeTracking = [] } = useQuery({
    queryKey: ['reports-time-tracking', dateRange],
    queryFn: async () => {
      let query = supabase
        .from('task_time_logs')
        .select(`
          *,
          task:service_order_tasks(*),
          worker:profiles!worker_id(name)
        `)
        .not('end_time', 'is', null)
        .order('created_at', { ascending: false });

      if (dateRange?.from) {
        query = query.gte('created_at', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        query = query.lte('created_at', dateRange.to.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  return {
    openServiceOrders,
    openServices,
    statusStats,
    timeTracking,
  };
};

const getStatusColor = (status: string) => {
  const colors: { [key: string]: string } = {
    'received': '#3b82f6',
    'pending': '#f59e0b',
    'planning': '#8b5cf6',
    'production': '#06b6d4',
    'quality_control': '#f97316',
    'ready_for_shipment': '#10b981',
    'in_transit': '#6366f1',
    'delivered': '#22c55e',
    'invoiced': '#84cc16',
    'completed': '#059669',
    'cancelled': '#ef4444',
  };
  return colors[status] || '#6b7280';
};