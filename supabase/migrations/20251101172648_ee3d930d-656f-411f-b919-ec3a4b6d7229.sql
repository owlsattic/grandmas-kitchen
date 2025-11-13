-- Add fulfillment_by column to products table
ALTER TABLE products 
ADD COLUMN fulfillment_by text NOT NULL DEFAULT 'amazon' CHECK (fulfillment_by IN ('amazon', 'grandmas_kitchen'));