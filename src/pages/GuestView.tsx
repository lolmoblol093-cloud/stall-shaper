import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Building2, 
  Search, 
  MapPin, 
  Phone, 
  Home,
  Users,
  Mail,
  LogOut,
  Store,
  Layers,
  ChevronRight,
  Sparkles,
  Map,
  List
} from "lucide-react";
import { DirectoryMap } from "@/components/DirectoryMap";
import { StallInquiryForm } from "@/components/StallInquiryForm";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Session } from "@supabase/supabase-js";

interface BusinessListing {
  id: string;
  stallCode: string;
  businessName: string;
  ownerName: string;
  floor: string;
  contactNumber?: string;
  email?: string;
  monthlyRent?: number;
}

interface AvailableStall {
  id: string;
  stallCode: string;
  floor: string;
  floorSize?: string;
  monthlyRent: number;
}

const GuestView = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"directory" | "available">("directory");
  const [displayMode, setDisplayMode] = useState<"list" | "map">("list");
  const [selectedFloor, setSelectedFloor] = useState<string>("all");
  const [session, setSession] = useState<Session | null>(null);
  const [businesses, setBusinesses] = useState<BusinessListing[]>([]);
  const [availableStalls, setAvailableStalls] = useState<AvailableStall[]>([]);
  const [loading, setLoading] = useState(true);
  const [inquiryStall, setInquiryStall] = useState<{ id: string; stallCode: string } | null>(null);

  const floors = ["all", "Ground Floor", "Second Floor", "Third Floor"];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    fetchData();

    const tenantsChannel = supabase
      .channel('tenants-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tenants' }, () => {
        fetchData();
      })
      .subscribe();

    const stallsChannel = supabase
      .channel('stalls-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stalls' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(tenantsChannel);
      supabase.removeChannel(stallsChannel);
    };
  }, []);

  const normalizeFloorName = (floor: string): string => {
    const lowerFloor = floor.toLowerCase().trim();
    if (lowerFloor === "ground" || lowerFloor === "ground floor") return "Ground Floor";
    if (lowerFloor === "second" || lowerFloor === "second floor") return "Second Floor";
    if (lowerFloor === "third" || lowerFloor === "third floor") return "Third Floor";
    return floor;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select('*')
        .eq('status', 'active');

      if (tenantsError) throw tenantsError;

      const { data: stallsData, error: stallsError } = await supabase
        .from('stalls')
        .select('*');

      if (stallsError) throw stallsError;

      const businessListings: BusinessListing[] = (tenantsData || []).map(tenant => {
        const stall = stallsData?.find(s => s.stall_code === tenant.stall_number);
        return {
          id: tenant.id,
          stallCode: tenant.stall_number || '',
          businessName: tenant.business_name,
          ownerName: tenant.contact_person,
          floor: normalizeFloorName(stall?.floor || 'N/A'),
          contactNumber: tenant.phone || undefined,
          email: tenant.email || undefined,
          monthlyRent: tenant.monthly_rent ? Number(tenant.monthly_rent) : undefined,
        };
      });

      const availableStallsList: AvailableStall[] = (stallsData || [])
        .filter(stall => stall.occupancy_status === 'vacant')
        .map(stall => ({
          id: stall.id,
          stallCode: stall.stall_code,
          floor: normalizeFloorName(stall.floor),
          floorSize: stall.floor_size || undefined,
          monthlyRent: Number(stall.monthly_rent),
        }));

      setBusinesses(businessListings);
      setAvailableStalls(availableStallsList);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load directory data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    } catch (error) {
      console.log("Logout error (ignoring):", error);
    }
    navigate("/login");
  };

  const filteredBusinesses = businesses.filter(business => {
    const matchesSearch = !searchTerm || 
      business.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.stallCode.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFloor = selectedFloor === "all" || business.floor === selectedFloor;
    
    return matchesSearch && matchesFloor;
  });

  const filteredStalls = availableStalls.filter(stall => {
    const matchesFloor = selectedFloor === "all" || stall.floor === selectedFloor;
    return matchesFloor;
  });

  const getFloorColor = (floor: string) => {
    switch (floor) {
      case "Ground Floor": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "Second Floor": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "Third Floor": return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Building2 className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Marketplace</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Business Directory</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/tenant-login")}
              >
                <Store className="h-4 w-4 mr-2" />
                Tenant Portal
              </Button>
              {session ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/login")}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b border-border">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-primary text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              Discover Local Businesses
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Find Your Perfect Space
            </h2>
            <p className="text-muted-foreground">
              Browse our directory of thriving businesses or find available stalls for your next venture.
            </p>
          </div>

          {/* Search */}
          <div className="max-w-xl mx-auto mt-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search businesses, stalls, or owners..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-base bg-background border-border shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Navigation & Filters */}
        <div className="flex flex-col gap-4">
          {/* View Mode Toggle */}
          <div className="flex items-center justify-center">
            <div className="inline-flex p-1 bg-muted rounded-xl">
              <Button
                variant={viewMode === "directory" ? "default" : "ghost"}
                onClick={() => setViewMode("directory")}
                className="rounded-lg"
              >
                <Store className="h-4 w-4 mr-2" />
                Directory
                <Badge variant="secondary" className="ml-2 bg-background/50">
                  {businesses.length}
                </Badge>
              </Button>
              <Button
                variant={viewMode === "available" ? "default" : "ghost"}
                onClick={() => setViewMode("available")}
                className="rounded-lg"
              >
                <Home className="h-4 w-4 mr-2" />
                Available
                <Badge variant="secondary" className="ml-2 bg-background/50">
                  {availableStalls.length}
                </Badge>
              </Button>
            </div>
          </div>

          {/* Floor Filter & Display Toggle */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <Layers className="h-4 w-4 text-muted-foreground" />
              {floors.map((floor) => (
                <Button
                  key={floor}
                  variant={selectedFloor === floor ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFloor(floor)}
                  className="rounded-full"
                >
                  {floor === "all" ? "All Floors" : floor}
                </Button>
              ))}
            </div>

            {/* List/Map Toggle */}
            <div className="inline-flex p-1 bg-muted rounded-lg">
              <Button
                variant={displayMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setDisplayMode("list")}
                className="rounded-md"
              >
                <List className="h-4 w-4 mr-1.5" />
                List
              </Button>
              <Button
                variant={displayMode === "map" ? "default" : "ghost"}
                size="sm"
                onClick={() => setDisplayMode("map")}
                className="rounded-md"
              >
                <Map className="h-4 w-4 mr-1.5" />
                Map
              </Button>
            </div>
          </div>
        </div>

        {/* Map View */}
        {displayMode === "map" && (
          <Card className="overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <DirectoryMap />
            </CardContent>
          </Card>
        )}

        {/* List Views */}
        {displayMode === "list" && (
          <>

        {/* Directory View */}
        {viewMode === "directory" && (
          <>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardContent className="p-4 space-y-3">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredBusinesses.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-12 text-center">
                  <div className="p-4 bg-muted rounded-full w-fit mx-auto mb-4">
                    <Store className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No businesses found</h3>
                  <p className="text-muted-foreground text-sm">
                    {searchTerm ? "Try adjusting your search terms" : "No active tenants at the moment"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredBusinesses.map((business) => (
                  <Card 
                    key={business.id} 
                    className="group hover:shadow-lg hover:border-primary/20 transition-all duration-300 overflow-hidden"
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                              {business.businessName}
                            </h3>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3" />
                              Stall {business.stallCode}
                            </p>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`text-xs shrink-0 ${getFloorColor(business.floor)}`}
                          >
                            {business.floor.replace(" Floor", "")}
                          </Badge>
                        </div>

                        {/* Details */}
                        <div className="space-y-1.5 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{business.ownerName}</span>
                          </div>
                          
                          {business.contactNumber && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-3.5 w-3.5 shrink-0" />
                              <span>{business.contactNumber}</span>
                            </div>
                          )}

                          {business.email && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{business.email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Available Stalls View */}
        {viewMode === "available" && (
          <>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-5 space-y-4">
                      <Skeleton className="h-6 w-1/2" />
                      <Skeleton className="h-8 w-2/3" />
                      <Skeleton className="h-10 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredStalls.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-12 text-center">
                  <div className="p-4 bg-muted rounded-full w-fit mx-auto mb-4">
                    <Home className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No stalls available</h3>
                  <p className="text-muted-foreground text-sm">
                    {selectedFloor !== "all" 
                      ? `No available stalls on ${selectedFloor}. Try viewing all floors.`
                      : "All stalls are currently occupied. Check back later."
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStalls.map((stall) => (
                  <Card 
                    key={stall.id} 
                    className="group hover:shadow-lg hover:border-primary/20 transition-all duration-300 overflow-hidden"
                  >
                    <CardContent className="p-5">
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <Badge 
                              variant="outline" 
                              className={`mb-2 ${getFloorColor(stall.floor)}`}
                            >
                              {stall.floor}
                            </Badge>
                            <h3 className="text-xl font-bold text-foreground">
                              Stall {stall.stallCode}
                            </h3>
                            {stall.floorSize && (
                              <p className="text-sm text-muted-foreground mt-0.5">
                                Size: {stall.floorSize}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">
                              ₱{stall.monthlyRent.toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground">per month</div>
                          </div>
                        </div>

                        {/* CTA */}
                        <Button 
                          className="w-full group-hover:bg-primary/90" 
                          size="sm"
                          onClick={() => setInquiryStall({ id: stall.id, stallCode: stall.stallCode })}
                        >
                          Inquire Now
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Contact CTA */}
            {availableStalls.length > 0 && (
              <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20">
                <CardContent className="p-8 text-center space-y-4">
                  <h3 className="text-2xl font-bold text-foreground">Ready to Start Your Business?</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Contact our leasing team to schedule a tour and find the perfect space.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button size="lg">
                      <Phone className="h-4 w-4 mr-2" />
                      Call Now
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline"
                      onClick={() => availableStalls.length > 0 && setInquiryStall({ 
                        id: availableStalls[0].id, 
                        stallCode: "General" 
                      })}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Send Inquiry
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
        </>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="font-semibold">Marketplace</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              © 2024 Marketplace Directory. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Inquiry Form Dialog */}
      <StallInquiryForm
        isOpen={!!inquiryStall}
        onClose={() => setInquiryStall(null)}
        stallId={inquiryStall?.id || ""}
        stallCode={inquiryStall?.stallCode || ""}
      />
    </div>
  );
};

export default GuestView;
