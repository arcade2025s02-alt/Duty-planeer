import React, { useState } from 'react';
import { Database, ShieldCheck, Copy, Check, ExternalLink, Key, RefreshCw, AlertTriangle } from 'lucide-react';
import { supabaseService } from '../lib/supabase.ts';

const SQL_SCHEMA_TEXT = `-- Duty Planner ERP: Supabase Schema & Row Level Security (RLS)
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
CREATE POLICY "Allow authenticated read profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow super_admin to manage profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (
    public.get_auth_role(auth.uid()) = 'super_admin'
    OR auth.jwt() ->> 'email' = 'shivam.kumar01@dutyerp.com'
  );

-- 9. Employees Policies
CREATE POLICY "Allow authenticated read employees"
  ON public.employees FOR SELECT
  TO authenticated
  USING (true);

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
  );`;

export const SupabaseModal: React.FC = () => {
  const currentConfig = supabaseService.getConfig();
  const [url, setUrl] = useState(currentConfig.url || '');
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey || '');
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SCHEMA_TEXT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setStatusMsg(null);

    const success = supabaseService.updateConfig(url, anonKey);
    setTimeout(() => {
      setTesting(false);
      if (success) {
        setStatusMsg('Supabase client initialized successfully!');
      } else {
        setStatusMsg('Settings saved. (If URL or Key is empty or invalid, fallback storage is active).');
      }
    }, 400);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Supabase Database &amp; RLS Setup
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Requirement 7
          </span>
        </div>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Connect your existing Supabase project. The application utilizes strictly the required tables:
          <code className="mx-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-xs">profiles</code>,
          <code className="mx-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-xs">employees</code>, and
          <code className="mx-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-xs">duty_chart_links</code>
          protected by Row Level Security (RLS).
        </p>
      </div>

      {/* Security Banner: Secret Keys Requirement */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="block text-amber-950 font-bold">RLS &amp; Secret Key Safeguard:</strong>
          <p>
            Do not expose Supabase secret (service_role) keys in frontend code. Use only the public Anon Key. 
            All permission boundaries (Employees reading links, Admin &amp; Super Admin managing links) are enforced in PostgreSQL Row Level Security.
          </p>
        </div>
      </div>

      {/* Grid: Credentials & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Configuration Form */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-600" />
              Project Connection
            </h3>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              supabaseService.isRemoteConnected()
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-blue-100 text-blue-800 border border-blue-200'
            }`}>
              {supabaseService.isRemoteConnected() ? 'Connected Remote' : 'Active Local Simulation'}
            </span>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Supabase Project URL
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-project.supabase.co"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Supabase Anon Key
              </label>
              <input
                type="password"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Only use your public Anon key. Never paste the service_role secret key here.
              </p>
            </div>

            {statusMsg && (
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs border border-emerald-200">
                {statusMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={testing}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {testing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                'Save & Test Supabase Config'
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-1">
            <p><strong>Note:</strong> You can also set these in your deployment environment as:</p>
            <div className="font-mono text-[11px] bg-slate-100 p-2 rounded text-slate-700">
              VITE_SUPABASE_URL=&quot;...&quot;<br />
              VITE_SUPABASE_ANON_KEY=&quot;...&quot;
            </div>
          </div>
        </div>

        {/* Right: SQL Schema & 1-Click Copy */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-xs border border-slate-200 p-6 space-y-4 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                Database Schema &amp; RLS Policies (PostgreSQL)
              </h3>
              <p className="text-xs text-slate-500">
                Paste directly into the Supabase Dashboard &gt; SQL Editor and click &quot;Run&quot;.
              </p>
            </div>

            <button
              onClick={handleCopySql}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors self-start sm:self-auto shrink-0 shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy SQL Script</span>
                </>
              )}
            </button>
          </div>

          <div className="flex-1 bg-slate-900 rounded-xl p-4 overflow-x-auto text-[11px] font-mono text-slate-200 max-h-[420px] overflow-y-auto leading-relaxed border border-slate-800">
            <pre>{SQL_SCHEMA_TEXT}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
