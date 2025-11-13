-- Add parent_id column to recipe_categories for hierarchy
ALTER TABLE recipe_categories 
ADD COLUMN parent_id uuid REFERENCES recipe_categories(id) ON DELETE CASCADE;

-- Add index for better query performance
CREATE INDEX idx_recipe_categories_parent_id ON recipe_categories(parent_id);

-- Add a check to prevent a category from being its own parent (handled in app logic, but good to document)