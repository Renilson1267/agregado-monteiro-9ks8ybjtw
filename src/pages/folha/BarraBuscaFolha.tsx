import React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, X, Eye, EyeOff } from "lucide-react"

export interface FiltrosBuscaFolha {
  termo: string
  tipo: "TODOS" | "FUNCIONARIO" | "TERCEIRO"
  situacao: "TODOS" | "ATIVOS" | "OCULTOS" | "INATIVOS"
}

interface BarraBuscaFolhaProps {
  filtros: FiltrosBuscaFolha
  onAlterarFiltros: (novos: FiltrosBuscaFolha) => void
  totalEncontrados: number
  totalGeral: number
  mostrarOcultosGeral: boolean
  onToggleMostrarOcultosGeral: () => void
}

export const BarraBuscaFolha: React.FC<BarraBuscaFolhaProps> = ({
  filtros,
  onAlterarFiltros,
  totalEncontrados,
  totalGeral,
  mostrarOcultosGeral,
  onToggleMostrarOcultosGeral,
}) => {
  const temFiltroAtivo =
    Boolean(filtros.termo) ||
    filtros.tipo !== "TODOS" ||
    filtros.situacao !== "TODOS"

  const handleLimpar = () => {
    onAlterarFiltros({
      termo: "",
      tipo: "TODOS",
      situacao: "TODOS",
    })
  }

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-2.5 bg-card rounded-lg border shadow-sm text-xs">
      <div className="flex flex-1 items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={filtros.termo}
            onChange={(e) =>
              onAlterarFiltros({ ...filtros, termo: e.target.value })
            }
            placeholder="Buscar por nome, função, PIX, conta, observação..."
            className="pl-8 pr-7 h-8 text-xs bg-background"
          />
          {filtros.termo && (
            <button
              onClick={() => onAlterarFiltros({ ...filtros, termo: "" })}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Filtro Tipo */}
        <Select
          value={filtros.tipo}
          onValueChange={(val: any) =>
            onAlterarFiltros({ ...filtros, tipo: val })
          }
        >
          <SelectTrigger className="h-8 text-xs w-[125px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos os tipos</SelectItem>
            <SelectItem value="FUNCIONARIO">Funcionários</SelectItem>
            <SelectItem value="TERCEIRO">Terceiros</SelectItem>
          </SelectContent>
        </Select>

        {/* Filtro Situação */}
        <Select
          value={filtros.situacao}
          onValueChange={(val: any) =>
            onAlterarFiltros({ ...filtros, situacao: val })
          }
        >
          <SelectTrigger className="h-8 text-xs w-[120px]">
            <SelectValue placeholder="Situação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todas situações</SelectItem>
            <SelectItem value="ATIVOS">Ativos</SelectItem>
            <SelectItem value="OCULTOS">Ocultos</SelectItem>
            <SelectItem value="INATIVOS">Inativos</SelectItem>
          </SelectContent>
        </Select>

        {temFiltroAtivo && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleLimpar}
            className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground px-2"
          >
            <X className="h-3.5 w-3.5" />
            Limpar
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 justify-end">
        <Badge variant="secondary" className="text-[11px] font-normal">
          {totalEncontrados} de {totalGeral} encontrados
        </Badge>

        <Button
          size="sm"
          variant={mostrarOcultosGeral ? "default" : "outline"}
          onClick={onToggleMostrarOcultosGeral}
          className="h-8 text-xs gap-1.5"
          title={
            mostrarOcultosGeral
              ? "Ocultar colaboradores marcados como ocultos"
              : "Exibir colaboradores marcados como ocultos"
          }
        >
          {mostrarOcultosGeral ? (
            <>
              <EyeOff className="h-3.5 w-3.5" />
              Ocultos Visíveis
            </>
          ) : (
            <>
              <Eye className="h-3.5 w-3.5" />
              Ver Ocultos
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
