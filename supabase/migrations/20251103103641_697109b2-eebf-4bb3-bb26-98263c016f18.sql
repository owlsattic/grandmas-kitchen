-- First, get the IDs of categories we'll be reorganizing
-- We'll create new parent categories and restructure the existing ones

-- Step 1: Create new parent-level categories
INSERT INTO categories (name, level, parent_id) VALUES 
  ('Cookware & Bakeware', 0, NULL),
  ('Kitchen Tools', 0, NULL),
  ('Storage & Organization', 0, NULL),
  ('Dining & Serving', 0, NULL);

-- Step 2: Move existing categories to be children of appropriate parents
-- Update Cookware to be child of "Cookware & Bakeware"
UPDATE categories 
SET parent_id = (SELECT id FROM categories WHERE name = 'Cookware & Bakeware' AND level = 0),
    level = 1
WHERE name = 'Cookware';

-- Update Bakeware to be child of "Cookware & Bakeware"
UPDATE categories 
SET parent_id = (SELECT id FROM categories WHERE name = 'Cookware & Bakeware' AND level = 0),
    level = 1
WHERE name = 'Bakeware';

-- Update "Pots & Pans" to be grandchild under Cookware
UPDATE categories 
SET parent_id = (SELECT id FROM categories WHERE name = 'Cookware' AND level = 1),
    level = 2
WHERE name = 'Pots & Pans';

-- Move Cutlery under "Kitchen Tools"
UPDATE categories 
SET parent_id = (SELECT id FROM categories WHERE name = 'Kitchen Tools' AND level = 0),
    level = 1
WHERE name = 'Cutlery';

-- Move Utensils under "Kitchen Tools"
UPDATE categories 
SET parent_id = (SELECT id FROM categories WHERE name = 'Kitchen Tools' AND level = 0),
    level = 1
WHERE name = 'Utensils';

-- Move Kitchen Gadgets under "Kitchen Tools"
UPDATE categories 
SET parent_id = (SELECT id FROM categories WHERE name = 'Kitchen Tools' AND level = 0),
    level = 1
WHERE name = 'Kitchen Gadgets';

-- Move Containers under "Storage & Organization"
UPDATE categories 
SET parent_id = (SELECT id FROM categories WHERE name = 'Storage & Organization' AND level = 0),
    level = 1
WHERE name = 'Containers';

-- Move Storage under "Storage & Organization" and rename it
UPDATE categories 
SET parent_id = (SELECT id FROM categories WHERE name = 'Storage & Organization' AND level = 0),
    level = 1,
    name = 'Storage Solutions'
WHERE name = 'Storage';

-- The "Storage & Organization" child category should be renamed to avoid conflict
UPDATE categories
SET name = 'Kitchen Organization'
WHERE name = 'Storage & Organization' AND level = 1;

-- Move "Kitchen & Dining" under "Dining & Serving"
UPDATE categories 
SET parent_id = (SELECT id FROM categories WHERE name = 'Dining & Serving' AND level = 0),
    level = 1
WHERE name = 'Kitchen & Dining';

-- Keep Appliances and Weighing Scales as top-level (no parent)
-- They're already at level 0, so no changes needed

-- Step 3: Add some useful grandchild categories
INSERT INTO categories (name, level, parent_id) 
SELECT 'Skillets & Woks', 2, id FROM categories WHERE name = 'Cookware' AND level = 1
UNION ALL
SELECT 'Baking Sheets', 2, id FROM categories WHERE name = 'Bakeware' AND level = 1
UNION ALL
SELECT 'Specialty Knives', 2, id FROM categories WHERE name = 'Cutlery' AND level = 1
UNION ALL
SELECT 'Cooking Utensils', 2, id FROM categories WHERE name = 'Utensils' AND level = 1
UNION ALL
SELECT 'Serving Utensils', 2, id FROM categories WHERE name = 'Utensils' AND level = 1
UNION ALL
SELECT 'Food Storage', 2, id FROM categories WHERE name = 'Containers' AND level = 1;

-- Step 4: Update products that use old category references
-- Products store categories as arrays of names, so we need to update the category names in product records
-- For products with "Storage" category, update to "Storage Solutions"
UPDATE products
SET category = array_replace(category, 'Storage', 'Storage Solutions')
WHERE 'Storage' = ANY(category);