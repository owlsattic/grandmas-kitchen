-- Add approved column to products table for moderation workflow
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false;

-- Add index for faster queries filtering by approval status
CREATE INDEX IF NOT EXISTS idx_products_approved ON public.products(approved);

-- Add comment explaining the column
COMMENT ON COLUMN public.products.approved IS 'Whether the product has been reviewed and approved for display in the shop';