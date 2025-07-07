
-- Create a view for employee task statistics
CREATE OR REPLACE VIEW public.employee_task_stats AS
SELECT 
    p.id as worker_id,
    p.name as worker_name,
    COUNT(DISTINCT t.id) as total_tasks,
    COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
    COALESCE(SUM(tl.hours_worked), 0) as total_hours_worked,
    CASE 
        WHEN COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) > 0 
        THEN COALESCE(SUM(tl.hours_worked), 0) / COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END)
        ELSE 0 
    END as avg_hours_per_task
FROM profiles p
LEFT JOIN service_order_tasks t ON t.assigned_worker_id = p.id
LEFT JOIN task_time_logs tl ON tl.task_id = t.id
WHERE p.role = 'worker'
GROUP BY p.id, p.name;

-- Create a view for overdue tasks and orders
CREATE OR REPLACE VIEW public.overdue_analysis AS
SELECT 
    'task' as type,
    t.id,
    t.title as name,
    t.priority,
    so.urgency,
    t.estimated_hours,
    t.status,
    so.deadline,
    CASE 
        WHEN so.deadline IS NOT NULL AND so.deadline < CURRENT_DATE 
        THEN CURRENT_DATE - so.deadline 
        ELSE 0 
    END as days_overdue,
    p.name as assigned_worker,
    so.order_number,
    so.client_name
FROM service_order_tasks t
JOIN service_orders so ON so.id = t.service_order_id
LEFT JOIN profiles p ON p.id = t.assigned_worker_id
WHERE t.status NOT IN ('completed', 'cancelled')

UNION ALL

SELECT 
    'order' as type,
    so.id,
    so.order_number || ' - ' || so.client_name as name,
    NULL as priority,
    so.urgency,
    NULL as estimated_hours,
    so.status,
    so.deadline,
    CASE 
        WHEN so.deadline IS NOT NULL AND so.deadline < CURRENT_DATE 
        THEN CURRENT_DATE - so.deadline 
        ELSE 0 
    END as days_overdue,
    p.name as assigned_worker,
    so.order_number,
    so.client_name
FROM service_orders so
LEFT JOIN profiles p ON p.id = so.assigned_worker_id
WHERE so.status NOT IN ('completed', 'delivered', 'cancelled');

-- Grant select permissions on the views
GRANT SELECT ON public.employee_task_stats TO authenticated;
GRANT SELECT ON public.overdue_analysis TO authenticated;
