-- supabase/migrations/[TIMESTAMP]_create_profile_creation_trigger.sql
-- (Passenden Zeitstempel wählen, z.B. 20250618125500_create_profile_creation_trigger.sql)

-- 1. Funktion erstellen, die ein Profil für jeden neuen Benutzer erstellt
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, is_admin)
  VALUES (NEW.id, NEW.email, FALSE); -- Standard-Username ist die E-Mail, wird im Frontend geändert
  RETURN NEW;
END;
$$;

-- 2. Trigger erstellen, der die Funktion aufruft, wenn ein neuer Benutzer in auth.users eingefügt wird
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users; -- Optional, falls Trigger schon existiert

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();