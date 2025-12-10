import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import directus, { readMe } from "@/lib/directus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Building2, User } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [adminForm, setAdminForm] = useState({ email: "", password: "" });

  useEffect(() => {
    // Check for existing Directus session
    const checkSession = async () => {
      try {
        const token = localStorage.getItem('directus_token');
        if (token) {
          const user = await directus.request(readMe());
          if (user) {
            navigate("/dashboard");
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
  }, [navigate]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Login with Directus
      const result = await directus.login({ email: adminForm.email, password: adminForm.password });
      
      if (result.access_token) {
        // Store tokens
        localStorage.setItem('directus_token', result.access_token);
        if (result.refresh_token) {
          localStorage.setItem('directus_refresh_token', result.refresh_token);
        }

        // Get user info to verify admin role
        const user = await directus.request(readMe());
        
        // Check if user has admin role (you may need to adjust this based on your Directus role structure)
        // For now, we'll allow any authenticated user through, you can add role checks if needed
        
        toast({
          title: "Login successful",
          description: "Welcome back, Admin!",
        });

        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Error",
        description: error.errors?.[0]?.message || error.message || "Invalid credentials",
        variant: "destructive",
      });
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Building2 className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <CardDescription>
            Sign in to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@example.com"
                value={adminForm.email}
                onChange={(e) =>
                  setAdminForm({ ...adminForm, email: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="••••••••"
                value={adminForm.password}
                onChange={(e) =>
                  setAdminForm({ ...adminForm, password: e.target.value })
                }
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              <User className="h-4 w-4 mr-2" />
              {loading ? "Please wait..." : "Sign In as Admin"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => navigate("/guest")}
              className="text-sm"
            >
              View as Guest
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
