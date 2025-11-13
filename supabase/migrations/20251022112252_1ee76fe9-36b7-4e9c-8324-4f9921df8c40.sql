-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Update user_recipes RLS to allow admins and moderators to add recipes
DROP POLICY IF EXISTS "Premium users can insert recipes" ON public.user_recipes;

CREATE POLICY "Premium users and staff can insert recipes"
ON public.user_recipes
FOR INSERT
WITH CHECK (
  (auth.uid() = user_id) AND (
    (EXISTS (
      SELECT 1 FROM subscriptions
      WHERE subscriptions.user_id = auth.uid()
      AND subscriptions.tier = 'premium'
      AND subscriptions.status = 'active'
    ))
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'moderator')
  )
);

-- Allow admins to update any recipe
CREATE POLICY "Admins can update any recipe"
ON public.user_recipes
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete any recipe
CREATE POLICY "Admins can delete any recipe"
ON public.user_recipes
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));