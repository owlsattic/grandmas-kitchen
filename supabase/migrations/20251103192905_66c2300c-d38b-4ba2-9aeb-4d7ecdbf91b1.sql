-- Create recipe_categories table for managing recipe categories
CREATE TABLE IF NOT EXISTS public.recipe_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recipe_categories ENABLE ROW LEVEL SECURITY;

-- Anyone can view recipe categories
CREATE POLICY "Anyone can view recipe categories"
ON public.recipe_categories
FOR SELECT
USING (true);

-- Admins can insert recipe categories
CREATE POLICY "Admins can insert recipe categories"
ON public.recipe_categories
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Admins can update recipe categories
CREATE POLICY "Admins can update recipe categories"
ON public.recipe_categories
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Admins can delete recipe categories
CREATE POLICY "Admins can delete recipe categories"
ON public.recipe_categories
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_recipe_categories_updated_at
BEFORE UPDATE ON public.recipe_categories
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Insert default recipe categories
INSERT INTO public.recipe_categories (name) VALUES
  ('Appetizer'),
  ('Soups'),
  ('Desserts'),
  ('Juices'),
  ('Salads'),
  ('Main Dishes')
ON CONFLICT (name) DO NOTHING;