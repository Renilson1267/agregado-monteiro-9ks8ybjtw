import { useState, useEffect, useCallback } from 'react'
import { ConcreteiraService } from '@/services/concreteira'
import { useEmpresa } from '@/hooks/use-empresa'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import type { UsuarioApp } from '@/types/concreteira'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Users,
  Plus,
  ShieldCheck,
  Scale,
  Search,
  Building2,
  Lock,
  Mail,
  User,
  Power,
  Edit2,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'

export function PainelUsuarios() {
  const { empresas } = useEmpresa()
  const { signUp } = useAuth()
  const { toast } = useToast()

  const [usuarios, setUsuarios] = useState<UsuarioApp[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')

  // Estado do Modal de Criar / Editar Usuário
  const [openModal, setOpenModal] = useState(false)
  const [editando, setEditando] = useState<UsuarioApp | null>(null)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [perfil, setPerfil] = useState<'administrador' | 'balanceiro'>(
    'balanceiro',
  )
  const [empresaId, setEmpresaId] = useState<string>('todas')
  const [ativo, setAtivo] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erroModal, setErroModal] = useState<string | null>(null)

  const carregarUsuarios = useCallback(async () => {
    try {
      setLoading(true)
      const lista = await ConcreteiraService.listarUsuariosApp()
      setUsuarios(lista)
    } catch (err: any) {
      toast({
        title: 'Erro ao carregar usuários',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    carregarUsuarios()
  }, [carregarUsuarios])

  const handleNovoUsuario = () => {
    setEditando(null)
    setNome('')
    setEmail('')
    setSenha('')
    setPerfil('balanceiro')
    // Padrão para novo balanceiro: primeira empresa; para admin seria 'todas'
    const primeiraEmpresa = empresas[0]?.id || 'todas'
    setEmpresaId(primeiraEmpresa)
    setAtivo(true)
    setErroModal(null)
    setOpenModal(true)
  }

  const handleEditarUsuario = (user: UsuarioApp) => {
    setEditando(user)
    setNome(user.nome)
    setEmail(user.email)
    setSenha('') // Senha em branco não altera
    setPerfil(user.perfil)
    setEmpresaId(user.empresa_id || 'todas')
    setAtivo(user.ativo)
    setErroModal(null)
    setOpenModal(true)
  }

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErroModal(null)

    if (!nome.trim() || !email.trim()) {
      setErroModal('Nome e e-mail são obrigatórios.')
      return
    }

    if (!editando && (!senha || senha.length < 6)) {
      setErroModal(
        'Para criar novo usuário, informe uma senha inicial com pelo menos 6 caracteres.',
      )
      return
    }

    // Regra: Balanceiro DEVE ter empresa vinculada
    if (perfil === 'balanceiro' && (empresaId === 'todas' || !empresaId)) {
      setErroModal(
        'Operador Balanceiro precisa estar vinculado a uma empresa específica.',
      )
      return
    }

    setSalvando(true)

    try {
      let createdAuthUserId: string | null = editando?.user_id || null

      // Se for novo usuário, criar credencial via signUp
      if (!editando) {
        const { data: signUpData, error: signUpError } = await signUp(
          email.trim().toLowerCase(),
          senha,
          { name: nome.trim() },
        )

        if (signUpError) {
          // Se já existir no auth, continua para salvar na usuarios_app
          if (
            !signUpError.message?.toLowerCase().includes('already registered')
          ) {
            throw new Error(
              `Falha ao criar credencial de autenticação: ${signUpError.message}`,
            )
          }
        }

        if (signUpData?.user?.id) {
          createdAuthUserId = signUpData.user.id
        }
      }

      await ConcreteiraService.salvarUsuarioApp({
        id: editando?.id,
        user_id: createdAuthUserId,
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        perfil,
        empresa_id: empresaId === 'todas' ? null : empresaId,
        ativo,
      })

      toast({
        title: editando ? 'Usuário atualizado!' : 'Usuário criado com sucesso!',
        description: !editando
          ? `O operador ${nome} já pode efetuar login com o e-mail ${email} e a senha informada.`
          : `Cadastro de ${nome} salvo com sucesso.`,
      })

      setOpenModal(false)
      carregarUsuarios()
    } catch (err: any) {
      console.error('Erro ao salvar usuário:', err)
      setErroModal(err.message || 'Erro ao salvar dados do usuário.')
    } finally {
      setSalvando(false)
    }
  }

  const handleAlternarStatus = async (user: UsuarioApp) => {
    try {
      const novoStatus = !user.ativo
      await ConcreteiraService.alternarStatusUsuarioApp(user.id, novoStatus)
      toast({
        title: novoStatus ? 'Usuário ativado' : 'Usuário desativado',
        description: `${user.nome} agora está ${novoStatus ? 'ativo' : 'desativado'}.`,
      })
      carregarUsuarios()
    } catch (err: any) {
      toast({
        title: 'Erro ao alterar status',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  const usuariosFiltrados = usuarios.filter((u) => {
    const termo = busca.toLowerCase()
    return (
      u.nome.toLowerCase().includes(termo) ||
      u.email.toLowerCase().includes(termo) ||
      u.perfil.toLowerCase().includes(termo) ||
      (u.empresa_nome && u.empresa_nome.toLowerCase().includes(termo))
    )
  })

  return (
    <div className="space-y-4">
      <Card className="border-border/40 bg-card/70">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Gestão de Usuários e Perfis de Acesso
            </CardTitle>
            <CardDescription className="text-xs">
              Cadastre operadores, defina seus perfis (Administrador ou
              Balanceiro) e restrinja a empresa permitida
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, e-mail, perfil..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>
            <Button
              size="sm"
              onClick={handleNovoUsuario}
              className="gap-1 bg-primary text-primary-foreground text-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Novo Usuário
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              Carregando lista de usuários...
            </div>
          ) : usuariosFiltrados.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-xs italic">
              Nenhum usuário encontrado. Clique em "Novo Usuário" para
              cadastrar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/40 border-b border-border/40">
                  <tr>
                    <th className="py-2.5 px-3">Nome / Operador</th>
                    <th className="py-2.5 px-3">E-mail</th>
                    <th className="py-2.5 px-3">Perfil</th>
                    <th className="py-2.5 px-3">Empresa Vinculada</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {usuariosFiltrados.map((u) => {
                    const isAdm = u.perfil === 'administrador'
                    return (
                      <tr
                        key={u.id}
                        className={`hover:bg-muted/20 transition-colors ${!u.ativo ? 'opacity-60 bg-muted/10' : ''}`}
                      >
                        <td className="py-2.5 px-3 font-semibold text-foreground flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                              isAdm
                                ? 'bg-primary/20 text-primary'
                                : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {u.nome.slice(0, 1).toUpperCase()}
                          </div>
                          <span>{u.nome}</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-muted-foreground">
                          {u.email}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge
                            variant={isAdm ? 'default' : 'secondary'}
                            className={`text-[10px] font-bold gap-1 ${
                              isAdm
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {isAdm ? (
                              <ShieldCheck className="w-3 h-3" />
                            ) : (
                              <Scale className="w-3 h-3" />
                            )}
                            {isAdm ? 'Administrador' : 'Balanceiro'}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3">
                          {u.empresa_nome ? (
                            <div className="flex items-center gap-1.5 font-medium text-foreground">
                              <Building2 className="w-3.5 h-3.5 text-primary" />
                              <span>{u.empresa_nome}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-[11px] italic">
                              Todas (Acesso Livre)
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              u.ativo
                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'border-destructive/30 bg-destructive/10 text-destructive'
                            }`}
                          >
                            {u.ativo ? 'Ativo' : 'Desativado'}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => handleEditarUsuario(u)}
                              title="Editar Usuário"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-foreground" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-7 w-7 p-0 ${
                                u.ativo
                                  ? 'text-amber-600 hover:text-amber-700'
                                  : 'text-emerald-600 hover:text-emerald-700'
                              }`}
                              onClick={() => handleAlternarStatus(u)}
                              title={
                                u.ativo ? 'Desativar Usuário' : 'Ativar Usuário'
                              }
                            >
                              <Power className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Criar / Editar Usuário */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              {editando
                ? 'Editar Usuário do Sistema'
                : 'Novo Usuário do Sistema'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Amarre os dados cadastrais, perfil de acesso e empresa vinculada
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSalvar} className="space-y-4 pt-2">
            {erroModal && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{erroModal}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                Nome Completo
              </Label>
              <Input
                placeholder="Ex: João Silva"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                disabled={salvando}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                E-mail (Usado no Login)
              </Label>
              <Input
                type="email"
                placeholder="usuario@concreteira.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={salvando || !!editando}
                required
              />
            </div>

            {!editando && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                  Senha Inicial de Acesso
                </Label>
                <Input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  disabled={salvando}
                  required
                />
                <p className="text-[10px] text-muted-foreground">
                  O operador usará este e-mail e senha para autenticar no
                  sistema.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Perfil de Acesso
                </Label>
                <Select
                  value={perfil}
                  onValueChange={(val: 'administrador' | 'balanceiro') => {
                    setPerfil(val)
                    if (val === 'administrador' && empresaId !== 'todas') {
                      // Sugere multicompany para administrador
                      setEmpresaId('todas')
                    } else if (val === 'balanceiro' && empresaId === 'todas') {
                      // Força seleção de uma empresa específica para balanceiro
                      setEmpresaId(empresas[0]?.id || '')
                    }
                  }}
                  disabled={salvando}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Selecione o perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="balanceiro">
                      Balanceiro (Expedição)
                    </SelectItem>
                    <SelectItem value="administrador">
                      Administrador (Total)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center justify-between">
                  <span>Empresa Permitida</span>
                  {perfil === 'administrador' && (
                    <span className="text-[10px] text-primary font-normal">
                      (Multicompany liberado)
                    </span>
                  )}
                </Label>
                <Select
                  value={empresaId}
                  onValueChange={(val) => setEmpresaId(val)}
                  disabled={salvando}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Selecione a empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {perfil === 'administrador' && (
                      <SelectItem value="todas">
                        Todas as Empresas (Monteiro, SJE e futuras)
                      </SelectItem>
                    )}
                    {empresas.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.nome}{' '}
                        {perfil === 'balanceiro'
                          ? '(Obrigatório)'
                          : '(Unidade inicial)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {perfil === 'balanceiro' ? (
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300">
                <strong>Regra Balanceiro:</strong> Cai direto na expedição
                (/lancamentos) com campos liberados para digitação. Fica FIXO na
                sua unidade selecionada (
                {empresas.find((e) => e.id === empresaId)?.nome ||
                  'Selecione acima'}
                ) sem poder trocar de empresa.
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-[11px] text-primary space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  Administrador Multicompany (Monteiro + SJE)
                </div>
                <p>
                  O Administrador tem acesso irrestrito a todas as empresas e
                  pode alternar livremente entre Monteiro e SJE pelo seletor do
                  topo. Os dados de cada unidade permanecem isolados e
                  protegidos.
                </p>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpenModal(false)}
                disabled={salvando}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={salvando}
                className="gap-1.5"
              >
                {salvando ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Salvar Usuário
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
