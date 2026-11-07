import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, ShieldCheck, UserCheck, User, 
  Mail, Building, Phone, CheckCircle2, AlertCircle, RefreshCw 
} from 'lucide-react';
import { UserProfile, UserRole, SUPER_ADMIN_EMAIL, isSuperAdmin } from '../utils/permissions.ts';
import { EmployeeRecord, supabaseService } from '../lib/supabase.ts';

interface UserManagementProps {
  currentUser: UserProfile | null;
}

export const UserManagement: React.FC<UserManagementProps> = ({ currentUser }) => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [isAdding, setIsAdding] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('employee');
  const [department, setDepartment] = useState('Operations');
  const [designation, setDesignation] = useState('Duty Staff');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const superAdmin = isSuperAdmin(currentUser);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [profs, emps] = await Promise.all([
        supabaseService.listProfiles(),
        supabaseService.listEmployees(),
      ]);
      setProfiles(profs);
      setEmployees(emps);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load user records.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!superAdmin) {
      alert('Access Denied: Only Super Admin can create accounts.');
      return;
    }

    if (!email.trim() || !fullName.trim()) {
      alert('Full name and email are required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await supabaseService.createUserAccount({
        email,
        fullName,
        role,
        department,
        designation,
        phone,
      });

      setSuccessMsg(`Successfully created account for ${fullName} (${role}).`);
      setIsAdding(false);
      setFullName('');
      setEmail('');
      setPhone('');
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create user account.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!superAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <ShieldCheck className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900">Super Admin Access Only</h2>
        <p className="text-slate-600 mt-2 max-w-md mx-auto text-sm">
          User management and account creation is restricted to Super Admin ({SUPER_ADMIN_EMAIL}).
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              User Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
              Super Admin Portal
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Create and manage authorized Admin and Employee accounts for Duty Planner ERP.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          {isAdding ? 'Close Form' : 'Create New User Account'}
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-sm border border-emerald-200 flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 text-red-800 text-sm border border-red-200 flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Account Creation Form (Requirement 1) */}
      {isAdding && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 sm:p-8">
          <div className="border-b border-slate-100 pb-4 mb-6">
            <h3 className="text-lg font-bold text-slate-900">Provision New User Account</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Super Admin can create Admin and Employee accounts stored in Supabase profiles &amp; employees tables.
            </p>
          </div>

          <form onSubmit={handleCreateUser} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Chandra"
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. ramesh.chandra@dutyerp.com"
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Assigned Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="employee">Employee (View and Download Duty Charts only)</option>
                  <option value="admin">Admin (Create Duty Charts &amp; Manage Links)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Employees cannot create, edit, or delete duty chart links.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Department
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Operations, Security, Facilities"
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Designation / Post
                </label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Senior Duty Officer"
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43219"
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Creating User...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Save &amp; Create Account
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Directory of Profiles & Employees */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-700" />
            <h3 className="font-bold text-slate-900 text-sm">System Users Directory ({profiles.length})</h3>
          </div>
          <button
            onClick={loadData}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-6">User / Name</th>
                  <th className="py-3 px-6">Email</th>
                  <th className="py-3 px-6">Role</th>
                  <th className="py-3 px-6">Department &amp; Designation</th>
                  <th className="py-3 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {profiles.map((p) => {
                  const emp = employees.find((e) => e.email.toLowerCase() === p.email.toLowerCase());
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-6 font-semibold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            p.role === 'super_admin' ? 'bg-purple-100 text-purple-700' :
                            p.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {p.fullName.charAt(0)}
                          </div>
                          <span>{p.fullName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-slate-600 text-xs font-mono">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{p.email}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-6">
                        {p.role === 'super_admin' && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                            <ShieldCheck className="w-3 h-3" />
                            Super Admin
                          </span>
                        )}
                        {p.role === 'admin' && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                            <UserCheck className="w-3 h-3" />
                            Admin
                          </span>
                        )}
                        {p.role === 'employee' && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            <User className="w-3 h-3" />
                            Employee
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-slate-600 text-xs">
                        {emp ? (
                          <div>
                            <span className="font-medium text-slate-800">{emp.designation}</span>
                            <span className="block text-[11px] text-slate-400">{emp.department}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Central Administration</span>
                        )}
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
                          Active
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
