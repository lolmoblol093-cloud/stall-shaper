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
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Edit, Users, Map, Trash2, UserPlus, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StallSelectionMap } from "@/components/StallSelectionMap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CreateTenantAccountDialog } from "@/components/CreateTenantAccountDialog";
import { ResetTenantPasswordDialog } from "@/components/ResetTenantPasswordDialog";
import {
  mockTenants,
  mockStalls,
  addTenant,
  updateTenant,
  deleteTenant,
  Tenant,
  Stall,
} from "@/data/mockData";

const TenantsPage = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>(mockTenants);
  const [availableStalls, setAvailableStalls] = useState<Stall[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedStallFromMap, setSelectedStallFromMap] = useState<{ code: string; data: any } | null>(null);
  const [mapRefreshTrigger, setMapRefreshTrigger] = useState(0);
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [tenantForAccount, setTenantForAccount] = useState<Tenant | null>(null);
  const [isCreateAccountDialogOpen, setIsCreateAccountDialogOpen] = useState(false);
  const [tenantForPasswordReset, setTenantForPasswordReset] = useState<Tenant | null>(null);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  
  const [newTenant, setNewTenant] = useState({
    business_name: "",
    contact_person: "",
    email: "",
    phone: "",
    stall_number: "",
    monthly_rent: "",
    lease_start_date: "",
    lease_end_date: "",
  });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setTenants([...mockTenants]);
    setAvailableStalls(mockStalls.filter(s => s.occupancy_status === 'vacant'));
  };

  const filteredTenants = tenants.filter(tenant =>
    tenant.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tenant.stall_number && tenant.stall_number.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddTenant = () => {
    if (!newTenant.business_name || !newTenant.contact_person) {
      toast({
        title: "Error",
        description: "Business name and contact person are required",
        variant: "destructive",
      });
      return;
    }

    addTenant({
      business_name: newTenant.business_name,
      contact_person: newTenant.contact_person,
      email: newTenant.email || null,
      phone: newTenant.phone || null,
      stall_number: newTenant.stall_number || null,
      status: "active",
      monthly_rent: newTenant.monthly_rent ? parseFloat(newTenant.monthly_rent) : null,
      lease_start_date: newTenant.lease_start_date || null,
      lease_end_date: newTenant.lease_end_date || null,
    });

    toast({
      title: "Tenant Added",
      description: "New tenant has been successfully registered",
    });
    
    setIsAddDialogOpen(false);
    setNewTenant({
      business_name: "",
      contact_person: "",
      email: "",
      phone: "",
      stall_number: "",
      monthly_rent: "",
      lease_start_date: "",
      lease_end_date: "",
    });
    setSelectedStallFromMap(null);
    refreshData();
    setMapRefreshTrigger(prev => prev + 1);
  };

  const handleEditTenant = () => {
    if (!selectedTenant) return;

    updateTenant(selectedTenant.id, {
      business_name: selectedTenant.business_name,
      contact_person: selectedTenant.contact_person,
      email: selectedTenant.email,
      phone: selectedTenant.phone,
      monthly_rent: selectedTenant.monthly_rent,
      lease_start_date: selectedTenant.lease_start_date,
      lease_end_date: selectedTenant.lease_end_date,
    });

    toast({
      title: "Tenant Updated",
      description: "Tenant information has been successfully updated",
    });
    
    setIsEditDialogOpen(false);
    setSelectedTenant(null);
    refreshData();
  };

  const toggleTenantStatus = (tenant: Tenant) => {
    const newStatus = tenant.status === "active" ? "inactive" : "active";
    updateTenant(tenant.id, { status: newStatus });

    toast({
      title: "Status Updated",
      description: `Tenant status changed to ${newStatus}`,
    });
    
    refreshData();
    setMapRefreshTrigger(prev => prev + 1);
  };

  const handleDeleteTenant = () => {
    if (!tenantToDelete) return;

    deleteTenant(tenantToDelete.id);

    toast({
      title: "Tenant Deleted",
      description: "Tenant has been successfully deleted",
    });
    
    setIsDeleteDialogOpen(false);
    setTenantToDelete(null);
    refreshData();
    setMapRefreshTrigger(prev => prev + 1);
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
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Tenant</DialogTitle>
                <DialogDescription>
                  Enter tenant details and select a stall from the map or dropdown
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="form" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="form">Tenant Details</TabsTrigger>
                  <TabsTrigger value="map">
                    <Map className="h-4 w-4 mr-2" />
                    Select from Map
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="form" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="business-name">Business Name *</Label>
                    <Input 
                      id="business-name" 
                      placeholder="Enter business name"
                      value={newTenant.business_name}
                      onChange={(e) => setNewTenant({...newTenant, business_name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-person">Contact Person *</Label>
                    <Input 
                      id="contact-person" 
                      placeholder="Enter contact person name"
                      value={newTenant.contact_person}
                      onChange={(e) => setNewTenant({...newTenant, contact_person: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email"
                      placeholder="email@example.com"
                      value={newTenant.email}
                      onChange={(e) => setNewTenant({...newTenant, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      placeholder="+63 XXX XXX XXXX"
                      value={newTenant.phone}
                      onChange={(e) => setNewTenant({...newTenant, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stall">Available Stall</Label>
                    <Select 
                      value={newTenant.stall_number} 
                      onValueChange={(value) => {
                        setNewTenant({...newTenant, stall_number: value});
                        const stall = availableStalls.find(s => s.stall_code === value);
                        if (stall) {
                          setSelectedStallFromMap({ code: value, data: stall });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select available stall or use map" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStalls.map((stall) => (
                          <SelectItem key={stall.id} value={stall.stall_code}>
                            Stall {stall.stall_code} ({stall.floor})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedStallFromMap && (
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Map className="h-4 w-4" />
                        Selected: Stall {selectedStallFromMap.code}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthly-rent">Monthly Rent (₱)</Label>
                    <Input 
                      id="monthly-rent" 
                      type="number"
                      placeholder="2500"
                      value={newTenant.monthly_rent}
                      onChange={(e) => setNewTenant({...newTenant, monthly_rent: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lease-start">Lease Start Date</Label>
                    <Input 
                      id="lease-start" 
                      type="date"
                      value={newTenant.lease_start_date}
                      onChange={(e) => setNewTenant({...newTenant, lease_start_date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lease-end">Lease End Date</Label>
                    <Input 
                      id="lease-end" 
                      type="date"
                      value={newTenant.lease_end_date}
                      onChange={(e) => setNewTenant({...newTenant, lease_end_date: e.target.value})}
                    />
                  </div>
                  <Button onClick={handleAddTenant} className="w-full">
                    Add Tenant
                  </Button>
                </TabsContent>
                
                <TabsContent value="map" className="pt-4">
                  <StallSelectionMap 
                    selectedStallCode={newTenant.stall_number || null}
                    onStallSelect={(stallCode, stallData) => {
                      setNewTenant({
                        ...newTenant, 
                        stall_number: stallCode,
                        monthly_rent: stallData.monthly_rent?.toString() || ""
                      });
                      setSelectedStallFromMap({ code: stallCode, data: stallData });
                    }}
                    refreshTrigger={mapRefreshTrigger}
                  />
                  <div className="mt-4">
                    <Button onClick={handleAddTenant} className="w-full" disabled={!newTenant.business_name || !newTenant.contact_person || !newTenant.stall_number}>
                      Add Tenant
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
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
                  {tenants.filter(t => t.status === 'active').length} active tenants
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
                  <TableHead>Business Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Stall</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTenants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No tenants found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell className="font-medium">{tenant.business_name}</TableCell>
                      <TableCell>{tenant.contact_person}</TableCell>
                      <TableCell>{tenant.email || "-"}</TableCell>
                      <TableCell>{tenant.phone || "-"}</TableCell>
                      <TableCell>{tenant.stall_number || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={tenant.status === "active" 
                            ? "bg-green-500/10 text-green-600 border-green-500/20" 
                            : "bg-red-500/10 text-red-600 border-red-500/20"
                          }
                        >
                          {tenant.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedTenant(tenant);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleTenantStatus(tenant)}
                          >
                            {tenant.status === "active" ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setTenantForAccount(tenant);
                              setIsCreateAccountDialogOpen(true);
                            }}
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setTenantForPasswordReset(tenant);
                              setIsResetPasswordDialogOpen(true);
                            }}
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive"
                            onClick={() => {
                              setTenantToDelete(tenant);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Tenant</DialogTitle>
              <DialogDescription>
                Update tenant information
              </DialogDescription>
            </DialogHeader>
            {selectedTenant && (
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-business-name">Business Name</Label>
                  <Input 
                    id="edit-business-name" 
                    value={selectedTenant.business_name}
                    onChange={(e) => setSelectedTenant({...selectedTenant, business_name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-contact-person">Contact Person</Label>
                  <Input 
                    id="edit-contact-person" 
                    value={selectedTenant.contact_person}
                    onChange={(e) => setSelectedTenant({...selectedTenant, contact_person: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input 
                    id="edit-email" 
                    type="email"
                    value={selectedTenant.email || ""}
                    onChange={(e) => setSelectedTenant({...selectedTenant, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input 
                    id="edit-phone" 
                    value={selectedTenant.phone || ""}
                    onChange={(e) => setSelectedTenant({...selectedTenant, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-rent">Monthly Rent (₱)</Label>
                  <Input 
                    id="edit-rent" 
                    type="number"
                    value={selectedTenant.monthly_rent || ""}
                    onChange={(e) => setSelectedTenant({...selectedTenant, monthly_rent: parseFloat(e.target.value)})}
                  />
                </div>
                <Button onClick={handleEditTenant} className="w-full">
                  Update Tenant
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Tenant</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {tenantToDelete?.business_name}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteTenant} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Create Account Dialog */}
        <CreateTenantAccountDialog
          tenant={tenantForAccount}
          open={isCreateAccountDialogOpen}
          onOpenChange={setIsCreateAccountDialogOpen}
          onAccountCreated={refreshData}
        />

        {/* Reset Password Dialog */}
        <ResetTenantPasswordDialog
          tenant={tenantForPasswordReset}
          open={isResetPasswordDialogOpen}
          onOpenChange={setIsResetPasswordDialogOpen}
        />
      </div>
    </DashboardLayout>
  );
};

export default TenantsPage;
