-- Fix profiles table RLS policies
-- Add explicit INSERT policy (only via trigger/system)
CREATE POLICY "System can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (false);

-- Add explicit DELETE policy (admins only)
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix subscriptions table RLS policies
-- Add explicit INSERT policy (service role only, default deny for users)
CREATE POLICY "Service role can insert subscriptions"
ON public.subscriptions
FOR INSERT
WITH CHECK (false);

-- Add explicit UPDATE policy (service role only, default deny for users)
CREATE POLICY "Service role can update subscriptions"
ON public.subscriptions
FOR UPDATE
USING (false);

-- Add explicit DELETE policy (deny all)
CREATE POLICY "No one can delete subscriptions"
ON public.subscriptions
FOR DELETE
USING (false);

COMMENT ON POLICY "System can insert profiles" ON public.profiles IS 'Profiles are created only via auth trigger, not direct user INSERT';
COMMENT ON POLICY "Service role can insert subscriptions" ON public.subscriptions IS 'Subscriptions are managed only via edge functions with service role';
COMMENT ON POLICY "Service role can update subscriptions" ON public.subscriptions IS 'Subscriptions are managed only via edge functions with service role';
COMMENT ON POLICY "No one can delete subscriptions" ON public.subscriptions IS 'Subscriptions should never be deleted, only deactivated';