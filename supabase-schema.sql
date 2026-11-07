-- Duty Planner ERP: Supabase Schema & Row Level Security (RLS)
-- Run this script in your Supabase Project SQL Editor

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'employee')) DEFAULT 'employee',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Employees Table
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  employee_code TEXT UNIQUE,
  department TEXT NOT NULL,
  designation TEXT NOT NULL,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Duty Chart Links Table
CREATE TABLE IF NOT EXISTS public.duty_chart_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  drive_link TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Helper Function to Check User Role
CREATE OR REPLACE FUNCTION public.get_auth_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = user_id;
  RETURN COALESCE(user_role, 'employee');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger to automatically create profile on auth signup and assign Super Admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_role TEXT := 'employee';
BEGIN
  IF NEW.email = 'shivam.kumar01@dutyerp.com' THEN
    default_role := 'super_admin';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    default_role
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duty_chart_links ENABLE ROW LEVEL SECURITY;

-- 8. Profiles Policies
-- All authenticated users can view profiles
CREATE POLICY "Allow authenticated read profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Only Super Admin can insert/update/delete profiles
CREATE POLICY "Allow super_admin to manage profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (
    public.get_auth_role(auth.uid()) = 'super_admin'
    OR auth.jwt() ->> 'email' = 'shivam.kumar01@dutyerp.com'
  );

-- 9. Employees Policies
-- All authenticated users can view employees
CREATE POLICY "Allow authenticated read employees"
  ON public.employees FOR SELECT
  TO authenticated
  USING (true);

-- Super Admin and Admin can manage employee records
CREATE POLICY "Allow admin/super_admin to manage employees"
  ON public.employees FOR ALL
  TO authenticated
  USING (
    public.get_auth_role(auth.uid()) IN ('super_admin', 'admin')
    OR auth.jwt() ->> 'email' = 'shivam.kumar01@dutyerp.com'
  );

-- 10. Duty Chart Links Policies (Requirement 4 & 7)
-- Employees and all authenticated users can VIEW
CREATE POLICY "Allow all authenticated users to read duty_chart_links"
  ON public.duty_chart_links FOR SELECT
  TO authenticated
  USING (true);

-- ONLY Super Admin and authorized Admin users can INSERT links
CREATE POLICY "Allow admin/super_admin to insert duty_chart_links"
  ON public.duty_chart_links FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_auth_role(auth.uid()) IN ('super_admin', 'admin')
    OR auth.jwt() ->> 'email' = 'shivam.kumar01@dutyerp.com'
  );

-- ONLY Super Admin and authorized Admin users can UPDATE links
CREATE POLICY "Allow admin/super_admin to update duty_chart_links"
  ON public.duty_chart_links FOR UPDATE
  TO authenticated
  USING (
    public.get_auth_role(auth.uid()) IN ('super_admin', 'admin')
    OR auth.jwt() ->> 'email' = 'shivam.kumar01@dutyerp.com'
  );

-- ONLY Super Admin and authorized Admin users can DELETE links
CREATE POLICY "Allow admin/super_admin to delete duty_chart_links"
  ON public.duty_chart_links FOR DELETE
  TO authenticated
  USING (
    public.get_auth_role(auth.uid()) IN ('super_admin', 'admin')
    OR auth.jwt() ->> 'email' = 'shivam.kumar01@dutyerp.com'
  );
