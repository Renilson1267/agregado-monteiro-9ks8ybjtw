-- Atualização do nome do insumo cimento para 'CP II F-40 / CP V ARI' em todas as empresas
UPDATE public.materiais
SET nome = 'CP II F-40 / CP V ARI'
WHERE codigo = 'cimento';
