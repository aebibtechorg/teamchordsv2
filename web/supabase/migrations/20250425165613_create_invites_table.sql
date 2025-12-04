-- Create invites table
CREATE TABLE IF NOT EXISTS public.invites (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  email text NOT NULL,
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  token text NOT NULL,
  used boolean NOT NULL DEFAULT false,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  CONSTRAINT invites_pkey PRIMARY KEY (id),
  CONSTRAINT invites_email_token_key UNIQUE (email, token)
);

-- Enable RLS for invites
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- Create policies for invites
CREATE POLICY "Users can view their own invites" 
ON public.invites
FOR SELECT
USING (auth.uid() = invited_by);

CREATE POLICY "Users can create invites" 
ON public.invites
FOR INSERT
WITH CHECK (auth.uid() = invited_by);
