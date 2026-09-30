import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Credenciais de serviço do Supabase não configuradas no ambiente.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    const { userId, email } = await req.json().catch(() => ({}))

    if (!userId && !email) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Parâmetro userId ou email obrigatório.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    let targetUserId = userId

    if (!targetUserId && email) {
      const { data: userData, error: getUserError } =
        await supabaseAdmin.auth.admin.listUsers()
      if (getUserError) throw getUserError
      const found = userData.users.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase().trim(),
      )
      if (!found) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Usuário com e-mail ${email} não encontrado no Auth.`,
          }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        )
      }
      targetUserId = found.id
    }

    // Chama o endpoint Admin API: PUT /auth/v1/admin/users/{id} com email_confirm: true
    const { data: updatedUser, error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        email_confirm: true,
      })

    if (updateError) {
      return new Response(
        JSON.stringify({ success: false, error: updateError.message }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message:
          "E-mail do usuário confirmado com sucesso via Supabase Admin API.",
        user: {
          id: updatedUser.user.id,
          email: updatedUser.user.email,
          email_confirmed_at: updatedUser.user.email_confirmed_at,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "Erro inesperado ao confirmar e-mail do usuário.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    )
  }
})
