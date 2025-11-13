-- Add fab_table column to products table
ALTER TABLE public.products 
ADD COLUMN fab_table jsonb DEFAULT '[]'::jsonb;