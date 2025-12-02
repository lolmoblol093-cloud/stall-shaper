import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  TrendingUp, 
  Users, 
  Home, 
  Download,
  DollarSign,
  Calendar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

interface FloorOccupancy {
  floor: string;
  occupied: number;
  vacant: number;
  total: number;
  rate: number;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
}

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  status: string | null;
  payment_method: string | null;
  tenant_id: string;
  tenant_name?: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--muted))'];

const ReportsPage = () => {
  const { toast } = useToast();
  const [reportType, setReportType] = useState("occupancy");
  const [tenantCount, setTenantCount] = useState(0);
  const [activeTenantsCount, setActiveTenantsCount] = useState(0);
  const [stallsCount, setStallsCount] = useState(0);
  const [occupiedStallsCount, setOccupiedStallsCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [floorOccupancy, setFloorOccupancy] = useState<FloorOccupancy[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      // Fetch tenants data
      const { data: tenantsData, error: tenantsError } = await supabase
        .from("tenants")
        .select("*");
      
      if (tenantsError) throw tenantsError;
      
      setTenants(tenantsData || []);
      setTenantCount(tenantsData?.length || 0);
      setActiveTenantsCount(tenantsData?.filter(t => t.status === "active").length || 0);
      
      // Calculate total revenue from active tenants
      const revenue = tenantsData?.reduce((sum, tenant) => {
        if (tenant.status === "active") {
          return sum + (tenant.monthly_rent || 0);
        }
        return sum;
      }, 0) || 0;
      setTotalRevenue(revenue);

      // Fetch stalls data
      const { data: stalls, error: stallsError } = await supabase
        .from("stalls")
        .select("*");
      
      if (stallsError) throw stallsError;
      
      setStallsCount(stalls?.length || 0);
      setOccupiedStallsCount(stalls?.filter(s => s.occupancy_status === "occupied").length || 0);
      
      // Calculate floor occupancy breakdown
      const floorData: { [key: string]: { occupied: number; vacant: number } } = {};
      stalls?.forEach(stall => {
        const floor = stall.floor || "Unknown";
        if (!floorData[floor]) {
          floorData[floor] = { occupied: 0, vacant: 0 };
        }
        if (stall.occupancy_status === "occupied") {
          floorData[floor].occupied++;
        } else {
          floorData[floor].vacant++;
        }
      });

      const floorOccupancyArray: FloorOccupancy[] = Object.entries(floorData).map(([floor, data]) => ({
        floor,
        occupied: data.occupied,
        vacant: data.vacant,
        total: data.occupied + data.vacant,
        rate: data.occupied + data.vacant > 0 
          ? Math.round((data.occupied / (data.occupied + data.vacant)) * 100) 
          : 0
      })).sort((a, b) => {
        const order = ["Ground Floor", "Second Floor", "Third Floor"];
        return order.indexOf(a.floor) - order.indexOf(b.floor);
      });
      
      setFloorOccupancy(floorOccupancyArray);

      // Fetch payments data
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("*")
        .order("payment_date", { ascending: false });
      
      if (paymentsError) throw paymentsError;

      // Map tenant names to payments
      const paymentsWithNames = paymentsData?.map(payment => ({
        ...payment,
        tenant_name: tenantsData?.find(t => t.id === payment.tenant_id)?.business_name || "Unknown"
      })) || [];
      
      setPayments(paymentsWithNames);

      // Calculate monthly revenue trends (last 6 months)
      const monthlyData: { [key: string]: number } = {};
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const monthKey = format(date, "MMM yyyy");
        monthlyData[monthKey] = 0;
      }

      paymentsData?.forEach(payment => {
        if (payment.status === "completed") {
          const monthKey = format(new Date(payment.payment_date), "MMM yyyy");
          if (monthlyData.hasOwnProperty(monthKey)) {
            monthlyData[monthKey] += Number(payment.amount) || 0;
          }
        }
      });

      const monthlyRevenueArray: MonthlyRevenue[] = Object.entries(monthlyData).map(([month, revenue]) => ({
        month,
        revenue
      }));
      
      setMonthlyRevenue(monthlyRevenueArray);
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReport = () => {
    toast({
      title: "Report Generated",
      description: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report has been generated`,
    });
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast({
        title: "No Data",
        description: "No data available to export",
        variant: "destructive",
      });
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map(row => headers.map(header => {
        const value = row[header];
        if (typeof value === "string" && value.includes(",")) {
          return `"${value}"`;
        }
        return value ?? "";
      }).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();

    toast({
      title: "Export Complete",
      description: `${filename} has been downloaded as CSV`,
    });
  };

  const exportReport = (format: string) => {
    let data: any[] = [];
    let filename = "";

    switch (reportType) {
      case "occupancy":
        data = floorOccupancy.map(f => ({
          Floor: f.floor,
          Occupied: f.occupied,
          Vacant: f.vacant,
          Total: f.total,
          "Occupancy Rate (%)": f.rate
        }));
        filename = "occupancy_report";
        break;
      case "financial":
        data = monthlyRevenue.map(m => ({
          Month: m.month,
          Revenue: m.revenue
        }));
        filename = "financial_report";
        break;
      case "tenant":
        data = tenants.map(t => ({
          "Business Name": t.business_name,
          "Contact Person": t.contact_person,
          Email: t.email || "",
          Phone: t.phone || "",
          "Stall Number": t.stall_number || "",
          Status: t.status || "",
          "Monthly Rent": t.monthly_rent || 0
        }));
        filename = "tenant_report";
        break;
      case "payments":
        data = payments.map(p => ({
          "Tenant": p.tenant_name,
          "Amount": p.amount,
          "Date": p.payment_date,
          "Status": p.status || "",
          "Method": p.payment_method || ""
        }));
        filename = "payment_report";
        break;
    }

    if (format === "csv") {
      exportToCSV(data, filename);
    } else {
      toast({
        title: "Export Started",
        description: `${format.toUpperCase()} export is being prepared. CSV format is currently fully supported.`,
      });
      // For now, default to CSV for other formats
      exportToCSV(data, filename);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading report data...</p>
        </div>
      </DashboardLayout>
    );
  }

  const occupancyRate = stallsCount > 0 ? ((occupiedStallsCount / stallsCount) * 100).toFixed(1) : 0;
  const vacantStallsCount = stallsCount - occupiedStallsCount;

  const pieData = [
    { name: "Occupied", value: occupiedStallsCount },
    { name: "Vacant", value: vacantStallsCount }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Reports & Analytics</h2>
          <p className="text-muted-foreground mt-2">
            Generate and view comprehensive reports on occupancy, revenue, and payments
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Tenants
              </CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{tenantCount}</div>
              <p className="text-xs text-success font-medium mt-2">
                {activeTenantsCount} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Occupancy Rate
              </CardTitle>
              <Home className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{occupancyRate}%</div>
              <p className="text-xs text-muted-foreground mt-2">
                {occupiedStallsCount}/{stallsCount} stalls occupied
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Monthly Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ₱{totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-success font-medium mt-2">
                From {activeTenantsCount} tenants
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Available Stalls
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{vacantStallsCount}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Ready for occupancy
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Generate Report</CardTitle>
            <CardDescription>
              Select a report type and export format
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="occupancy">Occupancy Report</SelectItem>
                    <SelectItem value="financial">Financial Report</SelectItem>
                    <SelectItem value="tenant">Tenant Report</SelectItem>
                    <SelectItem value="payments">Payment History Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={generateReport} className="sm:w-auto">
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => exportReport('pdf')}>
                <Download className="h-4 w-4 mr-2" />
                Export as PDF
              </Button>
              <Button variant="outline" onClick={() => exportReport('csv')}>
                <Download className="h-4 w-4 mr-2" />
                Export as CSV
              </Button>
              <Button variant="outline" onClick={() => exportReport('excel')}>
                <Download className="h-4 w-4 mr-2" />
                Export as Excel
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Occupancy Breakdown by Floor</CardTitle>
              <CardDescription>Real-time stall occupancy per floor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {floorOccupancy.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No floor data available</p>
                ) : (
                  floorOccupancy.map((floor) => (
                    <div key={floor.floor} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{floor.floor}</span>
                        <span className="text-sm text-muted-foreground">
                          {floor.occupied}/{floor.total} occupied ({floor.rate}%)
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3">
                        <div 
                          className="bg-primary h-3 rounded-full transition-all duration-500"
                          style={{ width: `${floor.rate}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Overall Occupancy</CardTitle>
              <CardDescription>Total stall distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Trends (Last 6 Months)</CardTitle>
            <CardDescription>Monthly payment revenue from completed payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis 
                    tickFormatter={(value) => `₱${value.toLocaleString()}`}
                    className="text-xs"
                  />
                  <Tooltip 
                    formatter={(value: number) => [`₱${value.toLocaleString()}`, "Revenue"]}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Payments
            </CardTitle>
            <CardDescription>Latest payment transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No payment records found</p>
            ) : (
              <div className="space-y-3">
                {payments.slice(0, 10).map((payment) => (
                  <div 
                    key={payment.id} 
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{payment.tenant_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(payment.payment_date), "MMM dd, yyyy")} • {payment.payment_method || "N/A"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">₱{Number(payment.amount).toLocaleString()}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        payment.status === "completed" 
                          ? "bg-green-500/20 text-green-600" 
                          : payment.status === "pending"
                          ? "bg-yellow-500/20 text-yellow-600"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {payment.status || "unknown"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ReportsPage;