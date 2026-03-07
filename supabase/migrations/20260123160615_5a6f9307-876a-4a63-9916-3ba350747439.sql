-- Permettre aux utilisateurs de s'attribuer le rôle vendor lors de l'inscription
-- (mais pas admin, qui reste réservé aux admins)

DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;

-- Les utilisateurs peuvent s'attribuer le rôle 'client' ou 'vendor' à eux-mêmes
CREATE POLICY "Users can self-assign vendor or client role"
ON public.user_roles
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND role IN ('client', 'vendor')
);

-- Seuls les admins peuvent attribuer le rôle admin
CREATE POLICY "Only admins can assign admin role"
ON public.user_roles
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  AND role = 'admin'
);