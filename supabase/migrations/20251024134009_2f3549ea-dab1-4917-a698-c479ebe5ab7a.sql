-- Add short_description field to products table
ALTER TABLE public.products 
ADD COLUMN short_description text;