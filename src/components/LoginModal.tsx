import React, { useState } from 'react';
import { LogIn, ShieldCheck, UserCheck, User, X, AlertCircle } from 'lucide-react';
import { supabaseService } from '../lib/supabase.ts';
import { SUPER_ADMIN_EMAIL, UserProfile } from '../utils/permissions.ts';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [email, setEmail] = useState(SUPER_ADMIN_EMAIL);
  const [password, setPassword] = useState('DutyAdmin@2026');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const { user } = await supabaseService.signIn(email, password);
      onSuccess(user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = async (roleEmail: string) => {
    setEmail(roleEmail);
    setLoading(true);
    setErrorMsg(null);
    try {
      const { user } = await supabaseService.signIn(roleEmail, 'DutyPlanner@2026');
      onSuccess(user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center mx-auto mb-3 shadow-xs">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Sign In to Duty Planner ERP</h2>
          <p className="text-xs text-slate-500 mt-1">
            Access duty schedules, roster links, and administration controls.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-800 text-xs border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Quick Switch Profiles for testing user roles */}
        <div className="mb-6">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
            Switch Role / Quick Sign In
          </div>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => handleQuickSelect(SUPER_ADMIN_EMAIL)}
              className="w-full text-left p-2.5 rounded-xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100/70 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-purple-950">Super Admin</div>
                  <div className="text-[11px] text-purple-700">{SUPER_ADMIN_EMAIL}</div>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-purple-600 bg-purple-200/60 px-2 py-0.5 rounded">
                Full ERP Control
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickSelect('priya.sharma@dutyerp.com')}
              className="w-full text-left p-2.5 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-700 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-blue-950">Duty Admin</div>
                  <div className="text-[11px] text-blue-700">priya.sharma@dutyerp.com</div>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-blue-600 bg-blue-200/60 px-2 py-0.5 rounded">
                Create &amp; Manage Links
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickSelect('arun.patel@dutyerp.com')}
              className="w-full text-left p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-700 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-900">Employee</div>
                  <div className="text-[11px] text-slate-600">arun.patel@dutyerp.com</div>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-slate-600 bg-slate-200 px-2 py-0.5 rounded">
                View &amp; Download Only
              </span>
            </button>
          </div>
        </div>

        <div className="relative flex py-2 items-center mb-4">
          <div className="grow border-t border-slate-200"></div>
          <span className="shrink mx-3 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">Or Custom Login</span>
          <div className="grow border-t border-slate-200"></div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-xs transition-colors disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};
