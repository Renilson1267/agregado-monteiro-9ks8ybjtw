-- Migração: Proteger número sequencial de Ordem de Serviço (Recibo)
-- Regra: O número sequencial da OS (numero_os) NÃO pode ser alterado após gerado.
-- E uma OS existente NÃO pode ser excluída para evitar comprometimento e lacunas na sequência oficial.

-- 1. Trigger para impedir a alteração de numero_os e empresa_id após inserido
CREATE OR REPLACE FUNCTION public.proteger_numero_os_imutavel()
RETURNS trigger AS $$
BEGIN
  -- Se for UPDATE e houver tentativa de alterar numero_os
  IF NEW.numero_os <> OLD.numero_os THEN
    RAISE EXCEPTION 'O número sequencial do Recibo/OS (Nº %) não pode ser alterado após gerado.', OLD.numero_os;
  END IF;

  -- Se for UPDATE e houver tentativa de alterar empresa_id
  IF NEW.empresa_id <> OLD.empresa_id THEN
    RAISE EXCEPTION 'A empresa de origem do Recibo/OS não pode ser alterada.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_proteger_numero_os_imutavel ON public.ordens_servico;
CREATE TRIGGER trg_proteger_numero_os_imutavel
  BEFORE UPDATE ON public.ordens_servico
  FOR EACH ROW
  EXECUTE FUNCTION public.proteger_numero_os_imutavel();

-- 2. Trigger para impedir exclusão de Ordem de Serviço / Recibo
-- Como a numeração é sequencial, rígida e fiscal/auditora, a exclusão de qualquer OS gerada comprometeria o sequencial
CREATE OR REPLACE FUNCTION public.impedir_exclusao_os()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'O Recibo/OS sequencial (Nº %) não pode ser excluído. Os recibos devem ser mantidos para preservar a integridade da sequência numérica.', OLD.numero_os;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_impedir_exclusao_os ON public.ordens_servico;
CREATE TRIGGER trg_impedir_exclusao_os
  BEFORE DELETE ON public.ordens_servico
  FOR EACH ROW
  EXECUTE FUNCTION public.impedir_exclusao_os();
