import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Home, Search, Edit, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { StallSelectionMap } from "@/components/StallSelectionMap";

interface Stall {
  id: string;
  stall_code: string;
  floor: string;
  monthly_rent: number;
  electricity_reader: string | null;
  floor_size: string | null;
  occupancy_status: string;
  image_url: string | null;
}

interface Tenant {
  stall_number: string | null;
  business_name: string;
}

const StallsPage = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedStall, setSelectedStall] = useState<Stall | null>(null);
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStallFromMap, setSelectedStallFromMap] = useState<string | null>(null);
  const [mapRefreshTrigger, setMapRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchStalls();
    fetchTenants();
    
    // Set up real-time subscriptions
    const stallsChannel = supabase
      .channel('stalls-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stalls' }, () => {
        fetchStalls();
        setMapRefreshTrigger(prev => prev + 1);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tenants' }, () => {
        fetchTenants();
        setMapRefreshTrigger(prev => prev + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(stallsChannel);
    };
  }, []);

  const fetchStalls = async () => {
    try {
      const { data, error } = await supabase
        .from("stalls")
        .select("*")
        .order("stall_code");

      if (error) throw error;
      setStalls(data || []);
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

  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase
        .from("tenants")
        .select("stall_number, business_name")
        .eq("status", "active");

      if (error) throw error;
      setTenants(data || []);
    } catch (error: any) {
      console.error("Error fetching tenants:", error);
    }
  };

  const getTenantName = (stallCode: string): string | undefined => {
    const tenant = tenants.find(t => t.stall_number === stallCode);
    return tenant?.business_name;
  };

  const filteredStalls = stalls.filter(stall =>
    stall.stall_code.includes(searchTerm) ||
    stall.floor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getTenantName(stall.stall_code)?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditStall = (stall: Stall) => {
    setSelectedStall(stall);
    setSelectedStallFromMap(stall.stall_code);
    setIsEditDialogOpen(true);
  };

  const handleStallSelectFromMap = (stallCode: string, stallData: any) => {
    const stall = stalls.find(s => s.stall_code === stallCode);
    if (stall) {
      handleEditStall(stall);
    }
  };

  const isPointInPolygon = (x: number, y: number, points: string): boolean => {
    const coords = points.split(' ').map(pair => {
      const [px, py] = pair.split(',').map(Number);
      return { x: px, y: py };
    });

    let inside = false;
    for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
      const xi = coords[i].x, yi = coords[i].y;
      const xj = coords[j].x, yj = coords[j].y;

      const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const isPointInRect = (x: number, y: number, rx: number, ry: number, width: number, height: number): boolean => {
    return x >= rx && x <= rx + width && y >= ry && y <= ry + height;
  };

  const handleSecondFloorClick = (x: number, y: number) => {
    const stallIdMap = [
      { id: 'Super Market', points: '50,50 200,50 200,300 50,300' },
      { id: 'c18', points: '50,320 200,320 200,450 50,450' },
      { id: 'c17', points: '220,50 370,50 370,180 220,180' },
      { id: 'c16', points: '220,200 370,200 370,330 220,330' },
      { id: 'c1', points: '390,50 540,50 540,280 390,280' },
      { id: 'c15', rect: { x: 220, y: 350, width: 320, height: 200 } },
      { id: 'c2', rect: { x: 390, y: 300, width: 150, height: 30 } },
      { id: 'c19', rect: { x: 50, y: 470, width: 150, height: 100 } },
      { id: 'c12', rect: { x: 560, y: 50, width: 70, height: 50 } },
      { id: 'c11', rect: { x: 640, y: 50, width: 70, height: 50 } },
      { id: 'c13', rect: { x: 720, y: 50, width: 70, height: 50 } },
      { id: 'c14', rect: { x: 560, y: 110, width: 70, height: 50 } },
      { id: 'c10', rect: { x: 640, y: 110, width: 70, height: 50 } },
      { id: 'c6', rect: { x: 720, y: 110, width: 70, height: 50 } },
      { id: 'c5', rect: { x: 560, y: 170, width: 70, height: 50 } },
      { id: 'c9', rect: { x: 640, y: 170, width: 70, height: 50 } },
      { id: 'c4', rect: { x: 720, y: 170, width: 70, height: 50 } },
      { id: 'c8', rect: { x: 560, y: 230, width: 70, height: 50 } },
      { id: 'c3', rect: { x: 640, y: 230, width: 70, height: 50 } },
      { id: 'c7', rect: { x: 720, y: 230, width: 70, height: 50 } },
    ];

    for (const stall of stallIdMap) {
      let isInside = false;
      
      if (stall.points) {
        isInside = isPointInPolygon(x, y, stall.points);
      } else if (stall.rect) {
        const { x: rx, y: ry, width, height } = stall.rect;
        isInside = isPointInRect(x, y, rx, ry, width, height);
      }

      if (isInside) {
        const foundStall = stalls.find(s => s.stall_code === stall.id);
        if (foundStall) {
          handleEditStall(foundStall);
        } else {
          toast({
            title: "Stall Not Found",
            description: `Stall ${stall.id} does not exist in the database`,
            variant: "destructive",
          });
        }
        break;
      }
    }
  };

  const handleUpdateStall = async () => {
    if (!selectedStall) return;

    try {
      const { error } = await supabase
        .from("stalls")
        .update({
          monthly_rent: selectedStall.monthly_rent,
          electricity_reader: selectedStall.electricity_reader,
          floor_size: selectedStall.floor_size,
        })
        .eq("id", selectedStall.id);

      if (error) throw error;

      toast({
        title: "Stall Updated",
        description: "Stall information has been successfully updated",
      });
      
      setIsEditDialogOpen(false);
      setSelectedStall(null);
      fetchStalls();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading stalls...</p>
        </div>
      </DashboardLayout>
    );
  }

  const occupiedStalls = stalls.filter(s => s.occupancy_status === "occupied").length;
  const vacantStalls = stalls.filter(s => s.occupancy_status === "vacant").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Stall Management</h2>
            <p className="text-muted-foreground mt-2">
              Manage all stalls and their occupancy status
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Home className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Stalls</p>
                  <p className="text-2xl font-bold">{stalls.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-status-occupied rounded"></div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Occupied</p>
                  <p className="text-2xl font-bold">{occupiedStalls}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-status-vacant rounded"></div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Available</p>
                  <p className="text-2xl font-bold">{vacantStalls}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Home className="h-5 w-5" />
                  <span>All Stalls</span>
                </CardTitle>
                <CardDescription>
                  Occupancy rate: {stalls.length > 0 ? ((occupiedStalls / stalls.length) * 100).toFixed(1) : 0}%
                </CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search stalls..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stall Code</TableHead>
                  <TableHead>Floor</TableHead>
                  <TableHead>Monthly Rent</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Occupancy</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStalls.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No stalls found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStalls.map((stall) => (
                    <TableRow key={stall.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <span>Stall {stall.stall_code}</span>
                          {stall.image_url && (
                            <ImageIcon className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{stall.floor}</TableCell>
                      <TableCell>₱{stall.monthly_rent.toLocaleString()}</TableCell>
                      <TableCell>{stall.floor_size || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant="default"
                          className={stall.occupancy_status === "occupied" 
                            ? "bg-status-occupied text-white" 
                            : "bg-status-vacant text-white"
                          }
                        >
                          {stall.occupancy_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getTenantName(stall.stall_code) || "-"}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditStall(stall)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Home className="h-5 w-5" />
              <span>Second Floor Map</span>
            </CardTitle>
            <CardDescription>
              Click on stalls to view and edit their details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <svg
                viewBox="0 0 800 600"
                className="w-full max-w-4xl border rounded-lg bg-background"
                onClick={(e) => {
                  const svg = e.currentTarget;
                  const pt = svg.createSVGPoint();
                  pt.x = e.clientX;
                  pt.y = e.clientY;
                  const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());
                  handleSecondFloorClick(svgP.x, svgP.y);
                }}
              >
                <image href="/src/assets/second-floor.svg" width="800" height="600" opacity="0.3" />
                
                {/* Large polygon on left - Super Market */}
                <polygon points="50,50 200,50 200,300 50,300" fill="transparent" stroke="currentColor" strokeWidth="2" className="cursor-pointer hover:fill-primary/20" />
                <text x="125" y="175" textAnchor="middle" className="fill-foreground text-sm font-semibold pointer-events-none">Super Market</text>
                
                {/* Polygon below Super Market - c18 */}
                <polygon points="50,320 200,320 200,450 50,450" fill="transparent" stroke="currentColor" strokeWidth="2" className="cursor-pointer hover:fill-primary/20" />
                <text x="125" y="385" textAnchor="middle" className="fill-foreground text-sm font-semibold pointer-events-none">c18</text>
                
                {/* Polygon diagonal - c17 */}
                <polygon points="220,50 370,50 370,180 220,180" fill="transparent" stroke="currentColor" strokeWidth="2" className="cursor-pointer hover:fill-primary/20" />
                <text x="295" y="115" textAnchor="middle" className="fill-foreground text-sm font-semibold pointer-events-none">c17</text>
                
                {/* Polygon middle - c16 */}
                <polygon points="220,200 370,200 370,330 220,330" fill="transparent" stroke="currentColor" strokeWidth="2" className="cursor-pointer hover:fill-primary/20" />
                <text x="295" y="265" textAnchor="middle" className="fill-foreground text-sm font-semibold pointer-events-none">c16</text>
                
                {/* Polygon right side - c1 */}
                <polygon points="390,50 540,50 540,280 390,280" fill="transparent" stroke="currentColor" strokeWidth="2" className="cursor-pointer hover:fill-primary/20" />
                <text x="465" y="165" textAnchor="middle" className="fill-foreground text-sm font-semibold pointer-events-none">c1</text>
                
                {/* Large rectangle - c15 */}
                <rect x="220" y="350" width="320" height="200" fill="transparent" stroke="currentColor" strokeWidth="2" className="cursor-pointer hover:fill-primary/20" />
                <text x="380" y="450" textAnchor="middle" className="fill-foreground text-sm font-semibold pointer-events-none">c15</text>
                
                {/* Rectangle bottom middle - c2 */}
                <rect x="390" y="300" width="150" height="30" fill="transparent" stroke="currentColor" strokeWidth="2" className="cursor-pointer hover:fill-primary/20" />
                <text x="465" y="320" textAnchor="middle" className="fill-foreground text-xs font-semibold pointer-events-none">c2</text>
                
                {/* Rectangle left tall - c19 */}
                <rect x="50" y="470" width="150" height="100" fill="transparent" stroke="currentColor" strokeWidth="2" className="cursor-pointer hover:fill-primary/20" />
                <text x="125" y="525" textAnchor="middle" className="fill-foreground text-sm font-semibold pointer-events-none">c19</text>
                
                {/* Small rectangles - Top row */}
                <rect x="560" y="50" width="70" height="50" fill="transparent" stroke="currentColor" strokeWidth="2" className="cursor-pointer hover:fill-primary/20" />
                <text x="595" y="80" textAnchor="middle" className="fill-foreground text-xs font-semibold pointer-events-none">c12</text>
                
                <rect x="640" y="50" width="70" height="50" fill="transparent" stroke="currentColor" strokeWidth="2" className="cursor-pointer hover:fill-primary/20" />
                <text x="675" y="80" textAnchor="middle" className="fill-foreground text-xs font-semibold pointer-events-none">c11</text>
                
                <rect x="720" y="50" width="70" height="50" fill="transparent" stroke="currentColor" strokeWidth="2" className="cursor-pointer hover:fill-primary/20" />
                <text x="755" y="80" textAnchor="middle" className="fill-foreground text-xs font-semibold pointer-events-none">c13</text>
                
                {/* Small rectangles - Second row */}
                <rect x="560" y="110" width="70" height="50" fill="transparent" stroke="currentColor" strokeWidth="2" className="cursor-pointer hover:fill-primary/20" />
                <text x="595" y="140" textAnchor="middle" className="fill-foreground text-xs font-semibold pointer-events-none">c14</text>
                
                <rect x="640" y="110" width="70" height="50" fill="transparent" stroke="currentColor" strokeWidth="2" className="cursor-pointer hover:fill-primary/20" />
                <text x="675" y="140" textAnchor="middle" className="fill-foreground text-xs font-semibold pointer-events-none">c10</text>
                
                <rect x="720" y="110" width="70" height="50" fill="transparent" stroke="currentColor" strokeWidth="2" className="cursor-pointer hover:fill-primary/20" />
                <text x="755" y="140" textAnchor="middle" className="fill-foreground text-xs font-semibold pointer-events-none">c6</text>
                
                {/* Small rectangles - Third row */}
                <rect x="560" y="170" width="70" height="50" fill="transparent" stroke="currentColor" strokeWidth="2" className="cursor-pointer hover:fill-primary/20" />
                <text x="595" y="200" textAnchor="middle" className="fill-foreground text-xs font-semibold pointer-events-none">c5</text>
                
                <rect x="640" y="170" width="70" height="50" fill="transparent" stroke="currentColor" strokeWidth="2" className="cursor-pointer hover:fill-primary/20" />
                <text x="675" y="200" textAnchor="middle" className="fill-foreground text-xs font-semibold pointer-events-none">c9</text>
                
                <rect x="720" y="170" width="70" height="50" fill="transparent" stroke="currentColor" strokeWidth="2" className="cursor-pointer hover:fill-primary/20" />
                <text x="755" y="200" textAnchor="middle" className="fill-foreground text-xs font-semibold pointer-events-none">c4</text>
                
                {/* Small rectangles - Fourth row */}
                <rect x="560" y="230" width="70" height="50" fill="transparent" stroke="currentColor" strokeWidth="2" className="cursor-pointer hover:fill-primary/20" />
                <text x="595" y="260" textAnchor="middle" className="fill-foreground text-xs font-semibold pointer-events-none">c8</text>
                
                <rect x="640" y="230" width="70" height="50" fill="transparent" stroke="currentColor" strokeWidth="2" className="cursor-pointer hover:fill-primary/20" />
                <text x="675" y="260" textAnchor="middle" className="fill-foreground text-xs font-semibold pointer-events-none">c3</text>
                
                <rect x="720" y="230" width="70" height="50" fill="transparent" stroke="currentColor" strokeWidth="2" className="cursor-pointer hover:fill-primary/20" />
                <text x="755" y="260" textAnchor="middle" className="fill-foreground text-xs font-semibold pointer-events-none">c7</text>
              </svg>
            </div>
          </CardContent>
        </Card>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Stall Information</DialogTitle>
              <DialogDescription>
                Update stall details and rental information
              </DialogDescription>
            </DialogHeader>
            {selectedStall && (
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="stall-rate">Monthly Rent (₱)</Label>
                  <Input 
                    id="stall-rate" 
                    type="number"
                    value={selectedStall.monthly_rent}
                    onChange={(e) => setSelectedStall({...selectedStall, monthly_rent: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="electricity-reader">Electricity Reader</Label>
                  <Input 
                    id="electricity-reader" 
                    value={selectedStall.electricity_reader || ""}
                    onChange={(e) => setSelectedStall({...selectedStall, electricity_reader: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="floor-size">Floor Size</Label>
                  <Input 
                    id="floor-size" 
                    value={selectedStall.floor_size || ""}
                    onChange={(e) => setSelectedStall({...selectedStall, floor_size: e.target.value})}
                  />
                </div>
                <Button onClick={handleUpdateStall} className="w-full">
                  Update Stall
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default StallsPage;