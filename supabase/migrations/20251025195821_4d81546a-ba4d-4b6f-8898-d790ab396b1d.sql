-- Create function to validate affiliate link
CREATE OR REPLACE FUNCTION public.validate_affiliate_link()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if amazon_url contains the required affiliate tag
  IF NEW.amazon_url IS NOT NULL AND NEW.amazon_url NOT LIKE '%tag=grandmaskitch-21%' THEN
    RAISE EXCEPTION 'Amazon URL must contain affiliate tag: tag=grandmaskitch-21';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to validate affiliate link on insert and update
DROP TRIGGER IF EXISTS validate_affiliate_link_trigger ON public.products;
CREATE TRIGGER validate_affiliate_link_trigger
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_affiliate_link();