import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Building2, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [adminForm, setAdminForm] = useState({ email: "", password: "" });

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const success = await login(adminForm.email, adminForm.password, 'admin');
      
      if (success) {
        toast({
          title: "Login successful",
          description: "Welcome back, Admin!",
        });
        navigate("/dashboard");
      } else {
        toast({
          title: "Error",
          description: "Invalid email or password. Try admin@example.com / admin123",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
          <p className="text-xs text-muted-foreground mt-2">
            Demo: admin@example.com / admin123
          </p>
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
