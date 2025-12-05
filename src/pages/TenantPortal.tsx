import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Store, 
  LogOut, 
  Building2, 
  Calendar, 
  Phone, 
  Mail, 
  CreditCard,
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
import { Session } from "@supabase/supabase-js";
import { format, differenceInDays, isPast, isWithinInterval, addDays } from "date-fns";

interface TenantData {
  id: string;
  business_name: string;
  contact_person: string;
  email: string | null;
  phone: string | null;
  stall_number: string | null;
  monthly_rent: number | null;
  lease_start_date: string | null;
  lease_end_date: string | null;
  status: string | null;
}

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string | null;
  status: string | null;
  notes: string | null;
}

interface StallData {
  id: string;
  stall_code: string;
  floor: string;
  floor_size: string | null;
  monthly_rent: number;
}

const TenantPortal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [stall, setStall] = useState<StallData | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenantUserId, setTenantUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/tenant-login");
      } else {
        fetchTenantData(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'SIGNED_OUT') {
        navigate("/tenant-login");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Real-time subscription for tenant and payment updates
  useEffect(() => {
    if (!tenant?.id) return;

    const tenantChannel = supabase
      .channel('tenant-portal-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tenants',
          filter: `id=eq.${tenant.id}`
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setTenant(payload.new as TenantData);
            toast({
              title: "Information Updated",
              description: "Your tenant information has been updated.",
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `tenant_id=eq.${tenant.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setPayments(prev => [payload.new as Payment, ...prev]);
            toast({
              title: "New Payment Recorded",
              description: `A payment of ₱${(payload.new as Payment).amount.toLocaleString()} has been recorded.`,
            });
          } else if (payload.eventType === 'UPDATE') {
            setPayments(prev => prev.map(p => p.id === (payload.new as Payment).id ? payload.new as Payment : p));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tenantChannel);
    };
  }, [tenant?.id]);

  const fetchTenantData = async (userId: string) => {
    try {
      const { data: tenantUser } = await supabase
        .from("tenant_users")
        .select("tenant_id")
        .eq("user_id", userId)
        .single();

      if (!tenantUser) {
        toast({
          title: "Error",
          description: "No tenant account linked. Please contact the property manager.",
          variant: "destructive",
        });
        await supabase.auth.signOut();
        return;
      }

      setTenantUserId(tenantUser.tenant_id);

      const { data: tenantData } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", tenantUser.tenant_id)
        .single();

      if (tenantData) {
        setTenant(tenantData);

        if (tenantData.stall_number) {
          const { data: stallData } = await supabase
            .from("stalls")
            .select("*")
            .eq("stall_code", tenantData.stall_number)
            .single();
          
          if (stallData) {
            setStall(stallData);
          }
        }

        const { data: paymentsData } = await supabase
          .from("payments")
          .select("*")
          .eq("tenant_id", tenantUser.tenant_id)
          .order("payment_date", { ascending: false });

        if (paymentsData) {
          setPayments(paymentsData);
        }
      }
    } catch (error) {
      console.error("Error fetching tenant data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!session?.user.id) return;
    setRefreshing(true);
    await fetchTenantData(session.user.id);
    setRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Your data has been refreshed.",
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
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
    if (!tenant?.lease_end_date) return null;
    
    const endDate = new Date(tenant.lease_end_date);
    const today = new Date();
    const daysRemaining = differenceInDays(endDate, today);
    
    const isExpired = isPast(endDate);
    const isExpiringSoon = !isExpired && daysRemaining <= 30;
    
    return {
      daysRemaining,
      isExpired,
      isExpiringSoon,
      percentage: tenant.lease_start_date 
        ? Math.min(100, Math.max(0, 
            (differenceInDays(today, new Date(tenant.lease_start_date)) / 
             differenceInDays(endDate, new Date(tenant.lease_start_date))) * 100
          ))
        : 0
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
                      <p className="font-medium text-lg">{tenant.stall_number}</p>
                    </div>
                  </div>
                  <Separator />
                  {stall && (
                    <>
                      <div className="flex items-center gap-3">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Floor</p>
                          <p className="font-medium">{stall.floor}</p>
                        </div>
                      </div>
                      <Separator />
                      {stall.floor_size && (
                        <>
                          <div className="flex items-center gap-3">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-muted-foreground">Floor Size</p>
                              <p className="font-medium">{stall.floor_size}</p>
                            </div>
                          </div>
                          <Separator />
                        </>
                      )}
                    </>
                  )}
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Monthly Rent</p>
                      <p className="font-medium text-lg text-primary">
                        ₱{(tenant.monthly_rent || stall?.monthly_rent || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Lease Period</p>
                      <p className="font-medium">
                        {tenant.lease_start_date 
                          ? format(new Date(tenant.lease_start_date), "MMM d, yyyy")
                          : "N/A"
                        }
                        {" - "}
                        {tenant.lease_end_date 
                          ? format(new Date(tenant.lease_end_date), "MMM d, yyyy")
                          : "N/A"
                        }
                      </p>
                      {leaseStatus && tenant.lease_start_date && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Lease Progress</span>
                            <span>{leaseStatus.daysRemaining > 0 ? `${leaseStatus.daysRemaining} days left` : 'Expired'}</span>
                          </div>
                          <Progress 
                            value={leaseStatus.percentage} 
                            className={`h-2 ${leaseStatus.isExpired ? '[&>div]:bg-destructive' : leaseStatus.isExpiringSoon ? '[&>div]:bg-yellow-500' : ''}`}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No stall assigned yet</p>
                  <p className="text-sm">Contact the property manager for stall assignment</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Payment History
            </CardTitle>
            <CardDescription>Your complete payment transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length > 0 ? (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${
                        payment.status === "completed" 
                          ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                          : payment.status === "pending"
                          ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                        {payment.status === "completed" ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">₱{payment.amount.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(payment.payment_date), "MMMM d, yyyy")}
                        </p>
                        {payment.notes && (
                          <p className="text-xs text-muted-foreground mt-1">{payment.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        payment.status === "completed" ? "default" :
                        payment.status === "pending" ? "secondary" : "destructive"
                      }>
                        {payment.status}
                      </Badge>
                      {payment.payment_method && (
                        <p className="text-xs text-muted-foreground mt-1">
                          via {payment.payment_method}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No payment records found</p>
                <p className="text-sm">Your payment history will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>Explore the property marketplace</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => navigate("/")}>
                <Store className="h-4 w-4 mr-2" />
                View Marketplace
              </Button>
              <Button variant="outline" onClick={() => navigate("/guest")}>
                <Building2 className="h-4 w-4 mr-2" />
                View Directory
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 py-6 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Property Management System</p>
      </footer>
    </div>
  );
};

export default TenantPortal;
