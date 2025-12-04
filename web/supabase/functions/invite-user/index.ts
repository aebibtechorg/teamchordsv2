import { serve } from 'https://deno.land/std@0.221.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface CorsHeaders {
  [key: string]: string
  'Access-Control-Allow-Origin': string
  'Access-Control-Allow-Headers': string
}

interface Invite {
  email: string
  invited_by: string
  token: string
  expires_at: string
}

const corsHeaders: CorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  try {
    const supabaseClient: SupabaseClient = createClient(
      supabaseUrl ?? '',
      supabaseServiceRoleKey ?? '',
      {}
    )

    const supabase2: SupabaseClient = createClient(
      supabaseUrl ?? '',
      supabaseAnonKey ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user } } = await supabase2.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { email }: { email: string } = await req.json()
    if (!email) throw new Error('Email is required')

    const { data, error } = await supabaseClient.auth.admin.createUser({
      email,
      email_confirm: true,
      password: "WelcomeTeamChords!"
    })

    if (error) throw error

    const { data: profile, error: profileRetrieveError } = await supabase2
        .from("profiles")
        .select(`
            orgId,
            organizations(
                name
            )
        `)
        .eq("userId", user.id)
        .single()
    
    if (profileRetrieveError) {
        throw profileRetrieveError
    }
    

    const { data: profileCreated , error: profileCreateError } = await supabase2
      .from("profiles")
      .insert({
          userId: data.user.id,
          orgId: profile.orgId
      })
      .select('*')
    
    if (profileCreateError) {
        throw profileCreateError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        profileCreated
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error: unknown) {
    console.error('Error inviting user:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      },
    )
  }
})
