-- Add emoji and color fields to user_avatars if they don't exist

-- Add emoji field (default to 👤)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_avatars' AND column_name = 'emoji'
  ) THEN
    ALTER TABLE user_avatars ADD COLUMN emoji TEXT DEFAULT '👤';
  END IF;
END $$;

-- Make sure other color fields exist (they should from initial schema, but let's be safe)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_avatars' AND column_name = 'skin_color'
  ) THEN
    ALTER TABLE user_avatars ADD COLUMN skin_color TEXT DEFAULT '#FFDAB9';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_avatars' AND column_name = 'hair_color'
  ) THEN
    ALTER TABLE user_avatars ADD COLUMN hair_color TEXT DEFAULT '#2C1B18';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_avatars' AND column_name = 'background_color'
  ) THEN
    ALTER TABLE user_avatars ADD COLUMN background_color TEXT DEFAULT '#E5E7EB';
  END IF;
END $$;

-- Update existing avatars to have default emoji if null
UPDATE user_avatars 
SET emoji = '👤' 
WHERE emoji IS NULL;

-- Add comment
COMMENT ON COLUMN user_avatars.emoji IS 'User selected emoji for avatar display';
COMMENT ON COLUMN user_avatars.skin_color IS 'Skin color for avatar customization';
COMMENT ON COLUMN user_avatars.hair_color IS 'Hair color for avatar customization';
COMMENT ON COLUMN user_avatars.background_color IS 'Background color for avatar display';