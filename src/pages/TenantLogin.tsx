import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Building2, Store, ArrowLeft } from "lucide-react";
import { Session } from "@supabase/supabase-js";

const TenantLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkTenantAndRedirect(session.user.id, session.user.email);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'SIGNED_IN' && session) {
        checkTenantAndRedirect(session.user.id, session.user.email);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkTenantAndRedirect = async (userId: string, email: string | undefined) => {
    if (!email) return;

    try {
      // Check if user is linked to a tenant
      const { data: tenantUser } = await supabase
        .from("tenant_users")
        .select("tenant_id")
        .eq("user_id", userId)
        .single();

      if (tenantUser) {
        navigate("/tenant-portal");
        return;
      }

      // Check if there's a tenant with this email
      const { data: tenant } = await supabase
        .from("tenants")
        .select("id")
        .eq("email", email)
        .single();

      if (tenant) {
        // Link the user to the tenant
        await supabase.from("tenant_users").insert({
          user_id: userId,
          tenant_id: tenant.id
        });

        // Add tenant role
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // First check if a tenant exists with this email
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Store className="h-10 w-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Tenant Portal</CardTitle>
          <CardDescription>
            {isSignUp 
              ? "Create your tenant account to access your stall information"
              : "Sign in to view your stall details and payment history"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
            </Button>
          </form>

          <div className="mt-4 text-center space-y-2">
            <Button
              variant="link"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm"
            >
              {isSignUp ? "Already have an account? Sign In" : "New tenant? Create Account"}
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
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantLogin;