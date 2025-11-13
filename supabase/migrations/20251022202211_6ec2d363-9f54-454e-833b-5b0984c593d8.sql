-- Add support for multiple images and video for products
ALTER TABLE products
ADD COLUMN images text[] DEFAULT '{}',
ADD COLUMN video_url text;

-- Migrate existing image_url data to images array
UPDATE products
SET images = ARRAY[image_url]
WHERE image_url IS NOT NULL AND image_url != '';

-- Keep image_url for backward compatibility but it's no longer the primary field
COMMENT ON COLUMN products.images IS 'Array of up to 10 product image URLs';
COMMENT ON COLUMN products.video_url IS 'Optional product video URL (YouTube, Vimeo, etc.)';