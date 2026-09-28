import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useEmpresa } from "@/hooks/use-empresa"
import { Building2, Plus, Edit, Check, Shield } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface ModalGerenciarEmpresasProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ModalGerenciarEmpresas({
  open,
  onOpenChange,
}: ModalGerenciarEmpresasProps) {
  const { empresas, empresaAtiva, selecionarEmpresa, salvarEmpresa } =
    useEmpresa()
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [nome, setNome] = useState("")
  const [slug, setSlug] = useState("")
  const [salvando, setSalvando] = useState(false)
  const [modoNovo, setModoNovo] = useState(false)

  const iniciarEdicao = (emp: any) => {
    setEditandoId(emp.id)
    setNome(emp.nome)
    setSlug(emp.slug)
    setModoNovo(false)
  }

  const iniciarNovo = () => {
    setEditandoId(null)
    setNome("")
    setSlug("")
    setModoNovo(true)
  }

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim() || !slug.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Informe o nome e o código identificador (slug).",
        variant: "destructive",
      })
      return
    }

    setSalvando(true)
    try {
      await salvarEmpresa({
        id: editandoId || undefined,
        nome: nome.trim(),
        slug: slug.trim(),
        ativo: true,
      })
      toast({
        title: editandoId ? "Empresa atualizada!" : "Empresa cadastrada!",
        description: "Dados salvos com sucesso.",
      })
      setModoNovo(false)
      setEditandoId(null)
      setNome("")
      setSlug("")
    } catch (err: any) {
      toast({
        title: "Erro ao salvar empresa",
        description: err.message || "Código/slug já em uso.",
        variant: "destructive",
      })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Building2 className="w-5 h-5 text-primary" />
            Unidades e Empresas
          </DialogTitle>
          <DialogDescription className="text-xs">
            Alterne entre unidades da concreteira ou cadastre novas filiais. Os
            dados operacionais (cargas, estoques, traços e frotas) são 100%
            isolados.
          </DialogDescription>
        </DialogHeader>

        {/* Lista de Empresas */}
        <div className="space-y-2 py-2">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              Empresas Disponíveis ({empresas.length})
            </span>
            {!modoNovo && (
              <Button
                variant="outline"
                size="sm"
                onClick={iniciarNovo}
                className="h-7 text-xs gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Nova Empresa
              </Button>
            )}
          </div>

          <div className="grid gap-2">
            {empresas.map((emp) => {
              const isAtiva = empresaAtiva?.id === emp.id
              return (
                <div
                  key={emp.id}
                  className={`p-3 rounded-lg border transition-all flex items-center justify-between ${
                    isAtiva
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border/40 bg-card/60 hover:border-border"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
                        isAtiva
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {emp.nome.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">
                          {emp.nome}
                        </span>
                        {isAtiva && (
                          <Badge
                            variant="default"
                            className="text-[10px] h-4 px-1.5 bg-primary text-primary-foreground"
                          >
                            Ativa
                          </Badge>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        Slug: {emp.slug}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!isAtiva && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          selecionarEmpresa(emp.id)
                          toast({
                            title: `Unidade alterada para ${emp.nome}`,
                          })
                        }}
                      >
                        Selecionar
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => iniciarEdicao(emp)}
                      title="Editar"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Formulário de Criação/Edição */}
        {(modoNovo || editandoId) && (
          <form
            onSubmit={handleSalvar}
            className="p-3.5 rounded-lg border border-border/50 bg-background/50 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-foreground">
                {editandoId ? "Editar Empresa" : "Cadastrar Nova Empresa"}
              </h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-muted-foreground"
                onClick={() => {
                  setModoNovo(false)
                  setEditandoId(null)
                }}
              >
                Cancelar
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="nomeEmp" className="text-xs">
                  Nome da Empresa / Unidade *
                </Label>
                <Input
                  id="nomeEmp"
                  placeholder="Ex: Unidade Sertânia"
                  value={nome}
                  onChange={(e) => {
                    setNome(e.target.value)
                    if (!editandoId) {
                      setSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]/g, "-")
                          .replace(/-+/g, "-"),
                      )
                    }
                  }}
                  className="h-8 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="slugEmp" className="text-xs">
                  Identificador Único (Slug) *
                </Label>
                <Input
                  id="slugEmp"
                  placeholder="Ex: sertania"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="h-8 text-xs font-mono"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="submit"
                size="sm"
                disabled={salvando}
                className="h-8 text-xs bg-primary text-primary-foreground"
              >
                {salvando ? "Salvando..." : "Salvar Empresa"}
              </Button>
            </div>
          </form>
        )}

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
