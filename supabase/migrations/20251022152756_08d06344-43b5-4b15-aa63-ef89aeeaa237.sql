-- Drop the restrictive first admin policy that's blocking admin role creation
DROP POLICY IF EXISTS "Allow first admin creation" ON public.user_roles;

-- Recreate it as a permissive policy that doesn't block other inserts
CREATE POLICY "Allow first admin creation" 
ON public.user_roles 
FOR INSERT 
TO authenticated
WITH CHECK (
  (role = 'admin'::app_role) 
  AND (NOT (EXISTS ( SELECT 1
   FROM user_roles user_roles_1
  WHERE (user_roles_1.role = 'admin'::app_role)))) 
  AND (user_id = auth.uid())
);

-- Make sure the admin insert policy is also permissive (recreate it)
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;

CREATE POLICY "Admins can insert roles" 
ON public.user_roles 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));