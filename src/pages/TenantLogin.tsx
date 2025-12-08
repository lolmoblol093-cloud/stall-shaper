import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/authService";
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
  const [form, setForm] = useState({ email: "", password: "" });
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      const { user } = await authService.getSession();
      if (user && user.role === 'tenant') {
        navigate("/tenant-portal");
      }
    };
    checkSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { user, error } = await authService.tenantLogin(
        form.email,
        form.password
      );

      if (error) {
        if (error.includes('locked')) {
          setIsLocked(true);
        }
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (user) {
        toast({
          title: "Login successful",
          description: "Welcome to your tenant portal!",
        });
        navigate("/tenant-portal");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Login failed",
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
                  setIsLocked(false);
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
