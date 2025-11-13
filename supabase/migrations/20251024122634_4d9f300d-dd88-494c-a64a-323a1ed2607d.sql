-- Change products.category from text to text[] to support multiple categories
ALTER TABLE public.products 
  ALTER COLUMN category TYPE text[] USING ARRAY[category];

-- Update existing products with null or empty category to have a default value
UPDATE public.products 
SET category = ARRAY['Kitchen & Dining']::text[]
WHERE category IS NULL OR category = '{}';

-- Add a constraint to ensure category array is not empty
ALTER TABLE public.products 
  ADD CONSTRAINT products_category_not_empty 
  CHECK (array_length(category, 1) > 0);