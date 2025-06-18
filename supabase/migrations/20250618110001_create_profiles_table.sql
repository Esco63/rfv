-- supabase/migrations/20250618110001_create_profiles_table.sql (Passenden Zeitstempel wählen!)
CREATE TABLE public.profiles (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
    username text UNIQUE,
    is_admin boolean DEFAULT false NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to create their own profile on sign up
CREATE POLICY "Users can create their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow authenticated users to view all profiles (e.g. for displaying usernames)
CREATE POLICY "Allow all authenticated users to view profiles" ON public.profiles
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id AND is_admin = true);
END;
$$;

-- RLS Policy for Admins: Allows admins to see/update/delete all proposals
CREATE POLICY "Admins can manage all proposals" ON public.proposals
FOR ALL USING (is_admin(auth.uid()));

-- Optional: Admins können auch andere Profile bearbeiten (z.B. um is_admin zu setzen)
CREATE POLICY "Admins can update any profile" ON public.profiles
FOR UPDATE USING (is_admin(auth.uid()));