-- Add color field to users table for profile customization
-- This allows each user to have a color associated with their avatar/profile

ALTER TABLE public.users
ADD COLUMN color TEXT DEFAULT '#FFA07A';

-- Add comment
COMMENT ON COLUMN public.users.color IS 'User profile color in hex format (e.g., #FFA07A)';
