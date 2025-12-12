import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Home, Search, Edit, ImageIcon, MoreVertical, Trash2, UserPlus, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { stallsService, tenantsService } from "@/lib/directusService";
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
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStall, setSelectedStall] = useState<Stall | null>(null);
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStallFromMap, setSelectedStallFromMap] = useState<string | null>(null);
  const [mapRefreshTrigger, setMapRefreshTrigger] = useState(0);
  const [newStall, setNewStall] = useState({
    stall_code: "",
    floor: "Ground Floor",
    monthly_rent: "",
    floor_size: "",
  });

  useEffect(() => {
    fetchStalls();
    fetchTenants();
  }, []);

  const fetchStalls = async () => {
    try {
      const data = await stallsService.getAll();
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
      const data = await tenantsService.getAll();
      const activeTenants = data?.filter((t: any) => t.status === "active") || [];
      setTenants(activeTenants);
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

  const handleViewDetails = (stall: Stall) => {
    setSelectedStall(stall);
    setSelectedStallFromMap(stall.stall_code);
    setIsDetailsDialogOpen(true);
  };

  const handleEditStall = (stall: Stall) => {
    setSelectedStall(stall);
    setSelectedStallFromMap(stall.stall_code);
    setIsDetailsDialogOpen(false);
    setIsEditDialogOpen(true);
  };

  const handleDeleteStall = (stall: Stall) => {
    setSelectedStall(stall);
    setIsDetailsDialogOpen(false);
    setIsDeleteDialogOpen(true);
  };

  const handleAddTenant = (stall: Stall) => {
    setIsDetailsDialogOpen(false);
    navigate("/dashboard/tenants", { state: { openAddTenant: true, stallCode: stall.stall_code } });
  };

  const handleStallSelectFromMap = (stallCode: string, stallData: any) => {
    const stall = stalls.find(s => s.stall_code === stallCode);
    if (stall) {
      handleViewDetails(stall);
    }
  };

  const handleRowClick = (stall: Stall) => {
    if (stall.occupancy_status === "vacant") {
      handleViewDetails(stall);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedStall) return;

    try {
      await stallsService.delete(selectedStall.id);
      toast({
        title: "Stall Deleted",
        description: `Stall ${selectedStall.stall_code} has been deleted`,
      });
      setIsDeleteDialogOpen(false);
      setSelectedStall(null);
      fetchStalls();
      setMapRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddStall = async () => {
    if (!newStall.stall_code || !newStall.monthly_rent) {
      toast({
        title: "Validation Error",
        description: "Stall code and monthly rent are required",
        variant: "destructive",
      });
      return;
    }

    try {
      await stallsService.create({
        stall_code: newStall.stall_code,
        floor: newStall.floor,
        monthly_rent: parseFloat(newStall.monthly_rent),
        floor_size: newStall.floor_size || null,
        occupancy_status: "vacant",
      });

      toast({
        title: "Stall Created",
        description: `Stall ${newStall.stall_code} has been created successfully`,
      });
      
      setIsAddDialogOpen(false);
      setNewStall({
        stall_code: "",
        floor: "Ground Floor",
        monthly_rent: "",
        floor_size: "",
      });
      fetchStalls();
      setMapRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create stall",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStall = async () => {
    if (!selectedStall) return;

    try {
      await stallsService.update(selectedStall.id, {
        monthly_rent: selectedStall.monthly_rent,
        floor_size: selectedStall.floor_size,
      });

      toast({
        title: "Stall Updated",
        description: "Stall information has been successfully updated",
      });
      
      setIsEditDialogOpen(false);
      setSelectedStall(null);
      fetchStalls();
      setMapRefreshTrigger(prev => prev + 1);
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
          <Button onClick={() => setIsAddDialogOpen(true)} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add New Stall</span>
          </Button>
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
                    <TableRow 
                      key={stall.id}
                      className={stall.occupancy_status === "vacant" ? "cursor-pointer hover:bg-muted/50" : ""}
                      onClick={() => handleRowClick(stall)}
                    >
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
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-background border z-50">
                            <DropdownMenuItem onClick={() => handleEditStall(stall)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteStall(stall)} className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                            {stall.occupancy_status === "vacant" && (
                              <DropdownMenuItem onClick={() => handleAddTenant(stall)}>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Add Tenant
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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

        {/* Stall Details Modal */}
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Stall Details</DialogTitle>
              <DialogDescription>
                View stall information
              </DialogDescription>
            </DialogHeader>
            {selectedStall && (
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Stall Code</p>
                    <p className="font-medium">{selectedStall.stall_code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Floor</p>
                    <p className="font-medium">{selectedStall.floor}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Rent</p>
                    <p className="font-medium">₱{selectedStall.monthly_rent.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Floor Size</p>
                    <p className="font-medium">{selectedStall.floor_size || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-muted-foreground">Status:</p>
                  <Badge
                    variant="default"
                    className={selectedStall.occupancy_status === "occupied" 
                      ? "bg-status-occupied text-white" 
                      : "bg-status-vacant text-white"
                    }
                  >
                    {selectedStall.occupancy_status}
                  </Badge>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => handleEditStall(selectedStall)} className="flex-1">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="destructive" onClick={() => handleDeleteStall(selectedStall)} className="flex-1">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                  {selectedStall.occupancy_status === "vacant" && (
                    <Button onClick={() => handleAddTenant(selectedStall)} className="flex-1">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Tenant
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Stall Dialog */}
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

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Stall</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete stall {selectedStall?.stall_code}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Add Stall Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Stall</DialogTitle>
              <DialogDescription>
                Create a new stall in the marketplace
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="stall-code">Stall Code *</Label>
                <Input 
                  id="stall-code" 
                  placeholder="e.g., b87, c20, d55"
                  value={newStall.stall_code}
                  onChange={(e) => setNewStall({...newStall, stall_code: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="floor">Floor *</Label>
                <Select 
                  value={newStall.floor} 
                  onValueChange={(value) => setNewStall({...newStall, floor: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select floor" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    <SelectItem value="Ground Floor">Ground Floor</SelectItem>
                    <SelectItem value="Second Floor">Second Floor</SelectItem>
                    <SelectItem value="Third Floor">Third Floor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-monthly-rent">Monthly Rent (₱) *</Label>
                <Input 
                  id="new-monthly-rent" 
                  type="number"
                  placeholder="e.g., 2500"
                  value={newStall.monthly_rent}
                  onChange={(e) => setNewStall({...newStall, monthly_rent: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-floor-size">Floor Size</Label>
                <Input 
                  id="new-floor-size" 
                  placeholder="e.g., 3x3 sqm"
                  value={newStall.floor_size}
                  onChange={(e) => setNewStall({...newStall, floor_size: e.target.value})}
                />
              </div>
              <Button onClick={handleAddStall} className="w-full">
                Create Stall
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default StallsPage;