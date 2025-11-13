-- Enable trigram extension for fast ILIKE searches
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add GIN indexes on text columns for fast search
CREATE INDEX IF NOT EXISTS shop_items_title_trgm_idx
  ON public.shop_items USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS shop_items_description_trgm_idx
  ON public.shop_items USING gin (description gin_trgm_ops);

CREATE INDEX IF NOT EXISTS shop_items_asin_trgm_idx
  ON public.shop_items USING gin (amazon_asin gin_trgm_ops);