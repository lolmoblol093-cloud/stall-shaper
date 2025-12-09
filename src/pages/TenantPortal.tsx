import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
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
import {
  mockTenants,
  mockStalls,
  mockPayments,
  getTenantById,
  Tenant,
  Payment,
  Stall,
} from "@/data/mockData";

const TenantPortal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut, isTenant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [stall, setStall] = useState<Stall | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    if (!user) {
      navigate("/tenant-login");
      return;
    }

    if (!isTenant) {
      navigate("/tenant-login");
      return;
    }

    loadTenantData();
  }, [user, isTenant, navigate]);

  const loadTenantData = () => {
    // For demo, get the first tenant or use tenant_id from user
    const tenantData = user?.tenant_id 
      ? getTenantById(user.tenant_id) 
      : mockTenants.find(t => t.email === user?.email) || mockTenants[0];

    if (tenantData) {
      setTenant(tenantData);

      if (tenantData.stall_number) {
        const stallData = mockStalls.find(s => s.stall_code === tenantData.stall_number);
        if (stallData) {
          setStall(stallData);
        }
      }

      const tenantPayments = mockPayments.filter(p => p.tenant_id === tenantData.id);
      setPayments(tenantPayments);
    }

    setLoading(false);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadTenantData();
    setTimeout(() => {
      setRefreshing(false);
      toast({
        title: "Refreshed",
        description: "Your data has been refreshed.",
      });
    }, 500);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/guest");
  };

  const paymentStats = useMemo(() => {
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

  const leaseStatus = useMemo(() => {
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
                      <p className="font-medium">Stall {tenant.stall_number}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Floor</p>
                      <p className="font-medium">{stall?.floor || "N/A"}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Floor Size</p>
                      <p className="font-medium">{stall?.floor_size || "N/A"}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Monthly Rent</p>
                      <p className="font-medium">₱{tenant.monthly_rent?.toLocaleString() || stall?.monthly_rent?.toLocaleString() || "N/A"}</p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-center py-4">No stall assigned</p>
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
            {payments.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No payment history available</p>
            ) : (
              <div className="space-y-4">
                {payments.slice(0, 10).map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">₱{payment.amount.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(payment.payment_date), "MMM dd, yyyy")}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={payment.status === "completed" ? "default" : "secondary"}>
                        {payment.status}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1 capitalize">
                        {payment.payment_method?.replace("_", " ") || "N/A"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TenantPortal;
