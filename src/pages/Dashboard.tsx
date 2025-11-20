import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Home, MapPin, TrendingUp } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { DirectoryMap } from "@/components/DirectoryMap";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTenants: 0,
    activeTenants: 0,
    occupiedStalls: 0,
    totalStalls: 0,
    availableStalls: 0,
    monthlyRevenue: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
    
    const stallsChannel = supabase
      .channel('dashboard-stalls')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stalls' }, fetchDashboardData)
      .subscribe();

    const tenantsChannel = supabase
      .channel('dashboard-tenants')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tenants' }, fetchDashboardData)
      .subscribe();

    const paymentsChannel = supabase
      .channel('dashboard-payments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, fetchDashboardData)
      .subscribe();

    return () => {
      supabase.removeChannel(stallsChannel);
      supabase.removeChannel(tenantsChannel);
      supabase.removeChannel(paymentsChannel);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [tenantsResult, stallsResult, paymentsResult] = await Promise.all([
        supabase.from("tenants").select("*"),
        supabase.from("stalls").select("*"),
        supabase.from("payments").select("*, tenants(business_name)").order("created_at", { ascending: false }).limit(3)
      ]);

      if (tenantsResult.error) throw tenantsResult.error;
      if (stallsResult.error) throw stallsResult.error;
      if (paymentsResult.error) throw paymentsResult.error;

      const tenants = tenantsResult.data || [];
      const stalls = stallsResult.data || [];
      const payments = paymentsResult.data || [];

      const activeTenants = tenants.filter(t => t.status === "active").length;
      const occupiedStalls = stalls.filter(s => s.occupancy_status === "occupied").length;
      const vacantStalls = stalls.filter(s => s.occupancy_status === "vacant").length;

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyPayments = payments.filter(p => {
        const paymentDate = new Date(p.payment_date);
        return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
      });
      const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + Number(p.amount), 0);

      setStats({
        totalTenants: tenants.length,
        activeTenants,
        occupiedStalls,
        totalStalls: stalls.length,
        availableStalls: vacantStalls,
        monthlyRevenue
      });

      const recentActivities = payments.slice(0, 3).map(payment => ({
        type: "payment",
        message: `Payment received from ${payment.tenants?.business_name || "Unknown"}`,
        time: new Date(payment.created_at).toLocaleString(),
        status: payment.status
      }));

      setRecentActivity(recentActivities);
      setLoading(false);
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      setLoading(false);
    }
  };

  const statsData = [
    {
      title: "Total Tenants",
      value: stats.totalTenants.toString(),
      description: `${stats.activeTenants} active tenants`,
      icon: Users,
      trend: `${stats.totalTenants} registered`
    },
    {
      title: "Occupied Stalls",
      value: `${stats.occupiedStalls}/${stats.totalStalls}`,
      description: `${stats.totalStalls > 0 ? Math.round((stats.occupiedStalls / stats.totalStalls) * 100) : 0}% occupancy rate`,
      icon: Home,
      trend: `${stats.occupiedStalls} occupied`
    },
    {
      title: "Available Stalls",
      value: stats.availableStalls.toString(),
      description: "Ready for new tenants",
      icon: MapPin,
      trend: `${stats.availableStalls} vacant`
    },
    {
      title: "Monthly Revenue",
      value: `₱${stats.monthlyRevenue.toLocaleString()}`,
      description: "Current month earnings",
      icon: TrendingUp,
      trend: "This month"
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Dashboard Overview</h2>
          <p className="text-muted-foreground mt-2">
            Welcome to your property management dashboard
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-20 mb-2" />
                  <Skeleton className="h-3 w-32 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </CardContent>
              </Card>
            ))
          ) : (
            statsData.map((stat, index) => (
              <Card key={index} className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium mt-2">
                    {stat.trend}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest tenant and stall updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <Skeleton className="w-2 h-2 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))
              ) : recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.status === "completed" ? "bg-success" : 
                      activity.status === "pending" ? "bg-warning" : "bg-primary"
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common management tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <button 
                onClick={() => navigate("/dashboard/tenants")}
                className="w-full text-left p-3 rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <div className="font-medium">Add New Tenant</div>
                <div className="text-sm text-muted-foreground">Register a new tenant to an available stall</div>
              </button>
              <button 
                onClick={() => navigate("/dashboard/stalls")}
                className="w-full text-left p-3 rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <div className="font-medium">Update Stall Information</div>
                <div className="text-sm text-muted-foreground">Modify stall details, rates, or status</div>
              </button>
              <button 
                onClick={() => navigate("/dashboard/reports")}
                className="w-full text-left p-3 rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <div className="font-medium">Generate Reports</div>
                <div className="text-sm text-muted-foreground">View occupancy and financial reports</div>
              </button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Stall Directory Map</CardTitle>
            <CardDescription>Interactive view of all stalls and their occupancy status</CardDescription>
          </CardHeader>
          <CardContent>
            <DirectoryMap />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;