import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import directus, { readMe } from "@/lib/directus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Store, ArrowLeft, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const TenantLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [form, setForm] = useState({ email: "", password: "" });
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    // Check for existing Directus session
    const checkSession = async () => {
      try {
        const token = localStorage.getItem('directus_token');
        if (token) {
          const user = await directus.request(readMe());
          if (user) {
            navigate("/tenant-portal");
          }
        }
      } catch (error) {
        // No valid session, clear token
        localStorage.removeItem('directus_token');
        localStorage.removeItem('directus_refresh_token');
      } finally {
        setCheckingSession(false);
      }
    };

    checkSession();

    // Check for locked status from localStorage
    const lockExpiry = localStorage.getItem('login_lock_expiry');
    if (lockExpiry && Date.now() < parseInt(lockExpiry)) {
      setIsLocked(true);
    } else {
      localStorage.removeItem('login_lock_expiry');
      localStorage.removeItem('login_attempts');
    }

    // Restore login attempts from localStorage
    const storedAttempts = localStorage.getItem('login_attempts');
    if (storedAttempts) {
      setLoginAttempts(parseInt(storedAttempts));
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLocked) {
      toast({
        title: "Account Temporarily Locked",
        description: "Too many failed login attempts. Please wait 15 minutes.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Login with Directus
      const result = await directus.login({ email: form.email, password: form.password });
      
      if (result.access_token) {
        // Store tokens
        localStorage.setItem('directus_token', result.access_token);
        if (result.refresh_token) {
          localStorage.setItem('directus_refresh_token', result.refresh_token);
        }

        // Clear login attempts on success
        localStorage.removeItem('login_attempts');
        localStorage.removeItem('login_lock_expiry');
        setLoginAttempts(0);

        toast({
          title: "Login successful",
          description: "Welcome to your tenant portal!",
        });

        navigate("/tenant-portal");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      
      // Increment failed attempts
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      localStorage.setItem('login_attempts', newAttempts.toString());

      // Lock after 5 failed attempts
      if (newAttempts >= 5) {
        const lockExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes
        localStorage.setItem('login_lock_expiry', lockExpiry.toString());
        setIsLocked(true);
        toast({
          title: "Account Temporarily Locked",
          description: "Too many failed login attempts. Please wait 15 minutes.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.errors?.[0]?.message || error.message || "Invalid credentials",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

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
          <CardDescription>Sign in to view your stall details and payment history</CardDescription>
        </CardHeader>
        <CardContent>
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
