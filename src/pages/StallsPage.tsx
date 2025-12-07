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
import { StallSelectionMap } from "@/components/StallSelectionMap";
import stallService from "@/services/stallService";
import tenantService from "@/services/tenantService";

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
  }, []);

  const fetchStalls = async () => {
    try {
      const data = await stallService.getAll();
      setStalls(data as Stall[]);
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
      const data = await tenantService.getActive();
      setTenants(data.map(t => ({ stall_number: t.stall_number, business_name: t.business_name })));
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

  const handleUpdateStall = async () => {
    if (!selectedStall) return;

    try {
      await stallService.update(selectedStall.id, {
        monthly_rent: selectedStall.monthly_rent,
        floor_size: selectedStall.floor_size,
      });

      toast({
        title: "Stall Updated",
        description: "Stall information has been successfully updated",
      });
      
      setIsEditDialogOpen(false);
      setSelectedStall(null);
      setMapRefreshTrigger(prev => prev + 1);
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
              <span>Visual Stall Selection</span>
            </CardTitle>
            <CardDescription>
              Click on a stall in the map to view and edit its details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StallSelectionMap
              onStallSelect={handleStallSelectFromMap}
              selectedStallCode={selectedStallFromMap}
              refreshTrigger={mapRefreshTrigger}
            />
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
