import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPER_ADMIN_EMAIL, UserProfile, UserRole } from '../utils/permissions.ts';

export interface DutyChartLinkRecord {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  drive_link: string;
  created_by?: string;
  created_by_email: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeRecord {
  id: string;
  profile_id?: string;
  full_name: string;
  email: string;
  department: string;
  designation: string;
  phone?: string;
  status: 'active' | 'inactive';
  created_at: string;
}

// Default Seed Profiles
const INITIAL_PROFILES: UserProfile[] = [
  {
    id: 'usr-super-admin-01',
    email: SUPER_ADMIN_EMAIL,
    fullName: 'Shivam Kumar (Super Admin)',
    role: 'super_admin',
    createdAt: '2026-10-20T08:00:00Z',
  },
  {
    id: 'usr-admin-02',
    email: 'priya.sharma@dutyerp.com',
    fullName: 'Priya Sharma (Admin)',
    role: 'admin',
    createdAt: '2026-10-21T09:30:00Z',
  },
  {
    id: 'usr-employee-03',
    email: 'arun.patel@dutyerp.com',
    fullName: 'Arun Patel (Employee)',
    role: 'employee',
    createdAt: '2026-10-22T10:00:00Z',
  },
  {
    id: 'usr-employee-04',
    email: 'neha.verma@dutyerp.com',
    fullName: 'Neha Verma (Employee)',
    role: 'employee',
    createdAt: '2026-10-23T11:15:00Z',
  },
];

// Default Sample Duty Chart Links matching prompt requirements
const INITIAL_LINKS: DutyChartLinkRecord[] = [
  {
    id: 'link-01',
    title: 'Duty Chart | 25 October – 31 October 2026',
    start_date: '2026-10-25',
    end_date: '2026-10-31',
    drive_link: 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptgms7/view?usp=sharing',
    created_by: 'usr-super-admin-01',
    created_by_email: SUPER_ADMIN_EMAIL,
    created_at: '2026-10-25T03:30:00Z',
    updated_at: '2026-10-25T03:30:00Z',
  },
  {
    id: 'link-02',
    title: 'Duty Chart | 18 October – 24 October 2026',
    start_date: '2026-10-18',
    end_date: '2026-10-24',
    drive_link: 'https://drive.google.com/file/d/1vWqQe9p8h7x6y5z4a3b2c1d0e9f8g7h6/view?usp=sharing',
    created_by: 'usr-admin-02',
    created_by_email: 'priya.sharma@dutyerp.com',
    created_at: '2026-10-18T05:00:00Z',
    updated_at: '2026-10-18T05:00:00Z',
  },
];

const INITIAL_EMPLOYEES: EmployeeRecord[] = [
  {
    id: 'emp-01',
    profile_id: 'usr-super-admin-01',
    full_name: 'Shivam Kumar',
    email: SUPER_ADMIN_EMAIL,
    department: 'Administration',
    designation: 'Head Coordinator & Super Admin',
    phone: '+91 98765 43210',
    status: 'active',
    created_at: '2026-10-20T08:00:00Z',
  },
  {
    id: 'emp-02',
    profile_id: 'usr-admin-02',
    full_name: 'Priya Sharma',
    email: 'priya.sharma@dutyerp.com',
    department: 'Operations',
    designation: 'Roster Planner & Admin',
    phone: '+91 98765 43211',
    status: 'active',
    created_at: '2026-10-21T09:30:00Z',
  },
  {
    id: 'emp-03',
    profile_id: 'usr-employee-03',
    full_name: 'Arun Patel',
    email: 'arun.patel@dutyerp.com',
    department: 'Security & Logistics',
    designation: 'Security Officer',
    phone: '+91 98765 43212',
    status: 'active',
    created_at: '2026-10-22T10:00:00Z',
  },
  {
    id: 'emp-04',
    profile_id: 'usr-employee-04',
    full_name: 'Neha Verma',
    email: 'neha.verma@dutyerp.com',
    department: 'Facilities',
    designation: 'Duty Supervisor',
    phone: '+91 98765 43213',
    status: 'active',
    created_at: '2026-10-23T11:15:00Z',
  },
];

// Local Storage Keys
const LS_SUPABASE_URL = 'duty_planner_supabase_url';
const LS_SUPABASE_ANON = 'duty_planner_supabase_anon';
const LS_CURRENT_USER = 'duty_planner_current_user';
const LS_PROFILES = 'duty_planner_profiles';
const LS_LINKS = 'duty_planner_duty_chart_links';
const LS_EMPLOYEES = 'duty_planner_employees';

class SupabaseService {
  private client: SupabaseClient | null = null;
  private url: string = '';
  private anonKey: string = '';
  private currentUser: UserProfile | null = null;
  private isConnectedToRemote: boolean = false;

