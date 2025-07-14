import { supabase } from '@/integrations/supabase/client';

export async function createServiceOrderIssue(service_order_id: string, reason: string) {
  const { error } = await supabase
    .from('service_order_issues')
    .insert([{ service_order_id, reason }]);

  if (error) throw new Error(error.message);
}
