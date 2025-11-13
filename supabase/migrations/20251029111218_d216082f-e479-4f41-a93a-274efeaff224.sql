-- Create shop_items table for product catalog
CREATE TABLE IF NOT EXISTS public.shop_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  price_text TEXT,
  image_url TEXT NOT NULL,
  product_url TEXT NOT NULL,
  category TEXT,
  approved BOOLEAN DEFAULT true,
  rank INTEGER DEFAULT 100,
  amazon_asin TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS shop_items_rank_idx ON public.shop_items (rank ASC, created_at DESC);
CREATE INDEX IF NOT EXISTS shop_items_category_idx ON public.shop_items (category);
CREATE INDEX IF NOT EXISTS shop_items_approved_idx ON public.shop_items (approved);

-- Enable RLS
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;

-- Allow public to view approved products
CREATE POLICY "Anyone can view approved products"
ON public.shop_items
FOR SELECT
USING (approved = true);

-- Staff can insert products
CREATE POLICY "Staff can insert products"
ON public.shop_items
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role)
);

-- Staff can update products
CREATE POLICY "Staff can update products"
ON public.shop_items
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role)
);

-- Admins can delete products
CREATE POLICY "Admins can delete products"
ON public.shop_items
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_shop_items_updated_at
BEFORE UPDATE ON public.shop_items
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Insert sample products
INSERT INTO public.shop_items (title, description, price_text, image_url, product_url, category, approved, rank, amazon_asin)
VALUES
('Cast Iron Dutch Oven', 'Heavy-duty, oven-to-table classic that lasts a lifetime.', '£69.95',
 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400', 
 'https://www.amazon.co.uk/dp/B00008GKDQ', 'cookware', true, 1, 'B00008GKDQ'),

('Wooden Spoon Set', 'Solid beechwood spoons that never scratch your pans.', '£9.99',
 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400',
 'https://www.amazon.co.uk/dp/B07ABC1234', 'utensils', true, 2, 'B07ABC1234'),

('Kitchen Scale', 'Precise digital scale for baking and meal prep.', '£24.99',
 'https://images.unsplash.com/photo-1584866481905-ea2c2f8e5c38?w=400',
 'https://www.amazon.co.uk/dp/B00XYZ5678', 'tools', true, 3, 'B00XYZ5678');