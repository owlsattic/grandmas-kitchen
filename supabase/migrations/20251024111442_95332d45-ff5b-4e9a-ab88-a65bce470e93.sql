-- Add new product attributes columns
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS brand text,
ADD COLUMN IF NOT EXISTS material text,
ADD COLUMN IF NOT EXISTS colour text,
ADD COLUMN IF NOT EXISTS rating numeric(3,1);