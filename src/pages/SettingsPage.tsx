import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Building2, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { mockProfile, mockAppSettings, updateProfile, updateAppSetting } from "@/data/mockData";

const SettingsPage = () => {
  const { toast } = useToast();
  
  const [profileData, setProfileData] = useState({
    full_name: mockProfile.full_name || "",
    email: mockProfile.email || "",
  });

  const [propertyName, setPropertyName] = useState("");

  useEffect(() => {
    const setting = mockAppSettings.find((s) => s.key === "property_name");
    if (setting && setting.value && typeof setting.value === 'object' && 'name' in setting.value) {
      setPropertyName((setting.value as any).name || "");
    }
  }, []);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      full_name: profileData.full_name,
      email: profileData.email,
    });
    toast({
      title: "Profile updated",
      description: "Your profile has been successfully updated",
    });
  };

  const handleAppSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateAppSetting("property_name", { name: propertyName });
    toast({
      title: "Settings updated",
      description: "Application settings have been successfully updated",
    });
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
                  Update your personal information and contact details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      placeholder="Enter your full name"
                      value={profileData.full_name}
                      onChange={(e) =>
                        setProfileData({ ...profileData, full_name: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={profileData.email}
                      onChange={(e) =>
                        setProfileData({ ...profileData, email: e.target.value })
                      }
                    />
                  </div>

                  <Separator />

                  <Button type="submit">Save Profile</Button>
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
                    <span className="text-muted-foreground">Mode:</span>
                    <span className="font-medium">UI Only (Mock Data)</span>
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
