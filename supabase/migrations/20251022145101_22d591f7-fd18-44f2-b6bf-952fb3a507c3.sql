-- Add is_staff flag to profiles to separate staff from customers
ALTER TABLE profiles ADD COLUMN is_staff boolean NOT NULL DEFAULT false;

-- Add recipe visibility and author display name
CREATE TYPE recipe_visibility AS ENUM ('private', 'pending_review', 'public');
ALTER TABLE user_recipes ADD COLUMN visibility recipe_visibility NOT NULL DEFAULT 'private';
ALTER TABLE user_recipes ADD COLUMN author_display_name text;

-- Update handle_new_user to handle staff accounts (no subscription for staff)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_staff_member boolean;
BEGIN
  -- Get is_staff from metadata (will be set during staff creation)
  is_staff_member := COALESCE((NEW.raw_user_meta_data->>'is_staff')::boolean, false);
  
  -- Create profile with email and staff flag
  INSERT INTO public.profiles (id, full_name, email, is_staff)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    is_staff_member
  );
  
  -- Only create subscription record for non-staff users
  IF NOT is_staff_member THEN
    INSERT INTO public.subscriptions (user_id, status)
    VALUES (NEW.id, 'inactive');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update RLS policies for recipes based on visibility
DROP POLICY IF EXISTS "Users can view recipes based on tier" ON user_recipes;

-- Policy 1: Users can always view their own recipes
CREATE POLICY "Users can view own recipes"
ON user_recipes
FOR SELECT
USING (auth.uid() = user_id);

-- Policy 2: Users can view public recipes based on subscription tier
CREATE POLICY "Users can view public recipes based on tier"
ON user_recipes
FOR SELECT
USING (
  visibility = 'public'
  AND (
    EXISTS (
      SELECT 1 FROM subscriptions
      WHERE user_id = auth.uid()
        AND tier IN ('all', 'premium')
        AND status = 'active'
    )
    OR
    EXISTS (
      SELECT 1 FROM subscriptions s
      JOIN profiles p ON p.id = auth.uid()
      WHERE s.user_id = auth.uid()
        AND s.tier = 'country'
        AND s.status = 'active'
        AND p.selected_country = user_recipes.country
    )
  )
);

-- Policy 3: Staff (moderators and admins) can view pending recipes for moderation
CREATE POLICY "Staff can view pending recipes"
ON user_recipes
FOR SELECT
USING (
  visibility = 'pending_review'
  AND (has_role(auth.uid(), 'moderator'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

-- Policy 4: Staff can update recipe visibility (for moderation)
CREATE POLICY "Staff can update recipe for moderation"
ON user_recipes
FOR UPDATE
USING (
  has_role(auth.uid(), 'moderator'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
);