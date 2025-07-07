
-- Tabela para cadastro de serviços
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  default_price NUMERIC(10,2),
  estimated_hours NUMERIC(4,2),
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabela para orçamentos
CREATE TABLE public.budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_number TEXT NOT NULL UNIQUE,
  client_id UUID REFERENCES public.clients(id),
  client_name TEXT NOT NULL,
  client_contact TEXT NOT NULL,
  client_address TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, sent, approved, rejected, expired
  total_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  valid_until DATE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabela para itens do orçamento
CREATE TABLE public.budget_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id),
  service_name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Função para gerar número do orçamento
CREATE OR REPLACE FUNCTION public.generate_budget_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(budget_number FROM '[0-9]+') AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.budgets
  WHERE budget_number ~ '^ORC[0-9]+$';
  
  RETURN 'ORC' || LPAD(next_number::TEXT, 4, '0');
END;
$$;

-- RLS para serviços
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view services"
  ON public.services FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Managers and admins can manage services"
  ON public.services FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'manager')
  ));

-- RLS para orçamentos
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view budgets"
  ON public.budgets FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Managers and admins can manage budgets"
  ON public.budgets FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'manager')
  ));

-- RLS para itens do orçamento
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view budget items"
  ON public.budget_items FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Managers and admins can manage budget items"
  ON public.budget_items FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'manager')
  ));

-- Adicionar coluna de status na tabela de tarefas (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'service_order_tasks' 
                   AND column_name = 'status_details') THEN
        ALTER TABLE public.service_order_tasks 
        ADD COLUMN status_details TEXT;
    END IF;
END $$;
