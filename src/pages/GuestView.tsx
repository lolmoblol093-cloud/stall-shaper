import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Building2, 
  Search, 
  MapPin, 
  Phone, 
  Clock, 
  Home,
  Users,
  Mail,
  LogOut
} from "lucide-react";
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
  const [session, setSession] = useState<Session | null>(null);
  const [businesses, setBusinesses] = useState<BusinessListing[]>([]);
  const [availableStalls, setAvailableStalls] = useState<AvailableStall[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    fetchData();

    // Set up realtime subscriptions
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

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch active tenants with their stall info
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select('*')
        .eq('status', 'active');

      if (tenantsError) throw tenantsError;

      // Fetch all stalls
      const { data: stallsData, error: stallsError } = await supabase
        .from('stalls')
        .select('*');

      if (stallsError) throw stallsError;

      // Map tenants to business listings
      const businessListings: BusinessListing[] = (tenantsData || []).map(tenant => {
        const stall = stallsData?.find(s => s.stall_code === tenant.stall_number);
        return {
          id: tenant.id,
          stallCode: tenant.stall_number || '',
          businessName: tenant.business_name,
          ownerName: tenant.contact_person,
          floor: stall?.floor || 'N/A',
          contactNumber: tenant.phone || undefined,
          email: tenant.email || undefined,
          monthlyRent: tenant.monthly_rent ? Number(tenant.monthly_rent) : undefined,
        };
      });

      // Filter available stalls (vacant ones)
      const availableStallsList: AvailableStall[] = (stallsData || [])
        .filter(stall => stall.occupancy_status === 'vacant')
        .map(stall => ({
          id: stall.id,
          stallCode: stall.stall_code,
          floor: stall.floor,
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
      // Session already invalid, just clear local state
      console.log("Logout error (ignoring):", error);
    }
    // Always navigate to login regardless of error
    navigate("/login");
  };

  const filteredBusinesses = businesses.filter(business => {
    const matchesSearch = !searchTerm || 
      business.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.stallCode.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Marketplace Directory</h1>
                <p className="text-sm text-muted-foreground">Discover local businesses and services</p>
              </div>
            </div>
            {session ? (
              <Button
                variant="outline"
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => navigate("/login")}
                className="flex items-center space-x-2"
              >
                <Users className="h-4 w-4" />
                <span>Admin Login</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex space-x-1 bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === "directory" ? "default" : "ghost"}
              onClick={() => setViewMode("directory")}
              className="px-6"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Business Directory
            </Button>
            <Button
              variant={viewMode === "available" ? "default" : "ghost"}
              onClick={() => setViewMode("available")}
              className="px-6"
            >
              <Home className="h-4 w-4 mr-2" />
              Available Stalls
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search businesses or services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-80"
            />
          </div>
        </div>

        {viewMode === "directory" && (
          <>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredBusinesses.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No businesses found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm ? "Try adjusting your search terms" : "No active tenants at the moment"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBusinesses.map((business) => (
                  <Card key={business.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{business.businessName}</CardTitle>
                          <CardDescription>Stall {business.stallCode} • {business.floor}</CardDescription>
                        </div>
                        <Badge variant="secondary">
                          Active
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>Owner: {business.ownerName}</span>
                        </div>
                        
                        {business.contactNumber && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{business.contactNumber}</span>
                          </div>
                        )}

                        {business.email && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{business.email}</span>
                          </div>
                        )}

                        {business.monthlyRent && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Home className="h-4 w-4 text-muted-foreground" />
                            <span>₱{business.monthlyRent.toLocaleString()}/month</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {viewMode === "available" && (
          <>
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-foreground">Available Stalls for Rent</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Prime commercial spaces available for new businesses. Contact us to schedule a viewing 
                and start your entrepreneurial journey in our thriving marketplace.
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-8 w-1/2" />
                      <Skeleton className="h-4 w-1/3" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Skeleton className="h-16 w-full" />
                      <div className="flex space-x-2">
                        <Skeleton className="h-10 flex-1" />
                        <Skeleton className="h-10 flex-1" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : availableStalls.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No stalls available</h3>
                  <p className="text-muted-foreground">
                    All stalls are currently occupied. Check back later for availability.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {availableStalls.map((stall) => (
                    <Card key={stall.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-xl">Stall {stall.stallCode}</CardTitle>
                            <CardDescription>{stall.floor}{stall.floorSize ? ` • ${stall.floorSize}` : ''}</CardDescription>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">₱{stall.monthlyRent.toLocaleString()}</div>
                            <div className="text-sm text-muted-foreground">per month</div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Badge variant="outline" className="w-fit">
                          <Home className="h-3 w-3 mr-1" />
                          Available Now
                        </Badge>
                        
                        <div className="flex space-x-2">
                          <Button className="flex-1">
                            <Phone className="h-4 w-4 mr-2" />
                            Contact Us
                          </Button>
                          <Button variant="outline" className="flex-1">
                            <Mail className="h-4 w-4 mr-2" />
                            Inquire
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card className="bg-muted/50">
                  <CardContent className="p-8 text-center space-y-4">
                    <h3 className="text-2xl font-bold text-foreground">Interested in Renting?</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Contact our leasing team to schedule a tour, discuss rental terms, 
                      and find the perfect space for your business.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button size="lg" className="px-8">
                        <Phone className="h-5 w-5 mr-2" />
                        Call +63 912 RENT NOW
                      </Button>
                      <Button size="lg" variant="outline" className="px-8">
                        <Mail className="h-5 w-5 mr-2" />
                        Email Inquiry
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Building2 className="h-6 w-6 text-primary" />
                <span className="font-bold text-lg">Marketplace</span>
              </div>
              <p className="text-muted-foreground text-sm">
                A thriving community marketplace connecting local businesses with customers.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Quick Links</h4>
              <div className="space-y-2 text-sm">
                <div className="text-muted-foreground cursor-pointer hover:text-foreground">Business Directory</div>
                <div className="text-muted-foreground cursor-pointer hover:text-foreground">Available Stalls</div>
                <div className="text-muted-foreground cursor-pointer hover:text-foreground">Rental Information</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Contact Info</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>📍 123 Market Street, City Center</div>
                <div>📞 +63 912 RENT NOW</div>
                <div>✉️ info@marketplace.com</div>
              </div>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-4 text-center text-sm text-muted-foreground">
            © 2024 Marketplace. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default GuestView;