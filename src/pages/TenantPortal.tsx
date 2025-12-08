import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService, AuthUser } from "@/services/authService";
import { tenantService } from "@/services/tenantService";
import { stallService } from "@/services/stallService";
import { paymentService } from "@/services/paymentService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import LeaseTimeline from "@/components/LeaseTimeline";
import { 
  Store, 
  LogOut, 
  Building2, 
  Phone, 
  Mail, 
  MapPin,
  User,
  Receipt,
  CheckCircle,
  AlertCircle,
  Loader2,
  AlertTriangle,
  TrendingUp,
  RefreshCw
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import type { Tenant, Stall, Payment } from "@/integrations/directus/client";

const TenantPortal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [stall, setStall] = useState<Stall | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    const checkSession = async () => {
      const { user: currentUser } = await authService.getSession();
      if (!currentUser) {
        navigate("/tenant-login");
        return;
      }
      setUser(currentUser);
      await fetchTenantData(currentUser.id);
    };
    checkSession();
  }, [navigate]);

  const fetchTenantData = async (userId: string) => {
    try {
      const tenantId = await authService.getTenantForUser(userId);
      
      if (!tenantId) {
        toast({
          title: "Error",
          description: "No tenant account linked. Please contact the property manager.",
          variant: "destructive",
        });
        await authService.signOut();
        navigate("/tenant-login");
        return;
      }

      const tenantData = await tenantService.getById(tenantId);
      if (tenantData) {
        setTenant(tenantData);

        if (tenantData.stall_number) {
          const stalls = await stallService.getAll();
          const stallData = stalls.find(s => s.stall_code === tenantData.stall_number);
          if (stallData) {
            setStall(stallData);
          }
        }

        const paymentsData = await paymentService.getByTenant(tenantId);
        setPayments(paymentsData);
      }
    } catch (error) {
      console.error("Error fetching tenant data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!user?.id) return;
    setRefreshing(true);
    await fetchTenantData(user.id);
    setRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Your data has been refreshed.",
    });
  };

  const handleSignOut = async () => {
    await authService.signOut();
    navigate("/tenant-login");
  };

  // Calculate payment statistics
  const paymentStats = React.useMemo(() => {
    const completed = payments.filter(p => p.status === "completed");
    const pending = payments.filter(p => p.status === "pending");
    const totalPaid = completed.reduce((sum, p) => sum + p.amount, 0);
    const totalPending = pending.reduce((sum, p) => sum + p.amount, 0);
    
    const currentYear = new Date().getFullYear();
    const thisYearPayments = completed.filter(p => 
      new Date(p.payment_date).getFullYear() === currentYear
    );
    const thisYearTotal = thisYearPayments.reduce((sum, p) => sum + p.amount, 0);

    return {
      totalPaid,
      totalPending,
      thisYearTotal,
      completedCount: completed.length,
      pendingCount: pending.length
    };
  }, [payments]);

  // Calculate lease status
  const leaseStatus = React.useMemo(() => {
    if (!tenant?.lease_end_date || !tenant?.lease_start_date) return null;
    
    const startDate = new Date(tenant.lease_start_date);
    const endDate = new Date(tenant.lease_end_date);
    const today = new Date();
    
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const totalLeaseDays = differenceInDays(endDate, startDate);
    const daysElapsed = differenceInDays(today, startDate);
    const daysRemaining = differenceInDays(endDate, today);
    
    const isExpired = today > endDate;
    const isExpiringSoon = !isExpired && daysRemaining <= 30;
    
    let percentage = 0;
    if (totalLeaseDays > 0) {
      percentage = Math.min(100, Math.max(0, (daysElapsed / totalLeaseDays) * 100));
    }
    
    return {
      daysRemaining: Math.max(0, daysRemaining),
      isExpired,
      isExpiringSoon,
      percentage
    };
  }, [tenant]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Store className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold text-lg">Tenant Portal</h1>
              <p className="text-xs text-muted-foreground">{tenant?.business_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Welcome Section */}
        <div className="text-center py-4">
          <h2 className="text-2xl font-bold">Welcome, {tenant?.contact_person}!</h2>
          <p className="text-muted-foreground">Manage your stall and view your payment history</p>
        </div>

        {/* Lease Alert */}
        {leaseStatus?.isExpired && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="flex items-center gap-4 py-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div>
                <p className="font-semibold text-destructive">Lease Expired</p>
                <p className="text-sm text-muted-foreground">
                  Your lease has expired. Please contact the property manager to renew.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {leaseStatus?.isExpiringSoon && !leaseStatus?.isExpired && (
          <Card className="border-yellow-500 bg-yellow-500/10">
            <CardContent className="flex items-center gap-4 py-4">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="font-semibold text-yellow-700 dark:text-yellow-400">Lease Expiring Soon</p>
                <p className="text-sm text-muted-foreground">
                  Your lease expires in {leaseStatus.daysRemaining} days. Please contact the property manager to renew.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">Total Paid</span>
              </div>
              <p className="text-2xl font-bold text-green-600">₱{paymentStats.totalPaid.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-muted-foreground">Pending</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">₱{paymentStats.totalPending.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Receipt className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">This Year</span>
              </div>
              <p className="text-2xl font-bold">₱{paymentStats.thisYearTotal.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Payments</span>
              </div>
              <p className="text-2xl font-bold">{paymentStats.completedCount}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Business Information
              </CardTitle>
              <CardDescription>Your registered business details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Store className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Business Name</p>
                  <p className="font-medium">{tenant?.business_name}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Contact Person</p>
                  <p className="font-medium">{tenant?.contact_person}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{tenant?.email || "Not provided"}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{tenant?.phone || "Not provided"}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <div className="h-4 w-4" />
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={tenant?.status === "active" ? "default" : "secondary"}>
                    {tenant?.status || "Unknown"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stall Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Stall Information
              </CardTitle>
              <CardDescription>Your assigned stall details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {tenant?.stall_number ? (
                <>
                  <div className="flex items-center gap-3">
                    <Store className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Stall Number</p>
                      <p className="font-medium">{tenant.stall_number}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Floor</p>
                      <p className="font-medium capitalize">{stall?.floor || "N/A"}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4" />
                    <div>
                      <p className="text-sm text-muted-foreground">Floor Size</p>
                      <p className="font-medium">{stall?.floor_size || "N/A"}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4" />
                    <div>
                      <p className="text-sm text-muted-foreground">Monthly Rent</p>
                      <p className="font-medium">₱{(tenant.monthly_rent || stall?.monthly_rent || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">No stall assigned</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lease Timeline */}
        {tenant?.lease_start_date && tenant?.lease_end_date && (
          <LeaseTimeline
            startDate={tenant.lease_start_date}
            endDate={tenant.lease_end_date}
          />
        )}

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Payment History
            </CardTitle>
            <CardDescription>Your recent payments</CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length > 0 ? (
              <div className="space-y-3">
                {payments.slice(0, 10).map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">₱{payment.amount.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(payment.payment_date), "MMM dd, yyyy")}
                        {payment.payment_method && ` • ${payment.payment_method}`}
                      </p>
                    </div>
                    <Badge
                      variant={
                        payment.status === "completed"
                          ? "default"
                          : payment.status === "pending"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {payment.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No payment history available
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TenantPortal;
