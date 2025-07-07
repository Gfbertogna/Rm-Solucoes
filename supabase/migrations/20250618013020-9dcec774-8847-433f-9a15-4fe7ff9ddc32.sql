
-- Criação das tabelas principais do sistema

-- Tabela de perfis de usuários
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'worker')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de clientes
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact TEXT NOT NULL,
  address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de ordens de serviço
CREATE TABLE public.service_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  opening_date DATE NOT NULL DEFAULT CURRENT_DATE,
  client_id UUID REFERENCES public.clients(id) ON DELETE RESTRICT,
  client_name TEXT NOT NULL,
  client_contact TEXT NOT NULL,
  client_address TEXT NOT NULL,
  service_description TEXT NOT NULL,
  sale_value DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN (
    'received', 'pending', 'planning', 'production', 
    'quality_control', 'ready_for_shipment', 'in_transit', 
    'delivered', 'invoiced', 'completed', 'cancelled'
  )),
  urgency TEXT NOT NULL DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high')),
  assigned_worker_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  deadline DATE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de observações
CREATE TABLE public.observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id UUID REFERENCES public.service_orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de itens de estoque
CREATE TABLE public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  current_quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de movimentações de estoque
CREATE TABLE public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out')),
  quantity INTEGER NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  service_order_id UUID REFERENCES public.service_orders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ativar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Políticas RLS para clients
CREATE POLICY "All authenticated users can view clients" ON public.clients FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Managers and admins can manage clients" ON public.clients FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Políticas RLS para service_orders
CREATE POLICY "All authenticated users can view service orders" ON public.service_orders FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins and managers can create service orders" ON public.service_orders FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')) OR
  auth.uid() IS NOT NULL
);
CREATE POLICY "Admins and managers can update service orders" ON public.service_orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')) OR
  assigned_worker_id = auth.uid()
);
CREATE POLICY "Admins can delete service orders" ON public.service_orders FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Políticas RLS para observations
CREATE POLICY "All authenticated users can view observations" ON public.observations FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "All authenticated users can create observations" ON public.observations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Políticas RLS para inventory_items
CREATE POLICY "All authenticated users can view inventory" ON public.inventory_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Managers and admins can manage inventory" ON public.inventory_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Políticas RLS para inventory_movements
CREATE POLICY "All authenticated users can view movements" ON public.inventory_movements FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "All authenticated users can create movements" ON public.inventory_movements FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Função para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'worker')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Função para gerar número de OS automaticamente
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM '[0-9]+') AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.service_orders
  WHERE order_number ~ '^OS[0-9]+$';
  
  RETURN 'OS' || LPAD(next_number::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Inserir dados iniciais para teste
INSERT INTO public.clients (id, name, contact, address) VALUES
  (gen_random_uuid(), 'Empresa ABC Ltda', '(11) 98765-4321', 'Rua das Flores, 123 - São Paulo/SP'),
  (gen_random_uuid(), 'Indústria XYZ S/A', '(11) 91234-5678', 'Av. Industrial, 456 - São Paulo/SP'),
  (gen_random_uuid(), 'Comércio 123', '(11) 95555-1234', 'Rua do Comércio, 789 - São Paulo/SP');

INSERT INTO public.inventory_items (name, current_quantity) VALUES
  ('Parafuso M6', 100),
  ('Chapa de Aço 2mm', 50),
  ('Solda MIG', 25),
  ('Tinta Primer', 30),
  ('Rebite 4mm', 200);
