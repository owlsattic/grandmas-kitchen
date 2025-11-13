-- Add policy to allow bootstrap of first admin
CREATE POLICY "Allow first admin creation"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  role = 'admin' 
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE role = 'admin'
  )
  AND user_id = auth.uid()
);