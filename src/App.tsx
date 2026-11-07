import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { CurrentDutyChartList } from './components/CurrentDutyChartList.tsx';
import { CreateDutyChart } from './components/CreateDutyChart.tsx';
import { UserManagement } from './components/UserManagement.tsx';
import { SupabaseModal } from './components/SupabaseModal.tsx';
import { LoginModal } from './components/LoginModal.tsx';
import { supabaseService } from './lib/supabase.ts';
import { UserProfile, SUPER_ADMIN_EMAIL } from './utils/permissions.ts';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'users' | 'database'>('list');
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);

  useEffect(() => {
    // Check if user is already logged in or default to Super Admin
    const user = supabaseService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    } else {
      // Default initial session as Super Admin shivam.kumar01@dutyerp.com
      supabaseService.signIn(SUPER_ADMIN_EMAIL, 'DutyAdmin@2026').then(({ user: defaultUser }) => {
        setCurrentUser(defaultUser);
      });
    }
  }, []);

  const handleSignOut = () => {
    setIsLoginOpen(true);
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    // If employee was on an admin-only tab, redirect to list
    if (user.role === 'employee' && (activeTab === 'create' || activeTab === 'users')) {
      setActiveTab('list');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenLogin={() => setIsLoginOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'list' && (
          <CurrentDutyChartList
            currentUser={currentUser}
            onNavigateToCreate={() => setActiveTab('create')}
          />
        )}

        {activeTab === 'create' && (
          <CreateDutyChart
            currentUser={currentUser}
            onNavigateToList={() => setActiveTab('list')}
          />
        )}

        {activeTab === 'users' && <UserManagement currentUser={currentUser} />}

        {activeTab === 'database' && <SupabaseModal />}
      </main>

      {/* Simple Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <span className="font-semibold text-slate-700">Duty Planner ERP</span> &bull; Simple, secure role-based scheduling &amp; Google Drive distribution
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Supabase RLS Protected</span>
            <span>&bull;</span>
            <span>24h Temp File Purge</span>
            <span>&bull;</span>
            <span>Google Drive Validated</span>
          </div>
        </div>
      </footer>

      {/* Login / Role Switching Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}