  constructor() {
    this.initialize();
  }

  public initialize() {
    // Check vite env vars or localStorage
    const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
    const envAnon = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
    const storedUrl = typeof window !== 'undefined' ? localStorage.getItem(LS_SUPABASE_URL) : null;
    const storedAnon = typeof window !== 'undefined' ? localStorage.getItem(LS_SUPABASE_ANON) : null;

    this.url = storedUrl || envUrl;
    this.anonKey = storedAnon || envAnon;

    if (this.url && this.anonKey && this.url.startsWith('https://')) {
      try {
        this.client = createClient(this.url, this.anonKey);
        this.isConnectedToRemote = true;
      } catch (err) {
        console.warn('Failed to initialize Supabase client:', err);
        this.client = null;
        this.isConnectedToRemote = false;
      }
    } else {
      this.client = null;
      this.isConnectedToRemote = false;
    }

    // Restore cached user session
    if (typeof window !== 'undefined') {
      const cachedUser = localStorage.getItem(LS_CURRENT_USER);
      if (cachedUser) {
        try {
          this.currentUser = JSON.parse(cachedUser);
        } catch {
          this.currentUser = null;
        }
      }
    }
  }

  public isRemoteConnected(): boolean {
    return this.isConnectedToRemote;
  }

  public getConfig() {
    return {
      url: this.url,
      anonKey: this.anonKey,
      isConnected: this.isConnectedToRemote,
    };
  }

