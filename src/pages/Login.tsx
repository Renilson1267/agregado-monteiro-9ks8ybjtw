import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { ConcreteiraService } from '@/services/concreteira'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ShieldCheck,
  Lock,
  Mail,
  Loader2,
  AlertCircle,
  Sparkles,
  Building2,
} from 'lucide-react'
import { LOGO_GC_MIX_QUADRADA, LOGO_ALT_TEXT } from '@/assets/logos'

export default function Login() {
  const navigate = useNavigate()
  const { user, signIn, signUp, loading: authLoading } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nome, setNome] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)

  // Modo de primeiro acesso quando o banco não tiver nenhum usuário
  const [totalUsuarios, setTotalUsuarios] = useState<number | null>(null)
  const [modoPrimeiroAcesso, setModoPrimeiroAcesso] = useState(false)

  useEffect(() => {
    // Se já estiver logado, redirecionar
    if (!authLoading && user) {
      navigate('/', { replace: true })
    }
  }, [user, authLoading, navigate])

  useEffect(() => {
    // Verificar se existem usuários cadastrados
    ConcreteiraService.contarUsuariosApp().then((count) => {
      setTotalUsuarios(count)
      if (count === 0) {
        setModoPrimeiroAcesso(true)
      }
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)
    setSucesso(null)

    if (!email.trim() || !password) {
      setErro('Por favor, informe e-mail e senha.')
      return
    }

    setLoading(true)

    try {
      if (modoPrimeiroAcesso) {
        // Criar primeiro administrador
        if (!nome.trim()) {
          setErro('Informe o nome do primeiro administrador.')
          setLoading(false)
          return
        }

        const { error: signUpError } = await signUp(email, password, {
          name: nome.trim(),
        })
        if (signUpError) {
          setErro(
            signUpError.message || 'Erro ao criar primeiro administrador.',
          )
          setLoading(false)
          return
        }

        // Tentar login imediato caso já confirmado
        const { error: signInError } = await signIn(email, password)
        if (signInError) {
          setSucesso(
            'Administrador criado! Verifique a confirmação ou faça login com sua senha.',
          )
          setLoading(false)
          return
        }

        // Criar registro na tabela usuarios_app
        try {
          await ConcreteiraService.salvarUsuarioApp({
            nome: nome.trim(),
            email: email.trim().toLowerCase(),
            perfil: 'administrador',
            ativo: true,
          })
        } catch (dbErr) {
          console.warn('Registro de perfil no banco:', dbErr)
        }

        navigate('/', { replace: true })
        return
      }

      // Login normal
      const { data, error } = await signIn(email, password)
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErro('E-mail ou senha incorretos. Verifique suas credenciais.')
        } else if (error.message.includes('Email not confirmed')) {
          setErro(
            'E-mail ainda não confirmado. Verifique sua caixa de entrada.',
          )
        } else {
          setErro(error.message || 'Falha ao autenticar. Verifique seus dados.')
        }
        setLoading(false)
        return
      }

      // Validar se o usuário está ativo no cadastro interno da concreteira
      if (data?.user) {
        const appUser = await ConcreteiraService.buscarUsuarioAppPorAuth(
          data.user.id,
          data.user.email,
        )

        if (appUser && appUser.ativo === false) {
          setErro(
            'Seu usuário está desativado pelo administrador. Contate a diretoria.',
          )
          setLoading(false)
          return
        }

        // Se for balanceiro, já direciona para expedição
        if (appUser?.perfil === 'balanceiro') {
          navigate('/lancamentos', { replace: true })
        } else {
          navigate('/', { replace: true })
        }
      } else {
        navigate('/', { replace: true })
      }
    } catch (err: any) {
      console.error('Erro no login:', err)
      setErro('Ocorreu um erro inesperado ao conectar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const preencherPadrao = () => {
    setEmail('gcmixsje@gmail.com')
    setPassword('Skip@Pass123')
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background via-card to-background p-4 relative overflow-hidden">
      {/* Background Decorativo */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md border-border/40 bg-card/90 backdrop-blur-md shadow-2xl relative z-10">
        <CardHeader className="space-y-3 text-center pb-6">
          {/* Logo oficial GC MIX & Pedreira Cordeiro com moldura de alto contraste para ambos os temas */}
          <div className="mx-auto flex flex-col items-center">
            <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-border/60 shadow-lg shadow-primary/10">
              <img
                src={LOGO_GC_MIX_QUADRADA}
                alt={LOGO_ALT_TEXT}
                className="w-24 h-24 object-contain rounded-xl"
              />
            </div>
          </div>

          <div>
            <CardTitle className="text-2xl font-black tracking-tight flex items-center justify-center gap-2">
              GC MIX Concreto Usinado
            </CardTitle>
            <p className="text-xs font-medium text-muted-foreground mt-0.5">
              & Pedreira Cordeiro
            </p>
          </div>

          <CardDescription className="text-xs sm:text-sm">
            {modoPrimeiroAcesso
              ? 'Configuração inicial: crie o primeiro Administrador Geral'
              : 'Gestão integrada de usinas, produção, expedição e insumos'}
          </CardDescription>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mx-auto">
            <Building2 className="w-3.5 h-3.5" />
            <span>Unidades Monteiro & SJE</span>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {modoPrimeiroAcesso && (
              <Alert className="bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <AlertDescription className="text-xs">
                  Nenhum usuário cadastrado. Preencha seus dados para configurar
                  o Administrador principal.
                </AlertDescription>
              </Alert>
            )}

            {erro && (
              <Alert variant="destructive" className="py-2.5">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription className="text-xs">{erro}</AlertDescription>
              </Alert>
            )}

            {sucesso && (
              <Alert className="bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 py-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <AlertDescription className="text-xs">
                  {sucesso}
                </AlertDescription>
              </Alert>
            )}

            {modoPrimeiroAcesso && (
              <div className="space-y-1.5">
                <Label htmlFor="nome" className="text-xs font-semibold">
                  Nome Completo
                </Label>
                <Input
                  id="nome"
                  type="text"
                  placeholder="Ex: Carlos Oliveira"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-xs font-semibold flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="operador@concreteira.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-xs font-semibold flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
                required
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button
              type="submit"
              className="w-full font-bold h-10 shadow-md"
              disabled={loading || authLoading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {modoPrimeiroAcesso
                    ? 'Criando Administrador...'
                    : 'Entrando...'}
                </>
              ) : modoPrimeiroAcesso ? (
                'Criar e Acessar como Administrador'
              ) : (
                'Entrar no Sistema'
              )}
            </Button>

            {/* Dica para primeiro acesso padrão com o seed */}
            {!modoPrimeiroAcesso && (
              <div className="w-full p-2.5 rounded-lg bg-muted/40 border border-border/40 text-center">
                <p className="text-[11px] text-muted-foreground">
                  Acesso padrão de administrador inicial:
                </p>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="text-[11px] font-mono text-foreground font-semibold">
                    gcmixsje@gmail.com
                  </span>
                  <button
                    type="button"
                    onClick={preencherPadrao}
                    className="text-[11px] text-primary hover:underline font-bold"
                  >
                    (Preencher)
                  </button>
                </div>
              </div>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
