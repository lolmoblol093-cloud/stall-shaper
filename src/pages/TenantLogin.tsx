import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Store, ArrowLeft } from "lucide-react";
import { mockTenants } from "@/data/mockData";

const TenantLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, user, isTenant } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  useEffect(() => {
    if (user && isTenant) {
      navigate("/tenant-portal");
    }
  }, [user, isTenant, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if tenant exists
      const tenant = mockTenants.find(t => t.email === form.email);
      if (!tenant) {
        toast({
          title: "Access Denied",
          description: "No tenant account found for this email. Please contact the property manager.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = await signIn(form.email, form.password);

      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      toast({
        title: "Login successful",
        description: "Welcome to your tenant portal!",
      });
      navigate("/tenant-portal");
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
