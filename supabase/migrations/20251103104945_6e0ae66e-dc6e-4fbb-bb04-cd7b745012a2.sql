-- Add table decorations and dining categories under "Dining & Serving"

-- Step 1: Create child categories under "Dining & Serving"
INSERT INTO categories (name, level, parent_id)
SELECT 'Table Linens', 1, id FROM categories WHERE name = 'Dining & Serving' AND level = 0
UNION ALL
SELECT 'Drinkware', 1, id FROM categories WHERE name = 'Dining & Serving' AND level = 0
UNION ALL
SELECT 'Table Accessories', 1, id FROM categories WHERE name = 'Dining & Serving' AND level = 0
UNION ALL
SELECT 'Serving & Condiments', 1, id FROM categories WHERE name = 'Dining & Serving' AND level = 0
UNION ALL
SELECT 'Barware & Tools', 1, id FROM categories WHERE name = 'Dining & Serving' AND level = 0
UNION ALL
SELECT 'Dining Aids', 1, id FROM categories WHERE name = 'Dining & Serving' AND level = 0;

-- Step 2: Create grandchild categories under Table Linens
INSERT INTO categories (name, level, parent_id)
SELECT 'Tablecloths', 2, id FROM categories WHERE name = 'Table Linens' AND level = 1
UNION ALL
SELECT 'Napkins & Napkin Rings', 2, id FROM categories WHERE name = 'Table Linens' AND level = 1;

-- Step 3: Create grandchild categories under Drinkware
INSERT INTO categories (name, level, parent_id)
SELECT 'Red Wine Glasses', 2, id FROM categories WHERE name = 'Drinkware' AND level = 1
UNION ALL
SELECT 'White Wine Glasses', 2, id FROM categories WHERE name = 'Drinkware' AND level = 1
UNION ALL
SELECT 'Spirits Glasses', 2, id FROM categories WHERE name = 'Drinkware' AND level = 1
UNION ALL
SELECT 'Decanters', 2, id FROM categories WHERE name = 'Drinkware' AND level = 1;

-- Step 4: Create grandchild categories under Table Accessories
INSERT INTO categories (name, level, parent_id)
SELECT 'Place Settings & Mats', 2, id FROM categories WHERE name = 'Table Accessories' AND level = 1
UNION ALL
SELECT 'Candles & Holders', 2, id FROM categories WHERE name = 'Table Accessories' AND level = 1
UNION ALL
SELECT 'Salt & Pepper Sets', 2, id FROM categories WHERE name = 'Table Accessories' AND level = 1;

-- Step 5: Create grandchild categories under Serving & Condiments
INSERT INTO categories (name, level, parent_id)
SELECT 'Gravy & Sauce Servers', 2, id FROM categories WHERE name = 'Serving & Condiments' AND level = 1
UNION ALL
SELECT 'Condiment Dishes', 2, id FROM categories WHERE name = 'Serving & Condiments' AND level = 1
UNION ALL
SELECT 'Preserve Servers', 2, id FROM categories WHERE name = 'Serving & Condiments' AND level = 1;

-- Step 6: Create grandchild category under Barware & Tools
INSERT INTO categories (name, level, parent_id)
SELECT 'Corkscrews & Bottle Openers', 2, id FROM categories WHERE name = 'Barware & Tools' AND level = 1;

-- Step 7: Create grandchild category under Dining Aids
INSERT INTO categories (name, level, parent_id)
SELECT 'Booster Seats & Chair Risers', 2, id FROM categories WHERE name = 'Dining Aids' AND level = 1;