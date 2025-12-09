import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, Copy, Check, Eye, EyeOff } from "lucide-react";

interface Tenant {
  id: string;
  business_name: string;
  contact_person: string;
  email: string | null;
}

interface ResetTenantPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: Tenant | null;
}

export const ResetTenantPasswordDialog: React.FC<ResetTenantPasswordDialogProps> = ({
  open,
  onOpenChange,
  tenant,
}) => {
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(result);
    setShowPassword(true);
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied",
      description: "Password copied to clipboard",
    });
  };

  const handleResetPassword = async () => {
    if (!tenant || !tenant.email) {
      toast({
        title: "Error",
        description: "Tenant has no email address",
        variant: "destructive",
      });
      return;
    }

    if (!password || password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Simulate password reset (UI-only mode)
    setTimeout(() => {
      toast({
        title: "Password Reset",
        description: `New password set for ${tenant.business_name}. Share it with the tenant.`,
      });

      onOpenChange(false);
      setPassword("");
      setShowPassword(false);
      setLoading(false);
    }, 500);
  };

  const handleClose = () => {
    onOpenChange(false);
    setPassword("");
    setShowPassword(false);
    setCopied(false);
  };

  if (!tenant) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Reset Password
          </DialogTitle>
          <DialogDescription>
            Set a new password for <strong>{tenant.business_name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {!tenant.email ? (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
              This tenant has no email address. Please add an email first.
            </div>
          ) : (
            <>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Email: <span className="font-medium text-foreground">{tenant.email}</span>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter or generate password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button type="button" variant="outline" onClick={generatePassword}>
                    Generate
                  </Button>
                </div>
              </div>

              {password && (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    className="flex items-center gap-2"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied!" : "Copy Password"}
                  </Button>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleResetPassword}
                  disabled={loading || !password}
                  className="flex-1"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Share the new password with the tenant manually
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
