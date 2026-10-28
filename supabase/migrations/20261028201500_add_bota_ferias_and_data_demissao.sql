-- Migração: Adicionar bota em controle_ferias e data_demissao em funcionarios
ALTER TABLE public.controle_ferias ADD COLUMN IF NOT EXISTS bota text;
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS data_demissao date;
