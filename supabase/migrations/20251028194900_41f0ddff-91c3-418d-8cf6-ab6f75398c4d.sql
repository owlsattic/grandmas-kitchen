-- Remove the unique constraint on name alone
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_name_key;

-- Create a unique index that allows same name in different parent categories
-- NULL parent_id values are treated as distinct
CREATE UNIQUE INDEX categories_name_parent_idx 
ON public.categories (name, parent_id) 
WHERE parent_id IS NOT NULL;

-- Create a separate unique index for root level categories (NULL parent_id)
CREATE UNIQUE INDEX categories_name_root_idx 
ON public.categories (name) 
WHERE parent_id IS NULL;