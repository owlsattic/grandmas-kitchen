-- Update user_recipes table to support multiple images
ALTER TABLE user_recipes 
  DROP COLUMN IF EXISTS image,
  ADD COLUMN images TEXT[] DEFAULT '{}';

-- Update existing recipes with single images to array format
-- This will be empty for new installs but safe to run
UPDATE user_recipes 
SET images = ARRAY[]::TEXT[]
WHERE images IS NULL;