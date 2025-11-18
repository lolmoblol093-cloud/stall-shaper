import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Search, Building, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DirectoryMap } from "@/components/DirectoryMap";
import { useToast } from "@/hooks/use-toast";

interface DirectoryStall {
  id: string;
  stallCode: string;
  floor: string;
  occupancyStatus: "occupied" | "vacant";
  tenantName?: string;
  businessType?: string;
  monthlyRent?: number;
}

const DirectoryPage = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFloor, setSelectedFloor] = useState("all");
  const [stalls, setStalls] = useState<DirectoryStall[]>([]);
  const [loading, setLoading] = useState(true);
  const [highlightedStallCode, setHighlightedStallCode] = useState<string | null>(null);

  useEffect(() => {
    fetchStallsWithTenants();
    
    // Set up real-time subscription for stalls and tenants
    const stallsChannel = supabase
      .channel('stalls-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stalls' }, () => {
        fetchStallsWithTenants();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tenants' }, () => {
        fetchStallsWithTenants();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(stallsChannel);
    };
  }, []);

  const fetchStallsWithTenants = async () => {
    try {
      // Fetch all stalls
      const { data: stallsData, error: stallsError } = await supabase
        .from('stalls')
        .select('*')
        .order('stall_code');

      if (stallsError) throw stallsError;

      // Fetch all active tenants
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select('*')
        .eq('status', 'active');

      if (tenantsError) throw tenantsError;

      // Combine stalls with tenant information
      const combinedData: DirectoryStall[] = (stallsData || []).map(stall => {
        const tenant = tenantsData?.find(t => t.stall_number === stall.stall_code);
        return {
          id: stall.id,
          stallCode: stall.stall_code,
          floor: stall.floor,
          occupancyStatus: stall.occupancy_status as "occupied" | "vacant",
          tenantName: tenant?.business_name,
          businessType: tenant ? "Business" : undefined,
          monthlyRent: stall.monthly_rent
        };
      });

      setStalls(combinedData);
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

  const filteredStalls = stalls.filter(stall => {
    const matchesSearch = !searchTerm || 
      stall.stallCode.includes(searchTerm) ||
      stall.tenantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stall.businessType?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFloor = selectedFloor === "all" || stall.floor === selectedFloor;
    
    return matchesSearch && matchesFloor;
  });

  const groundFloorStalls = filteredStalls.filter(s => s.floor === "Ground Floor");
  const secondFloorStalls = filteredStalls.filter(s => s.floor === "Second Floor");

  const handleStallClick = (stallCode: string) => {
    setHighlightedStallCode(stallCode);
    // Scroll to the map
    const mapElement = document.getElementById('directory-map-section');
    if (mapElement) {
      mapElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const getBusinessTypeColor = (type?: string) => {
    const colors: Record<string, string> = {
      "Food": "bg-orange-500",
      "Grocery": "bg-green-500", 
      "Electronics": "bg-blue-500",
      "Clothing": "bg-purple-500",
      "Services": "bg-yellow-500",
      "Retail": "bg-pink-500",
      "Education": "bg-indigo-500",
      "Health": "bg-red-500",
      "Furniture": "bg-brown-500",
      "Handicrafts": "bg-teal-500",
      "General": "bg-gray-500"
    };
    return colors[type || ""] || "bg-gray-400";
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading directory...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Property Directory</h2>
            <p className="text-muted-foreground mt-2">
              Browse stalls organized by floor and location
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by stall, tenant, or business type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex space-x-2">
            <Button 
              variant={selectedFloor === "all" ? "default" : "outline"}
              onClick={() => setSelectedFloor("all")}
            >
              All Floors
            </Button>
            <Button 
              variant={selectedFloor === "Ground Floor" ? "default" : "outline"}
              onClick={() => setSelectedFloor("Ground Floor")}
            >
              Ground Floor
            </Button>
            <Button 
              variant={selectedFloor === "Second Floor" ? "default" : "outline"}
              onClick={() => setSelectedFloor("Second Floor")}
            >
              Second Floor
            </Button>
          </div>
        </div>

        {/* Interactive Directory Map */}
        <Card id="directory-map-section">
          <CardContent className="pt-6">
            <DirectoryMap highlightedStallCode={highlightedStallCode} />
          </CardContent>
        </Card>

        {(selectedFloor === "all" || selectedFloor === "Ground Floor") && groundFloorStalls.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Ground Floor Directory</span>
              </CardTitle>
              <CardDescription>
                {groundFloorStalls.filter(s => s.occupancyStatus === "occupied").length} occupied, {groundFloorStalls.filter(s => s.occupancyStatus === "vacant").length} available
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {groundFloorStalls.map((stall) => (
                  <div
                    key={stall.stallCode}
                    onClick={() => handleStallClick(stall.stallCode)}
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-lg ${
                      stall.occupancyStatus === "occupied" 
                        ? "border-status-occupied bg-card" 
                        : "border-status-vacant bg-muted/30"
                    } ${highlightedStallCode === stall.stallCode ? 'ring-2 ring-primary shadow-lg scale-105' : ''}`}
                  >
                    <div className="text-center space-y-2">
                      <div className="font-bold text-lg">Stall {stall.stallCode}</div>
                      {stall.occupancyStatus === "occupied" ? (
                        <>
                          <div className="text-sm font-medium">{stall.tenantName}</div>
                          {stall.businessType && (
                            <Badge className={`${getBusinessTypeColor(stall.businessType)} text-white text-xs`}>
                              {stall.businessType}
                            </Badge>
                          )}
                        </>
                      ) : (
                        <div className="text-sm text-muted-foreground">Available for Rent</div>
                      )}
                      <Badge
                        variant="outline"
                        className={stall.occupancyStatus === "occupied" 
                          ? "border-status-occupied text-status-occupied" 
                          : "border-status-vacant text-status-vacant"
                        }
                      >
                        {stall.occupancyStatus}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {(selectedFloor === "all" || selectedFloor === "Second Floor") && secondFloorStalls.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Second Floor Directory</span>
              </CardTitle>
              <CardDescription>
                {secondFloorStalls.filter(s => s.occupancyStatus === "occupied").length} occupied, {secondFloorStalls.filter(s => s.occupancyStatus === "vacant").length} available
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {secondFloorStalls.map((stall) => (
                  <div
                    key={stall.stallCode}
                    onClick={() => handleStallClick(stall.stallCode)}
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-lg ${
                      stall.occupancyStatus === "occupied" 
                        ? "border-status-occupied bg-card" 
                        : "border-status-vacant bg-muted/30"
                    } ${highlightedStallCode === stall.stallCode ? 'ring-2 ring-primary shadow-lg scale-105' : ''}`}
                  >
                    <div className="text-center space-y-2">
                      <div className="font-bold text-lg">Stall {stall.stallCode}</div>
                      {stall.occupancyStatus === "occupied" ? (
                        <>
                          <div className="text-sm font-medium">{stall.tenantName}</div>
                          {stall.businessType && (
                            <Badge className={`${getBusinessTypeColor(stall.businessType)} text-white text-xs`}>
                              {stall.businessType}
                            </Badge>
                          )}
                        </>
                      ) : (
                        <div className="text-sm text-muted-foreground">Available for Rent</div>
                      )}
                      <Badge
                        variant="outline"
                        className={stall.occupancyStatus === "occupied" 
                          ? "border-status-occupied text-status-occupied" 
                          : "border-status-vacant text-status-vacant"
                        }
                      >
                        {stall.occupancyStatus}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DirectoryPage;