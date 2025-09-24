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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Edit, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Tenant {
  id: number;
  name: string;
  stallCode: string;
  contactNumber: string;
  address: string;
  meterNo: string;
  status: "active" | "inactive";
  joinDate: string;
}

const TenantsPage = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // Mock data - in real app this would come from an API
  const [tenants, setTenants] = useState<Tenant[]>([
    {
      id: 1,
      name: "Maria Santos",
      stallCode: "12 (Ground Floor)",
      contactNumber: "+63 912 345 6789",
      address: "123 Main St, Quezon City",
      meterNo: "MTR001",
      status: "active",
      joinDate: "2024-01-15"
    },
    {
      id: 2,
      name: "Juan Cruz",
      stallCode: "5 (Ground Floor)", 
      contactNumber: "+63 918 765 4321",
      address: "456 Oak Ave, Manila",
      meterNo: "MTR005",
      status: "active",
      joinDate: "2024-02-01"
    },
    {
      id: 3,
      name: "Ana Reyes",
      stallCode: "18 (Second Floor)",
      contactNumber: "+63 917 555 0123",
      address: "789 Pine St, Makati",
      meterNo: "MTR018",
      status: "inactive",
      joinDate: "2023-11-20"
    }
  ]);

  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.stallCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddTenant = () => {
    toast({
      title: "Tenant Added",
      description: "New tenant has been successfully registered",
    });
    setIsAddDialogOpen(false);
  };

  const toggleTenantStatus = (id: number) => {
    setTenants(prev => prev.map(tenant =>
      tenant.id === id 
        ? { ...tenant, status: tenant.status === "active" ? "inactive" : "active" }
        : tenant
    ));
    toast({
      title: "Status Updated",
      description: "Tenant status has been changed",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Tenant Management</h2>
            <p className="text-muted-foreground mt-2">
              Manage all tenant information and accounts
            </p>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add New Tenant</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Tenant</DialogTitle>
                <DialogDescription>
                  Enter tenant details to register them to an available stall
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="tenant-name">Full Name</Label>
                  <Input id="tenant-name" placeholder="Enter full name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact">Contact Number</Label>
                  <Input id="contact" placeholder="+63 XXX XXX XXXX" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" placeholder="Complete address" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stall">Available Stall</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select available stall" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Stall 7 (Ground Floor)</SelectItem>
                      <SelectItem value="15">Stall 15 (Second Floor)</SelectItem>
                      <SelectItem value="22">Stall 22 (Second Floor)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meter">Meter Number</Label>
                  <Input id="meter" placeholder="MTR###" />
                </div>
                <Button onClick={handleAddTenant} className="w-full">
                  Add Tenant
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>All Tenants</span>
                </CardTitle>
                <CardDescription>
                  Total: {tenants.length} tenants | Active: {tenants.filter(t => t.status === "active").length}
                </CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tenants..."
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
                  <TableHead>Name</TableHead>
                  <TableHead>Stall Code</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Meter No.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell>{tenant.stallCode}</TableCell>
                    <TableCell>{tenant.contactNumber}</TableCell>
                    <TableCell>{tenant.meterNo}</TableCell>
                    <TableCell>
                      <Badge
                        variant={tenant.status === "active" ? "default" : "secondary"}
                        className={tenant.status === "active" ? "bg-status-active text-white" : "bg-status-inactive text-white"}
                      >
                        {tenant.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant={tenant.status === "active" ? "destructive" : "default"}
                        size="sm"
                        onClick={() => toggleTenantStatus(tenant.id)}
                      >
                        {tenant.status === "active" ? "Deactivate" : "Activate"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TenantsPage;