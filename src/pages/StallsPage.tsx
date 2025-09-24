import React, { useState } from "react";
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
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Home, Search, Edit, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Stall {
  id: number;
  stallCode: string;
  floor: string;
  monthlyRent: number;
  electricityReader: string;
  floorSize: string;
  occupancyStatus: "occupied" | "vacant";
  tenantName?: string;
  hasImage: boolean;
}

const StallsPage = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedStall, setSelectedStall] = useState<Stall | null>(null);
  
  // Mock data - in real app this would come from an API
  const [stalls, setStalls] = useState<Stall[]>([
    {
      id: 1,
      stallCode: "12",
      floor: "Ground Floor",
      monthlyRent: 2500,
      electricityReader: "ERD001",
      floorSize: "3m × 4m",
      occupancyStatus: "occupied",
      tenantName: "Maria Santos",
      hasImage: true
    },
    {
      id: 2,
      stallCode: "5",
      floor: "Ground Floor",
      monthlyRent: 2800,
      electricityReader: "ERD005",
      floorSize: "4m × 4m",
      occupancyStatus: "occupied",
      tenantName: "Juan Cruz",
      hasImage: false
    },
    {
      id: 3,
      stallCode: "7",
      floor: "Ground Floor",
      monthlyRent: 2200,
      electricityReader: "ERD007",
      floorSize: "3m × 3m",
      occupancyStatus: "vacant",
      hasImage: false
    },
    {
      id: 4,
      stallCode: "18",
      floor: "Second Floor",
      monthlyRent: 2000,
      electricityReader: "ERD018",
      floorSize: "3m × 4m",
      occupancyStatus: "occupied",
      tenantName: "Ana Reyes",
      hasImage: true
    },
    {
      id: 5,
      stallCode: "15",
      floor: "Second Floor",
      monthlyRent: 1800,
      electricityReader: "ERD015",
      floorSize: "2.5m × 3m",
      occupancyStatus: "vacant",
      hasImage: false
    }
  ]);

  const filteredStalls = stalls.filter(stall =>
    stall.stallCode.includes(searchTerm) ||
    stall.floor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stall.tenantName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditStall = (stall: Stall) => {
    setSelectedStall(stall);
    setIsEditDialogOpen(true);
  };

  const handleUpdateStall = () => {
    toast({
      title: "Stall Updated",
      description: "Stall information has been successfully updated",
    });
    setIsEditDialogOpen(false);
    setSelectedStall(null);
  };

  const occupiedStalls = stalls.filter(s => s.occupancyStatus === "occupied").length;
  const vacantStalls = stalls.filter(s => s.occupancyStatus === "vacant").length;

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
                  Occupancy rate: {((occupiedStalls / stalls.length) * 100).toFixed(1)}%
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
                {filteredStalls.map((stall) => (
                  <TableRow key={stall.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <span>Stall {stall.stallCode}</span>
                        {stall.hasImage && (
                          <ImageIcon className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{stall.floor}</TableCell>
                    <TableCell>₱{stall.monthlyRent.toLocaleString()}</TableCell>
                    <TableCell>{stall.floorSize}</TableCell>
                    <TableCell>
                      <Badge
                        variant="default"
                        className={stall.occupancyStatus === "occupied" 
                          ? "bg-status-occupied text-white" 
                          : "bg-status-vacant text-white"
                        }
                      >
                        {stall.occupancyStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {stall.tenantName || "-"}
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
                ))}
              </TableBody>
            </Table>
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
                    defaultValue={selectedStall.monthlyRent}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="electricity-reader">Electricity Reader</Label>
                  <Input 
                    id="electricity-reader" 
                    defaultValue={selectedStall.electricityReader}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="floor-size">Floor Size</Label>
                  <Input 
                    id="floor-size" 
                    defaultValue={selectedStall.floorSize}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stall-image">Upload Stall Image</Label>
                  <Input id="stall-image" type="file" accept="image/*" />
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