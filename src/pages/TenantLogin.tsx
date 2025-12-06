import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Store, ArrowLeft, Mail, KeyRound, ShieldAlert } from "lucide-react";
import { Session } from "@supabase/supabase-js";
import { Alert, AlertDescription } from "@/components/ui/alert";

type ViewMode = "login" | "signup" | "forgot" | "reset";

const TenantLogin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("login");
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "" });
  const [isLocked, setIsLocked] = useState(false);
  const [lockCheckDone, setLockCheckDone] = useState(false);

  useEffect(() => {
    // Check if this is a password reset callback
    const type = searchParams.get("type");
    if (type === "recovery") {
      setViewMode("reset");
    }
  }, [searchParams]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session && viewMode !== "reset") {
        checkTenantAndRedirect(session.user.id, session.user.email);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'SIGNED_IN' && session && viewMode !== "reset") {
        checkTenantAndRedirect(session.user.id, session.user.email);
      }
      if (event === 'PASSWORD_RECOVERY') {
        setViewMode("reset");
      }
    });

    return () => subscription.unsubscribe();
  }, [viewMode]);

  const checkTenantAndRedirect = async (userId: string, email: string | undefined) => {
    if (!email) return;

    try {
      const { data: tenantUser } = await supabase
        .from("tenant_users")
        .select("tenant_id")
        .eq("user_id", userId)
        .single();

      if (tenantUser) {
        navigate("/tenant-portal");
        return;
      }

      const { data: tenant } = await supabase
        .from("tenants")
        .select("id")
        .eq("email", email)
        .single();

      if (tenant) {
        await supabase.from("tenant_users").insert({
          user_id: userId,
          tenant_id: tenant.id
        });

        await supabase.from("user_roles").insert({
          user_id: userId,
          role: "tenant"
        });

        navigate("/tenant-portal");
      } else {
        toast({
          title: "Access Denied",
          description: "No tenant account found for this email. Please contact the property manager.",
          variant: "destructive",
        });
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.error("Error checking tenant:", error);
    }
  };

  const checkAccountLock = async (email: string) => {
    try {
      const { data, error } = await supabase.rpc('is_account_locked', { check_email: email });
      if (error) {
        console.error('Error checking account lock:', error);
        return false;
      }
      return data === true;
    } catch (error) {
      console.error('Error checking account lock:', error);
      return false;
    }
  };

  const logLoginAttempt = async (email: string, success: boolean, failureReason?: string) => {
    try {
      await supabase.from('login_attempts').insert({
        email,
        user_agent: navigator.userAgent,
        success,
        failure_reason: failureReason || null,
      });
    } catch (error) {
      console.error('Error logging login attempt:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (viewMode === "login") {
        // Check if account is locked before attempting login
        const locked = await checkAccountLock(form.email);
        if (locked) {
          setIsLocked(true);
          await logLoginAttempt(form.email, false, 'Account locked - too many failed attempts');
          toast({
            title: "Account Temporarily Locked",
            description: "Too many failed login attempts. Please wait 15 minutes before trying again.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        setIsLocked(false);

        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });

        if (error) {
          await logLoginAttempt(form.email, false, error.message);
          throw error;
        }

        // Log successful login
        await logLoginAttempt(form.email, true);
      } else if (viewMode === "signup") {
        const { data: tenant } = await supabase
          .from("tenants")
          .select("id")
          .eq("email", form.email)
          .single();

        if (!tenant) {
          toast({
            title: "Registration Failed",
            description: "No tenant record found for this email. Please contact the property manager.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            emailRedirectTo: `${window.location.origin}/tenant-portal`
          }
        });

        if (error) throw error;

        toast({
          title: "Account Created",
          description: "Please check your email to verify your account, or sign in if auto-confirm is enabled.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
        redirectTo: `${window.location.origin}/tenant-login?type=recovery`,
      });

      if (error) throw error;

      toast({
        title: "Reset Email Sent",
        description: "Check your email for a password reset link.",
      });
      setViewMode("login");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (form.password !== form.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (form.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: form.password,
      });

      if (error) throw error;

      toast({
        title: "Password Updated",
        description: "Your password has been successfully reset.",
      });
      
      setForm({ email: "", password: "", confirmPassword: "" });
      setViewMode("login");
      
      // Sign out so they can sign in with new password
      await supabase.auth.signOut();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (viewMode) {
      case "signup": return "Create Account";
      case "forgot": return "Reset Password";
      case "reset": return "Set New Password";
      default: return "Tenant Portal";
    }
  };

  const getDescription = () => {
    switch (viewMode) {
      case "signup": return "Create your tenant account to access your stall information";
      case "forgot": return "Enter your email to receive a password reset link";
      case "reset": return "Enter your new password below";
      default: return "Sign in to view your stall details and payment history";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              {viewMode === "forgot" || viewMode === "reset" ? (
                <KeyRound className="h-10 w-10 text-primary" />
              ) : (
                <Store className="h-10 w-10 text-primary" />
              )}
            </div>
          </div>
          <CardTitle className="text-2xl">{getTitle()}</CardTitle>
          <CardDescription>{getDescription()}</CardDescription>
        </CardHeader>
        <CardContent>
          {viewMode === "forgot" ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                <Mail className="h-4 w-4 mr-2" />
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setViewMode("login")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Sign In
              </Button>
            </form>
          ) : viewMode === "reset" ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {isLocked && (
                <Alert variant="destructive">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertDescription>
                    Account temporarily locked due to too many failed attempts. Please wait 15 minutes.
                  </AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={(e) => {
                    setForm({ ...form, email: e.target.value });
                    setIsLocked(false); // Reset lock status when email changes
                  }}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Use the email registered with your tenant account
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading || isLocked}>
                {loading ? "Please wait..." : "Sign In"}
              </Button>
            </form>
          )}

          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="text-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Marketplace
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              Contact your admin if you need to reset your password
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantLogin;