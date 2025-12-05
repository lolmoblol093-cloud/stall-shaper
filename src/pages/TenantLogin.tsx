import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Store, ArrowLeft, Mail, KeyRound } from "lucide-react";
import { Session } from "@supabase/supabase-js";

type Mode = "login" | "signup" | "forgot" | "reset";

const TenantLogin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("login");
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "" });

  useEffect(() => {
    // Handle password recovery from URL hash (Supabase redirects with tokens in hash)
    const handleRecovery = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const type = hashParams.get("type");

      if (type === "recovery" && accessToken && refreshToken) {
        // Set the session from the tokens
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          toast({
            title: "Error",
            description: "Invalid or expired reset link. Please request a new one.",
            variant: "destructive",
          });
          setMode("forgot");
        } else {
          setMode("reset");
          // Clear the hash from URL
          window.history.replaceState(null, "", window.location.pathname);
        }
      } else if (searchParams.get("type") === "recovery") {
        setMode("reset");
      }
    };

    handleRecovery();
  }, [searchParams, toast]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session && mode !== "reset") {
        checkTenantAndRedirect(session.user.id, session.user.email);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === "PASSWORD_RECOVERY") {
        setMode("reset");
      } else if (event === 'SIGNED_IN' && session && mode !== "reset") {
        checkTenantAndRedirect(session.user.id, session.user.email);
      }
    });

    return () => subscription.unsubscribe();
  }, [mode]);

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
      setMode("login");
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
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (form.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
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
        description: "Your password has been reset successfully.",
      });
      
      setForm({ email: "", password: "", confirmPassword: "" });
      setMode("login");
      navigate("/tenant-login");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
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
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });

        if (error) throw error;
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

  const getDescription = () => {
    switch (mode) {
      case "signup":
        return "Create your tenant account to access your stall information";
      case "forgot":
        return "Enter your email to receive a password reset link";
      case "reset":
        return "Enter your new password";
      default:
        return "Sign in to view your stall details and payment history";
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "forgot":
        return "Reset Password";
      case "reset":
        return "Set New Password";
      default:
        return "Tenant Portal";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              {mode === "forgot" || mode === "reset" ? (
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
          {mode === "forgot" ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setMode("login")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Sign In
              </Button>
            </form>
          ) : mode === "reset" ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
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
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                  <p className="text-xs text-muted-foreground">
                    Use the email registered with your tenant account
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {mode === "login" && (
                      <Button
                        type="button"
                        variant="link"
                        className="px-0 h-auto text-xs"
                        onClick={() => setMode("forgot")}
                      >
                        Forgot password?
                      </Button>
                    )}
                  </div>
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
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Please wait..." : mode === "signup" ? "Create Account" : "Sign In"}
                </Button>
              </form>

              <div className="mt-4 text-center space-y-2">
                <Button
                  variant="link"
                  onClick={() => setMode(mode === "signup" ? "login" : "signup")}
                  className="text-sm"
                >
                  {mode === "signup" ? "Already have an account? Sign In" : "New tenant? Create Account"}
                </Button>
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/")}
                    className="text-muted-foreground"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to Marketplace
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantLogin;
