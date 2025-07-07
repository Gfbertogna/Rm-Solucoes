
-- Create table to track product usage in tasks
CREATE TABLE public.task_product_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.service_order_tasks(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  quantity_used INTEGER NOT NULL CHECK (quantity_used > 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Add RLS policies for task product usage
ALTER TABLE public.task_product_usage ENABLE ROW LEVEL SECURITY;

-- Users can view task product usage
CREATE POLICY "Users can view task product usage" 
  ON public.task_product_usage 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Managers and admins can manage task product usage
CREATE POLICY "Managers and admins can manage task product usage" 
  ON public.task_product_usage 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'manager')
  ));

-- Workers can manage usage for their assigned tasks
CREATE POLICY "Workers can manage usage for their tasks" 
  ON public.task_product_usage 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM service_order_tasks t
    WHERE t.id = task_id 
    AND t.assigned_worker_id = auth.uid()
  ));

-- Create function to automatically create inventory movement when product is used
CREATE OR REPLACE FUNCTION handle_task_product_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert inventory movement record
  INSERT INTO inventory_movements (
    item_id,
    movement_type,
    quantity,
    user_id,
    service_order_id,
    date
  )
  SELECT 
    NEW.item_id,
    'out',
    NEW.quantity_used,
    NEW.created_by,
    t.service_order_id,
    CURRENT_DATE
  FROM service_order_tasks t
  WHERE t.id = NEW.task_id;
  
  -- Update inventory item quantity
  UPDATE inventory_items 
  SET current_quantity = current_quantity - NEW.quantity_used
  WHERE id = NEW.item_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic inventory movement
CREATE TRIGGER task_product_usage_trigger
  AFTER INSERT ON task_product_usage
  FOR EACH ROW
  EXECUTE FUNCTION handle_task_product_usage();
