import React from 'react';
import { Calendar, Users, FileSpreadsheet, Database, LogOut, ShieldCheck, UserCheck, User } from 'lucide-react';
import { UserProfile, isSuperAdmin } from '../utils/permissions.ts';

interface NavbarProps {
  currentUser: UserProfile | null;
  activeTab: 'list' | 'create' | 'users' | 'database';
  setActiveTab: (tab: 'list' | 'create' | 'users' | 'database') => void;
  onOpenLogin: () => void;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onOpenLogin,
  onSignOut,
}) => {
  const superAdmin = isSuperAdmin(currentUser);
  const isAdminOrSuper = currentUser?.role === 'admin' || superAdmin;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & App Title */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm sm:text-lg text-slate-900 tracking-tight whitespace-nowrap">Duty Planner ERP</span>
                <span className="hidden sm:inline-block text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  ERP
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Role-based duty roster planning & Google Drive distribution</p>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'list'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Current Duty Chart List</span>
            </button>

            {isAdminOrSuper && (
              <button
                onClick={() => setActiveTab('create')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'create'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Create Duty Chart</span>
              </button>
            )}

            {superAdmin && (
              <button
                onClick={() => setActiveTab('users')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'users'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>User Management</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('database')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'database'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Database className="w-4 h-4" />
              <span className="hidden lg:inline">Supabase & RLS</span>
            </button>
          </nav>

          {/* User profile / session */}
          <div className="flex items-center gap-2">
            {currentUser ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-slate-900">{currentUser.fullName}</div>
                  <div className="text-[11px] text-slate-500">{currentUser.email}</div>
                </div>

                {/* Role Badge */}
                <div className="flex items-center">
                  {currentUser.role === 'super_admin' && (
                    <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                      <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span className="hidden sm:inline">Super Admin</span>
                      <span className="sm:hidden">Super</span>
                    </span>
                  )}
                  {currentUser.role === 'admin' && (
                    <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                      <UserCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      Admin
                    </span>
                  )}
                  {currentUser.role === 'employee' && (
                    <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      <User className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span className="hidden sm:inline">Employee</span>
                      <span className="sm:hidden">Staff</span>
                    </span>
                  )}
                </div>

                <button
                  onClick={onSignOut}
                  title="Sign Out or Switch Role"
                  className="p-1.5 sm:p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-xs"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-100 text-xs">
          <button
            onClick={() => setActiveTab('list')}
            className={`py-1 px-2 rounded font-medium flex flex-col items-center gap-1 ${
              activeTab === 'list' ? 'text-blue-600 font-semibold' : 'text-slate-600'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Duty Charts</span>
          </button>
          {isAdminOrSuper && (
            <button
              onClick={() => setActiveTab('create')}
              className={`py-1 px-2 rounded font-medium flex flex-col items-center gap-1 ${
                activeTab === 'create' ? 'text-blue-600 font-semibold' : 'text-slate-600'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Create Chart</span>
            </button>
          )}
          {superAdmin && (
            <button
              onClick={() => setActiveTab('users')}
              className={`py-1 px-2 rounded font-medium flex flex-col items-center gap-1 ${
                activeTab === 'users' ? 'text-blue-600 font-semibold' : 'text-slate-600'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Users</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab('database')}
            className={`py-1 px-2 rounded font-medium flex flex-col items-center gap-1 ${
              activeTab === 'database' ? 'text-blue-600 font-semibold' : 'text-slate-600'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Supabase</span>
          </button>
        </div>
      </div>
    </header>
  );
};
