import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Phone, 
  Home,
  Store,
  Layers,
  ChevronRight,
  Sparkles,
  Map,
  List,
  Mail
} from "lucide-react";
import { DirectoryMap } from "@/components/DirectoryMap";
import { StallInquiryForm } from "@/components/StallInquiryForm";
import { useNavigate } from "react-router-dom";
import { getAvailableStalls } from "@/data/mockData";

interface AvailableStall {
  id: string;
  stallCode: string;
  floor: string;
  floorSize?: string;
  monthlyRent: number;
}

const GuestView = () => {
  const navigate = useNavigate();
  const [displayMode, setDisplayMode] = useState<"list" | "map">("list");
  const [selectedFloor, setSelectedFloor] = useState<string>("all");
  const [inquiryStall, setInquiryStall] = useState<{ id: string; stallCode: string } | null>(null);

  const floors = ["all", "Ground Floor", "Second Floor", "Third Floor"];

  const normalizeFloorName = (floor: string): string => {
    const lowerFloor = floor.toLowerCase().trim();
    if (lowerFloor === "ground" || lowerFloor === "ground floor") return "Ground Floor";
    if (lowerFloor === "second" || lowerFloor === "second floor") return "Second Floor";
    if (lowerFloor === "third" || lowerFloor === "third floor") return "Third Floor";
    return floor;
  };

  const availableStalls: AvailableStall[] = useMemo(() => {
    return getAvailableStalls().map(stall => ({
      id: stall.id,
      stallCode: stall.stall_code,
      floor: normalizeFloorName(stall.floor),
      floorSize: stall.floor_size || undefined,
      monthlyRent: stall.monthly_rent,
    }));
  }, []);

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
                <p className="text-xs text-muted-foreground hidden sm:block">Available Stalls</p>
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/login")}
              >
                Admin
              </Button>
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
              Find Your Perfect Space
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Available Stalls
            </h2>
            <p className="text-muted-foreground">
              Browse available stalls and find the perfect space for your next venture.
            </p>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Home className="h-4 w-4 mr-2" />
              {availableStalls.length} Stalls Available
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Filters */}
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

        {/* Map View */}
        {displayMode === "map" && (
          <Card className="overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <DirectoryMap hideOccupiedDetails />
            </CardContent>
          </Card>
        )}

        {/* List View */}
        {displayMode === "list" && (
          <>
            {filteredStalls.length === 0 ? (
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
