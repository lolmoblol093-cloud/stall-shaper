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
  DollarSign
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ReportsPage = () => {
  const { toast } = useToast();
  const [reportType, setReportType] = useState("occupancy");
  const [tenantCount, setTenantCount] = useState(0);
  const [activeTenantsCount, setActiveTenantsCount] = useState(0);
  const [stallsCount, setStallsCount] = useState(0);
  const [occupiedStallsCount, setOccupiedStallsCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      // Fetch tenants data
      const { data: tenants, error: tenantsError } = await supabase
        .from("tenants")
        .select("*");
      
      if (tenantsError) throw tenantsError;
      
      setTenantCount(tenants?.length || 0);
      setActiveTenantsCount(tenants?.filter(t => t.status === "active").length || 0);
      
      // Calculate total revenue
      const revenue = tenants?.reduce((sum, tenant) => {
        return sum + (tenant.monthly_rent || 0);
      }, 0) || 0;
      setTotalRevenue(revenue);

      // Fetch stalls data
      const { data: stalls, error: stallsError } = await supabase
        .from("stalls")
        .select("*");
      
      if (stallsError) throw stallsError;
      
      setStallsCount(stalls?.length || 0);
      setOccupiedStallsCount(stalls?.filter(s => s.occupancy_status === "occupied").length || 0);
      
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

  const exportReport = (format: string) => {
    toast({
      title: "Exporting Report",
      description: `Report will be downloaded as ${format.toUpperCase()}`,
    });
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Reports & Analytics</h2>
          <p className="text-muted-foreground mt-2">
            Generate and view comprehensive reports on occupancy and revenue
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
                    <SelectItem value="maintenance">Maintenance Report</SelectItem>
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
              <CardTitle>Occupancy Breakdown</CardTitle>
              <CardDescription>Stall occupancy by floor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="font-medium">Ground Floor</span>
                  <span className="text-muted-foreground">Coming soon</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="font-medium">Second Floor</span>
                  <span className="text-muted-foreground">Coming soon</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>Monthly revenue comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="font-medium">Current Month</span>
                  <span className="text-foreground font-bold">₱{totalRevenue.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="font-medium">Previous Month</span>
                  <span className="text-muted-foreground">Coming soon</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReportsPage;