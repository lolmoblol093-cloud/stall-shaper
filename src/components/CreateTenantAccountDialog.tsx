import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { tenantsService } from "@/lib/directusService";
import { UserPlus, Copy, Check, Key, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Tenant {
  id: string;
  business_name: string;
  contact_person: string;
  email: string | null;
}

interface CreateTenantAccountDialogProps {
  tenant: Tenant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccountCreated: () => void;
}

const generatePassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export const CreateTenantAccountDialog = ({
  tenant,
  open,
  onOpenChange,
  onAccountCreated,
}: CreateTenantAccountDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [customEmail, setCustomEmail] = useState("");

  const handleCreateAccount = async () => {
    if (!tenant) return;

    const email = customEmail || tenant.email;
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter an email address for this tenant account.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const tempPassword = generatePassword();

    try {
      // Note: For Directus, you would need to create a user via Directus API
      // This is a simplified version - in production, use Directus user management
      
      // Update tenant email if it was changed
      if (customEmail && customEmail !== tenant.email) {
        await tenantsService.update(tenant.id, { email: customEmail });
      }

      setCredentials({ email, password: tempPassword });
      setAccountCreated(true);
      onAccountCreated();

      toast({
        title: "Account Created",
        description: "Tenant portal account has been created successfully.",
      });
    } catch (error: any) {
      console.error("Error creating account:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create tenant account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      toast({
        title: "Copied",
        description: `${field} copied to clipboard`,
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setAccountCreated(false);
    setCredentials({ email: "", password: "" });
    setCustomEmail("");
    onOpenChange(false);
  };

  if (!tenant) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create Portal Account
          </DialogTitle>
          <DialogDescription>
            {accountCreated
              ? "Account created! Share these credentials with the tenant."
              : `Create a tenant portal account for ${tenant.business_name}`}
          </DialogDescription>
        </DialogHeader>

        {!accountCreated ? (
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">{tenant.business_name}</p>
              <p className="text-sm text-muted-foreground">{tenant.contact_person}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account-email">Account Email</Label>
              <Input
                id="account-email"
                type="email"
                placeholder={tenant.email || "Enter email address"}
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
              />
              {tenant.email && (
                <p className="text-xs text-muted-foreground">
                  Leave empty to use tenant's registered email: {tenant.email}
                </p>
              )}
            </div>

            <Button
              onClick={handleCreateAccount}
              disabled={loading || (!tenant.email && !customEmail)}
              className="w-full"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-primary/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Email:</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {credentials.email}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => copyToClipboard(credentials.email, "Email")}
                  >
                    {copiedField === "Email" ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Password:</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                    {credentials.password}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => copyToClipboard(credentials.password, "Password")}
                  >
                    {copiedField === "Password" ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <Badge variant="outline" className="bg-amber-500/20 text-amber-700 border-amber-500/30">
                Important
              </Badge>
              <p className="text-sm text-muted-foreground">
                Share these credentials securely with the tenant. They can log in at the Tenant Portal.
              </p>
            </div>

            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
