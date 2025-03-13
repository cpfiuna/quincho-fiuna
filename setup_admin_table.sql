
-- Create proper admins table with auth integration and RLS
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable Row Level Security for admins table
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Create policy that allows admins to access admin data
CREATE POLICY "Admins can access admin data" 
  ON public.admins 
  FOR ALL 
  USING (auth.uid() = user_id);

-- Create a function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admins
    WHERE user_id = $1
  );
$$;

-- Create a function to handle database-level authentication (fallback)
CREATE OR REPLACE FUNCTION public.authenticate_admin(admin_email TEXT, admin_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.admins
    WHERE email = admin_email
  );
END;
$$;

-- Insert test admin account (for development only)
INSERT INTO public.admins (email)
VALUES ('test@email.com')
ON CONFLICT (email) DO NOTHING;

-- In production, you would use this instead:
-- First create the user through auth.users using Supabase Auth API
-- Then link the user to the admins table:
-- INSERT INTO public.admins (user_id, email)
-- VALUES ('[auth.users.id from the created user]', 'admin@fiuna.edu.py')
-- ON CONFLICT (email) DO NOTHING;

-- Create a trigger function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add trigger to the admins table
DROP TRIGGER IF EXISTS update_admins_timestamp ON public.admins;
CREATE TRIGGER update_admins_timestamp
BEFORE UPDATE ON public.admins
FOR EACH ROW
EXECUTE FUNCTION public.update_timestamp();

-- Add comment to the table for documentation
COMMENT ON TABLE public.admins IS 'Admin accounts for the Quincho FIUNA reservation system';
