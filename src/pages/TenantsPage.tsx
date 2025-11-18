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
import { Plus, Search, Edit, Users, Map } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { StallSelectionMap } from "@/components/StallSelectionMap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Tenant {
  id: string;
  business_name: string;
  contact_person: string;
  email: string | null;
  phone: string | null;
  stall_number: string | null;
  status: string | null;
  monthly_rent: number | null;
  lease_start_date: string | null;
  lease_end_date: string | null;
}

interface Stall {
  id: string;
  stall_code: string;
  floor: string;
  occupancy_status: string;
}

const TenantsPage = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [availableStalls, setAvailableStalls] = useState<Stall[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStallFromMap, setSelectedStallFromMap] = useState<{ code: string; data: any } | null>(null);
  
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
    fetchTenants();
    fetchAvailableStalls();
    
    // Set up real-time subscriptions
    const tenantsChannel = supabase
      .channel('tenants-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tenants' }, () => {
        fetchTenants();
        fetchAvailableStalls();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stalls' }, () => {
        fetchAvailableStalls();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tenantsChannel);
    };
  }, []);

  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTenants(data || []);
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

  const fetchAvailableStalls = async () => {
    try {
      const { data, error } = await supabase
        .from("stalls")
        .select("id, stall_code, floor, occupancy_status")
        .eq("occupancy_status", "vacant")
        .order("stall_code");

      if (error) throw error;
      setAvailableStalls(data || []);
    } catch (error: any) {
      console.error("Error fetching stalls:", error);
    }
  };

  const filteredTenants = tenants.filter(tenant =>
    tenant.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tenant.stall_number && tenant.stall_number.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddTenant = async () => {
    try {
      const { data, error } = await supabase
        .from("tenants")
        .insert([{
          business_name: newTenant.business_name,
          contact_person: newTenant.contact_person,
          email: newTenant.email || null,
          phone: newTenant.phone || null,
          stall_number: newTenant.stall_number || null,
          status: "active",
          monthly_rent: newTenant.monthly_rent ? parseFloat(newTenant.monthly_rent) : null,
          lease_start_date: newTenant.lease_start_date || null,
          lease_end_date: newTenant.lease_end_date || null,
        }])
        .select();

      if (error) throw error;

      // Update stall occupancy status
      if (newTenant.stall_number) {
        await supabase
          .from("stalls")
          .update({ occupancy_status: "occupied" })
          .eq("stall_code", newTenant.stall_number);
      }

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
      
      fetchTenants();
      fetchAvailableStalls();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditTenant = async () => {
    if (!selectedTenant) return;

    try {
      const { error } = await supabase
        .from("tenants")
        .update({
          business_name: selectedTenant.business_name,
          contact_person: selectedTenant.contact_person,
          email: selectedTenant.email,
          phone: selectedTenant.phone,
          monthly_rent: selectedTenant.monthly_rent,
          lease_start_date: selectedTenant.lease_start_date,
          lease_end_date: selectedTenant.lease_end_date,
        })
        .eq("id", selectedTenant.id);

      if (error) throw error;

      toast({
        title: "Tenant Updated",
        description: "Tenant information has been successfully updated",
      });
      
      setIsEditDialogOpen(false);
      setSelectedTenant(null);
      fetchTenants();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleTenantStatus = async (tenant: Tenant) => {
    try {
      const newStatus = tenant.status === "active" ? "inactive" : "active";
      
      const { error } = await supabase
        .from("tenants")
        .update({ status: newStatus })
        .eq("id", tenant.id);

      if (error) throw error;

      // If deactivating and tenant has a stall, free up the stall
      if (newStatus === "inactive" && tenant.stall_number) {
        await supabase
          .from("stalls")
          .update({ occupancy_status: "vacant" })
          .eq("stall_code", tenant.stall_number);
      }

      toast({
        title: "Status Updated",
        description: `Tenant status changed to ${newStatus}`,
      });
      
      fetchTenants();
      fetchAvailableStalls();
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
          <p className="text-muted-foreground">Loading tenants...</p>
        </div>
      </DashboardLayout>
    );
  }

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
                  <TableHead>Business Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Stall</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTenants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No tenants found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell className="font-medium">{tenant.business_name}</TableCell>
                      <TableCell>{tenant.contact_person}</TableCell>
                      <TableCell>{tenant.phone || "-"}</TableCell>
                      <TableCell>{tenant.stall_number || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={tenant.status === "active" ? "default" : "secondary"}
                          className={tenant.status === "active" ? "bg-status-active text-white" : "bg-status-inactive text-white"}
                        >
                          {tenant.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedTenant(tenant);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant={tenant.status === "active" ? "destructive" : "default"}
                          size="sm"
                          onClick={() => toggleTenantStatus(tenant)}
                        >
                          {tenant.status === "active" ? "Deactivate" : "Activate"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
                  <Label htmlFor="edit-phone">Phone Number</Label>
                  <Input 
                    id="edit-phone" 
                    value={selectedTenant.phone || ""}
                    onChange={(e) => setSelectedTenant({...selectedTenant, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-monthly-rent">Monthly Rent (₱)</Label>
                  <Input 
                    id="edit-monthly-rent" 
                    type="number"
                    value={selectedTenant.monthly_rent || ""}
                    onChange={(e) => setSelectedTenant({...selectedTenant, monthly_rent: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lease-start">Lease Start Date</Label>
                  <Input 
                    id="edit-lease-start" 
                    type="date"
                    value={selectedTenant.lease_start_date || ""}
                    onChange={(e) => setSelectedTenant({...selectedTenant, lease_start_date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lease-end">Lease End Date</Label>
                  <Input 
                    id="edit-lease-end" 
                    type="date"
                    value={selectedTenant.lease_end_date || ""}
                    onChange={(e) => setSelectedTenant({...selectedTenant, lease_end_date: e.target.value})}
                  />
                </div>
                <Button onClick={handleEditTenant} className="w-full">
                  Update Tenant
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default TenantsPage;