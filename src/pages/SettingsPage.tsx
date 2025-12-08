import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/authService";
import { appSettingsService } from "@/services/appSettingsService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Building2, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const SettingsPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch user profile
  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const { user } = await authService.getSession();
      return user;
    },
  });

  const [profileData, setProfileData] = useState({
    full_name: "",
    email: "",
  });

  React.useEffect(() => {
    if (user) {
      setProfileData({
        full_name: "",
        email: user.email || "",
      });
    }
  }, [user]);

  // Fetch app settings
  const { data: appSettings } = useQuery({
    queryKey: ["app_settings"],
    queryFn: () => appSettingsService.getAll(),
  });

  const [propertyName, setPropertyName] = useState("");

  React.useEffect(() => {
    const setting = appSettings?.find((s) => s.key === "property_name");
    if (setting && setting.value && typeof setting.value === 'object' && 'name' in setting.value) {
      setPropertyName((setting.value as any).name || "");
    }
  }, [appSettings]);

  // Update app settings mutation
  const updateAppSettings = useMutation({
    mutationFn: async (name: string) => {
      const existingSetting = appSettings?.find((s) => s.key === "property_name");
      
      if (existingSetting) {
        return appSettingsService.update(existingSetting.id, {
          value: { name },
        });
      } else {
        return appSettingsService.create({
          key: "property_name",
          value: { name },
          description: "Property management system name",
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app_settings"] });
      toast({
        title: "Settings updated",
        description: "Application settings have been successfully updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update settings: " + (error as Error).message,
        variant: "destructive",
      });
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Profile",
      description: "Profile updates are managed through Directus",
    });
  };

  const handleAppSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateAppSettings.mutate(propertyName);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account and application preferences</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="app">
              <Building2 className="h-4 w-4 mr-2" />
              Application
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Your profile is managed through Directus
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">
                      Email is managed through Directus
                    </p>
                  </div>

                  <Separator />

                  <p className="text-sm text-muted-foreground">
                    To update your profile, please access the Directus admin panel.
                  </p>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="app" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Application Settings</CardTitle>
                <CardDescription>
                  Configure your property management system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAppSettingsSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="property_name">Property Name</Label>
                    <Input
                      id="property_name"
                      placeholder="Enter property name"
                      value={propertyName}
                      onChange={(e) => setPropertyName(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      This name will appear throughout the application
                    </p>
                  </div>

                  <Separator />

                  <Button type="submit">Save Settings</Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
                <CardDescription>
                  View system status and information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Version:</span>
                    <span className="font-medium">1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Backend:</span>
                    <span className="font-medium">Directus</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-medium text-green-600">Active</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
