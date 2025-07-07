
-- Add CNPJ/CPF field to clients table
ALTER TABLE public.clients 
ADD COLUMN cnpj_cpf TEXT;

-- Add a check constraint to ensure CNPJ/CPF format is valid (11 digits for CPF or 14 for CNPJ)
ALTER TABLE public.clients 
ADD CONSTRAINT check_cnpj_cpf_format 
CHECK (cnpj_cpf IS NULL OR (LENGTH(REGEXP_REPLACE(cnpj_cpf, '[^0-9]', '', 'g')) IN (11, 14)));
