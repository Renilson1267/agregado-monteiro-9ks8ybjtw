import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Loader2,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"

interface ModalTrocarSenhaProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ModalTrocarSenha({
  open,
  onOpenChange,
}: ModalTrocarSenhaProps) {
  const { user, updatePassword } = useAuth()
  const { toast } = useToast()

  const [senhaAtual, setSenhaAtual] = useState("")
  const [novaSenha, setNovaSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")

  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false)
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false)
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false)

  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)

  const resetForm = () => {
    setSenhaAtual("")
    setNovaSenha("")
    setConfirmarSenha("")
    setMostrarSenhaAtual(false)
    setMostrarNovaSenha(false)
    setMostrarConfirmarSenha(false)
    setErro(null)
    setSucesso(false)
  }

  const handleOpenChange = (proximoOpen: boolean) => {
    if (!proximoOpen) {
      resetForm()
    }
    onOpenChange(proximoOpen)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)
    setSucesso(false)

    // Validações no cliente
    if (!senhaAtual) {
      setErro("Informe sua senha atual.")
      return
    }

    if (!novaSenha) {
      setErro("Informe a nova senha.")
      return
    }

    if (novaSenha.length < 8) {
      setErro("A nova senha deve ter no mínimo 8 caracteres.")
      return
    }

    if (novaSenha !== confirmarSenha) {
      setErro("A confirmação não confere com a nova senha digitada.")
      return
    }

    if (senhaAtual === novaSenha) {
      setErro("A nova senha deve ser diferente da senha atual.")
      return
    }

    setSalvando(true)

    try {
      const { error } = await updatePassword(novaSenha, senhaAtual)

      if (error) {
        setErro(error.message || "Não foi possível alterar a senha.")
        return
      }

      setSucesso(true)
      toast({
        title: "Senha atualizada com sucesso!",
        description: "Sua nova senha de acesso já está em vigor.",
      })

      // Fecha o modal após breve confirmação visual
      setTimeout(() => {
        handleOpenChange(false)
      }, 1400)
    } catch (err: any) {
      setErro(err?.message || "Ocorreu um erro inesperado ao alterar a senha.")
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                Trocar Senha de Acesso
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {user?.email
                  ? `Alteração de credencial para ${user.email}`
                  : "Defina uma nova senha segura para sua conta"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {erro && (
            <Alert variant="destructive" className="py-2 px-3 text-xs">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{erro}</AlertDescription>
            </Alert>
          )}

          {sucesso && (
            <Alert className="py-2 px-3 text-xs border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <AlertDescription className="font-medium">
                Senha alterada com sucesso! Fechando...
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="senhaAtual" className="text-xs font-semibold">
              Senha Atual <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="senhaAtual"
                type={mostrarSenhaAtual ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Digite sua senha atual"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                disabled={salvando || sucesso}
                className="h-9 text-xs pr-9"
              />
              <button
                type="button"
                onClick={() => setMostrarSenhaAtual((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                title={mostrarSenhaAtual ? "Ocultar senha" : "Ver senha"}
                tabIndex={-1}
              >
                {mostrarSenhaAtual ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="novaSenha" className="text-xs font-semibold">
                Nova Senha <span className="text-destructive">*</span>
              </Label>
              <span className="text-[10px] text-muted-foreground">
                Mínimo 8 caracteres
              </span>
            </div>
            <div className="relative">
              <Input
                id="novaSenha"
                type={mostrarNovaSenha ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Mínimo de 8 caracteres"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                disabled={salvando || sucesso}
                className="h-9 text-xs pr-9"
              />
              <button
                type="button"
                onClick={() => setMostrarNovaSenha((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                title={mostrarNovaSenha ? "Ocultar senha" : "Ver senha"}
                tabIndex={-1}
              >
                {mostrarNovaSenha ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmarSenha" className="text-xs font-semibold">
              Confirmar Nova Senha <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="confirmarSenha"
                type={mostrarConfirmarSenha ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Repita a nova senha"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                disabled={salvando || sucesso}
                className="h-9 text-xs pr-9"
              />
              <button
                type="button"
                onClick={() => setMostrarConfirmarSenha((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                title={mostrarConfirmarSenha ? "Ocultar senha" : "Ver senha"}
                tabIndex={-1}
              >
                {mostrarConfirmarSenha ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleOpenChange(false)}
              disabled={salvando}
              className="text-xs h-9"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={salvando || sucesso}
              className="text-xs h-9 gap-1.5 bg-primary text-primary-foreground font-semibold"
            >
              {salvando ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Atualizando...
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  Salvar Nova Senha
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
