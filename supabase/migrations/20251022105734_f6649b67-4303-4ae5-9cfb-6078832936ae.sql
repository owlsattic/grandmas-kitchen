-- Add subscription tier to subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN tier text NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'country', 'all', 'premium'));

-- Add country field to profiles for country-restricted access
ALTER TABLE public.profiles 
ADD COLUMN selected_country text;

-- Create user_recipes table for premium users to add their own recipes
CREATE TABLE public.user_recipes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  country text NOT NULL,
  time integer NOT NULL,
  servings integer NOT NULL,
  ingredients text[] NOT NULL,
  instructions text[] NOT NULL,
  nutrition jsonb,
  image text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on user_recipes
ALTER TABLE public.user_recipes ENABLE ROW LEVEL SECURITY;

-- Premium users can create their own recipes
CREATE POLICY "Premium users can insert recipes" 
ON public.user_recipes 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.subscriptions 
    WHERE user_id = auth.uid() 
    AND tier = 'premium' 
    AND status = 'active'
  )
);

-- Premium users can update their own recipes
CREATE POLICY "Users can update their own recipes" 
ON public.user_recipes 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Premium users can delete their own recipes
CREATE POLICY "Users can delete their own recipes" 
ON public.user_recipes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Anyone can view user recipes based on their subscription tier
CREATE POLICY "Users can view recipes based on tier" 
ON public.user_recipes 
FOR SELECT 
USING (
  -- Premium and all-recipes users can see all user recipes
  EXISTS (
    SELECT 1 FROM public.subscriptions 
    WHERE user_id = auth.uid() 
    AND tier IN ('all', 'premium') 
    AND status = 'active'
  )
  -- Country-tier users can see recipes from their selected country
  OR EXISTS (
    SELECT 1 FROM public.subscriptions s
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE s.user_id = auth.uid() 
    AND s.tier = 'country' 
    AND s.status = 'active'
    AND p.selected_country = user_recipes.country
  )
);

-- Add trigger for updated_at on user_recipes
CREATE TRIGGER update_user_recipes_updated_at
BEFORE UPDATE ON public.user_recipes
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Update profiles policy to allow country selection
CREATE POLICY "Users can update their country" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Create function to check subscription tier
CREATE OR REPLACE FUNCTION public.get_user_subscription_tier(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tier 
  FROM public.subscriptions 
  WHERE subscriptions.user_id = get_user_subscription_tier.user_id 
  AND status = 'active'
  LIMIT 1;
$$;