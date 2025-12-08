import { supabase } from '@/integrations/supabase/client';

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'tenant' | 'guest';
}

export const authService = {
  // Get current session
  async getSession(): Promise<{ user: AuthUser | null }> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return { user: null };
    }
    
    // Check if user is admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .single();
    
    const role = roleData?.role || 'guest';
    
    return { 
      user: {
        id: session.user.id,
        email: session.user.email || '',
        role: role as 'admin' | 'tenant' | 'guest',
      }
    };
  },

  // Admin login
  async adminLogin(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (!data.user) {
        return { user: null, error: 'Login failed' };
      }

      // Check if user has admin role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .single();

      if (roleData?.role !== 'admin') {
        await supabase.auth.signOut();
        return { user: null, error: 'Not authorized as admin' };
      }

      return { 
        user: {
          id: data.user.id,
          email: data.user.email || '',
          role: 'admin',
        },
        error: null 
      };
    } catch (error: any) {
      console.error('Admin login error:', error);
      return { user: null, error: error.message || 'Login failed' };
    }
  },

  // Tenant login
  async tenantLogin(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      // Check if account is locked
      const locked = await this.checkAccountLock(email);
      if (locked) {
        await this.logLoginAttempt(email, false, 'Account locked');
        return { user: null, error: 'Account temporarily locked. Please wait 15 minutes.' };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        await this.logLoginAttempt(email, false, error.message);
        return { user: null, error: 'Invalid credentials' };
      }

      if (!data.user) {
        await this.logLoginAttempt(email, false, 'No user returned');
        return { user: null, error: 'Login failed' };
      }

      // Check if user is linked to a tenant
      const { data: tenantUser } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', data.user.id)
        .single();

      if (!tenantUser) {
        await supabase.auth.signOut();
        await this.logLoginAttempt(email, false, 'No tenant account');
        return { user: null, error: 'No tenant account found for this email.' };
      }

      await this.logLoginAttempt(email, true);

      return { 
        user: {
          id: data.user.id,
          email: data.user.email || '',
          role: 'tenant',
        },
        error: null 
      };
    } catch (error: any) {
      console.error('Tenant login error:', error);
      await this.logLoginAttempt(email, false, error.message);
      return { user: null, error: error.message || 'Login failed' };
    }
  },

  // Sign out
  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  },

  // Check if account is locked (5+ failed attempts in 15 minutes)
  async checkAccountLock(email: string): Promise<boolean> {
    try {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('login_attempts')
        .select('*')
        .eq('email', email)
        .eq('success', false)
        .gte('created_at', fifteenMinutesAgo);
      
      if (error) throw error;
      return (data?.length || 0) >= 5;
    } catch (error) {
      console.error('Error checking account lock:', error);
      return false;
    }
  },

  // Log login attempt
  async logLoginAttempt(email: string, success: boolean, failureReason?: string): Promise<void> {
    try {
      await supabase
        .from('login_attempts')
        .insert({
          email,
          success,
          failure_reason: failureReason || null,
          user_agent: navigator.userAgent,
        });
    } catch (error) {
      console.error('Error logging login attempt:', error);
    }
  },

  // Get tenant data for a user
  async getTenantForUser(userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', userId)
        .single();
      
      if (error) return null;
      return data?.tenant_id || null;
    } catch (error) {
      console.error('Error getting tenant for user:', error);
      return null;
    }
  },

  // Create tenant account
  async createTenantAccount(email: string, password: string, tenantId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Failed to create user' };
      }

      // Link user to tenant
      const { error: linkError } = await supabase
        .from('tenant_users')
        .insert({
          user_id: authData.user.id,
          tenant_id: tenantId,
        });

      if (linkError) {
        return { success: false, error: linkError.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error creating tenant account:', error);
      return { success: false, error: error.message };
    }
  },
};

export default authService;