  public updateConfig(url: string, anonKey: string): boolean {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LS_SUPABASE_URL, url.trim());
      localStorage.setItem(LS_SUPABASE_ANON, anonKey.trim());
    }
    this.url = url.trim();
    this.anonKey = anonKey.trim();
    if (this.url && this.anonKey && this.url.startsWith('https://')) {
      try {
        this.client = createClient(this.url, this.anonKey);
        this.isConnectedToRemote = true;
        return true;
      } catch {
        this.client = null;
        this.isConnectedToRemote = false;
        return false;
      }
    } else {
      this.client = null;
      this.isConnectedToRemote = false;
      return false;
    }
  }

  public getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  public setCurrentUser(user: UserProfile | null) {
    this.currentUser = user;
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem(LS_CURRENT_USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(LS_CURRENT_USER);
      }
    }
  }

  // --- Auth operations ---
  public async signIn(email: string, password?: string): Promise<{ user: UserProfile; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();

    // 1. If connected to real Supabase, try Supabase Auth first
    if (this.client) {
      try {
        const { data, error } = await this.client.auth.signInWithPassword({
          email: cleanEmail,
          password: password || 'DutyPlanner@2026',
        });

        if (!error && data.user) {
          // Fetch profile from profiles table
          const { data: profile } = await this.client
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          const role: UserRole = cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase() 
            ? 'super_admin' 
            : (profile?.role || (data.user.user_metadata?.role as UserRole) || 'employee');

          const userObj: UserProfile = {
            id: data.user.id,
            email: cleanEmail,
            fullName: profile?.full_name || data.user.user_metadata?.full_name || cleanEmail.split('@')[0],
            role,
          };
          this.setCurrentUser(userObj);
          return { user: userObj };
        }
      } catch (err: any) {
        console.warn('Supabase remote auth failed, checking fallback:', err.message);
      }
    }

    // 2. Simulated/Local Profile check
    const profiles = this.getLocalProfiles();
    let found = profiles.find(p => p.email.toLowerCase() === cleanEmail);

    if (!found) {
      // Auto-assign Super Admin if it's the requested super admin email
      if (cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
        found = {
          id: 'usr-super-admin-01',
          email: SUPER_ADMIN_EMAIL,
          fullName: 'Shivam Kumar (Super Admin)',
          role: 'super_admin',
          createdAt: new Date().toISOString(),
        };
        profiles.push(found);
        this.saveLocalProfiles(profiles);
      } else {
        throw new Error(`No account found for "${cleanEmail}". Super Admin must create Admin and Employee accounts.`);
      }
    }

    this.setCurrentUser(found);
    return { user: found };
  }

  public async signOut() {
    if (this.client) {
      try {
        await this.client.auth.signOut();
      } catch (err) {
        console.warn('Supabase signOut error:', err);
      }
    }
    this.setCurrentUser(null);
  }

  // --- Profiles & Users Management (Super Admin only) ---
  public async listProfiles(): Promise<UserProfile[]> {
    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((p: any) => ({
            id: p.id,
            email: p.email,
            fullName: p.full_name,
            role: p.role as UserRole,
            createdAt: p.created_at,
          }));
        }
      } catch (err) {
        console.warn('Error fetching profiles from Supabase, using local:', err);
      }
    }
    return this.getLocalProfiles();
  }

  public async createUserAccount(params: {
    email: string;
    fullName: string;
    role: UserRole;
    department?: string;
    designation?: string;
    phone?: string;
  }): Promise<UserProfile> {
    const actor = this.getCurrentUser();
    if (!actor || actor.role !== 'super_admin') {
      throw new Error('Unauthorized: Only Super Admin can create Admin and Employee accounts.');
    }

    const cleanEmail = params.email.trim().toLowerCase();
    const newId = 'usr-' + Math.random().toString(36).substring(2, 10);
    const newProfile: UserProfile = {
      id: newId,
      email: cleanEmail,
      fullName: params.fullName.trim(),
      role: params.role,
      createdAt: new Date().toISOString(),
    };

    // If remote Supabase is active, call Supabase
    if (this.client) {
      try {
        // Create user in Auth / Profiles table
        const { data, error } = await this.client
          .from('profiles')
          .insert({
            id: newId,
            email: cleanEmail,
            full_name: newProfile.fullName,
            role: newProfile.role,
          })
          .select()
          .single();

        if (error) {
          console.warn('Remote profile insert failed, saving locally:', error.message);
        } else if (data) {
          newProfile.id = data.id;
        }

        // Insert employee record if provided
        if (params.department && params.designation) {
          await this.client.from('employees').insert({
            profile_id: newProfile.id,
            department: params.department,
            designation: params.designation,
            phone: params.phone,
            status: 'active',
          });
        }
      } catch (err: any) {
        console.warn('Remote error:', err.message);
      }
    }

    // Always update local cache for deterministic experience
    const profiles = this.getLocalProfiles();
    const existingIndex = profiles.findIndex(p => p.email.toLowerCase() === cleanEmail);
    if (existingIndex >= 0) {
      profiles[existingIndex] = newProfile;
    } else {
      profiles.push(newProfile);
    }
    this.saveLocalProfiles(profiles);

    // Save employee record
    if (params.department || params.designation) {
      const employees = this.getLocalEmployees();
      employees.push({
        id: 'emp-' + Math.random().toString(36).substring(2, 10),
        profile_id: newProfile.id,
        full_name: newProfile.fullName,
        email: cleanEmail,
        department: params.department || 'General',
        designation: params.designation || (params.role === 'admin' ? 'Duty Administrator' : 'Staff Member'),
        phone: params.phone || '',
        status: 'active',
        created_at: new Date().toISOString(),
      });
      this.saveLocalEmployees(employees);
    }

    return newProfile;
  }

  // --- Current Duty Chart List (Requirement 3, 4, 5) ---
  public async listDutyChartLinks(): Promise<DutyChartLinkRecord[]> {
    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('duty_chart_links')
          .select('*')
          .order('start_date', { ascending: false });

        if (!error && data && data.length > 0) {
          return data;
        }
      } catch (err) {
        console.warn('Error reading duty_chart_links from Supabase:', err);
      }
    }
    return this.getLocalLinks();
  }

  public async addDutyChartLink(payload: {
    title: string;
    startDate: string;
    endDate: string;
    driveLink: string;
  }): Promise<DutyChartLinkRecord> {
    const actor = this.getCurrentUser();
    if (!actor || (actor.role !== 'super_admin' && actor.role !== 'admin')) {
      throw new Error('Unauthorized: Employees cannot create or add duty chart links. Only Super Admin and Admin can add links.');
    }

    const newRecord: DutyChartLinkRecord = {
      id: 'link-' + Math.random().toString(36).substring(2, 10),
      title: payload.title.trim(),
      start_date: payload.startDate,
      end_date: payload.endDate,
      drive_link: payload.driveLink.trim(),
      created_by: actor.id,
      created_by_email: actor.email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('duty_chart_links')
          .insert({
            title: newRecord.title,
            start_date: newRecord.start_date,
            end_date: newRecord.end_date,
            drive_link: newRecord.drive_link,
            created_by: actor.id,
            created_by_email: actor.email,
          })
          .select()
          .single();

        if (error) {
          console.warn('Remote link insert failed, saving locally:', error.message);
        } else if (data) {
          newRecord.id = data.id;
        }
      } catch (err: any) {
        console.warn('Remote link insert error:', err.message);
      }
    }

    const links = this.getLocalLinks();
    links.unshift(newRecord);
    this.saveLocalLinks(links);
    return newRecord;
  }

  public async updateDutyChartLink(id: string, payload: {
    title: string;
    startDate: string;
    endDate: string;
    driveLink: string;
  }): Promise<DutyChartLinkRecord> {
    const actor = this.getCurrentUser();
    if (!actor || (actor.role !== 'super_admin' && actor.role !== 'admin')) {
      throw new Error('Unauthorized: Employees cannot edit duty chart links. Only Super Admin and Admin can update links.');
    }

    if (this.client) {
      try {
        await this.client
          .from('duty_chart_links')
          .update({
            title: payload.title.trim(),
            start_date: payload.startDate,
            end_date: payload.endDate,
            drive_link: payload.driveLink.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);
      } catch (err: any) {
        console.warn('Remote update failed:', err.message);
      }
    }

    const links = this.getLocalLinks();
    const index = links.findIndex(l => l.id === id);
    if (index === -1) throw new Error('Duty chart link not found.');

    links[index] = {
      ...links[index],
      title: payload.title.trim(),
      start_date: payload.startDate,
      end_date: payload.endDate,
      drive_link: payload.driveLink.trim(),
      updated_at: new Date().toISOString(),
    };
    this.saveLocalLinks(links);
    return links[index];
  }

  public async deleteDutyChartLink(id: string): Promise<void> {
    const actor = this.getCurrentUser();
    if (!actor || (actor.role !== 'super_admin' && actor.role !== 'admin')) {
      throw new Error('Unauthorized: Employees cannot delete duty chart links. Only Super Admin and Admin can delete links.');
    }

    if (this.client) {
      try {
        await this.client
          .from('duty_chart_links')
          .delete()
          .eq('id', id);
      } catch (err: any) {
        console.warn('Remote delete failed:', err.message);
      }
    }

    const links = this.getLocalLinks().filter(l => l.id !== id);
    this.saveLocalLinks(links);
  }

  public async listEmployees(): Promise<EmployeeRecord[]> {
    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('employees')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data;
        }
      } catch (err) {
        console.warn('Error reading employees from Supabase:', err);
      }
    }
    return this.getLocalEmployees();
  }

  // --- Local helpers ---
  private getLocalProfiles(): UserProfile[] {
    if (typeof window === 'undefined') return INITIAL_PROFILES;
    const raw = localStorage.getItem(LS_PROFILES);
    if (!raw) {
      localStorage.setItem(LS_PROFILES, JSON.stringify(INITIAL_PROFILES));
      return INITIAL_PROFILES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_PROFILES;
    }
  }

  private saveLocalProfiles(profiles: UserProfile[]) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LS_PROFILES, JSON.stringify(profiles));
    }
  }

  private getLocalLinks(): DutyChartLinkRecord[] {
    if (typeof window === 'undefined') return INITIAL_LINKS;
    const raw = localStorage.getItem(LS_LINKS);
    if (!raw) {
      localStorage.setItem(LS_LINKS, JSON.stringify(INITIAL_LINKS));
      return INITIAL_LINKS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_LINKS;
    }
  }

  private saveLocalLinks(links: DutyChartLinkRecord[]) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LS_LINKS, JSON.stringify(links));
    }
  }

  private getLocalEmployees(): EmployeeRecord[] {
    if (typeof window === 'undefined') return INITIAL_EMPLOYEES;
    const raw = localStorage.getItem(LS_EMPLOYEES);
    if (!raw) {
      localStorage.setItem(LS_EMPLOYEES, JSON.stringify(INITIAL_EMPLOYEES));
      return INITIAL_EMPLOYEES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_EMPLOYEES;
    }
  }

  private saveLocalEmployees(emps: EmployeeRecord[]) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LS_EMPLOYEES, JSON.stringify(emps));
    }
  }
}

export const supabaseService = new SupabaseService();
