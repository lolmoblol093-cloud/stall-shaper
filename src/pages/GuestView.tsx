import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Search, 
  MapPin, 
  Phone, 
  Clock, 
  Star,
  Home,
  Users,
  Mail
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BusinessListing {
  stallCode: string;
  businessName: string;
  ownerName: string;
  businessType: string;
  floor: string;
  description: string;
  contactNumber?: string;
  isAvailable?: boolean;
  rating?: number;
  hours?: string;
}

const GuestView = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"directory" | "available">("directory");

  // Mock data for public directory
  const businesses: BusinessListing[] = [
    {
      stallCode: "1",
      businessName: "Fresh Fruits Stand",
      ownerName: "Roberto Garcia",
      businessType: "Grocery",
      floor: "Ground Floor",
      description: "Fresh tropical fruits, vegetables, and organic produce daily",
      contactNumber: "+63 912 345 6789",
      rating: 4.8,
      hours: "6:00 AM - 6:00 PM"
    },
    {
      stallCode: "2", 
      businessName: "Maria's Bakery",
      ownerName: "Maria Santos",
      businessType: "Food",
      floor: "Ground Floor",
      description: "Freshly baked bread, pastries, and traditional Filipino delicacies",
      contactNumber: "+63 918 765 4321",
      rating: 4.9,
      hours: "5:00 AM - 8:00 PM"
    },
    {
      stallCode: "4",
      businessName: "Tech Accessories Hub",
      ownerName: "Michael Chen",
      businessType: "Electronics", 
      floor: "Ground Floor",
      description: "Mobile accessories, gadgets, repairs, and tech solutions",
      contactNumber: "+63 917 234 5678",
      rating: 4.6,
      hours: "9:00 AM - 8:00 PM"
    },
    {
      stallCode: "8",
      businessName: "Fashion Hub",
      ownerName: "Sarah Lopez",
      businessType: "Clothing",
      floor: "Ground Floor", 
      description: "Trendy clothing, accessories, and fashion items for all ages",
      contactNumber: "+63 919 876 5432",
      rating: 4.7,
      hours: "10:00 AM - 9:00 PM"
    },
    {
      stallCode: "11",
      businessName: "Books & More",
      ownerName: "Professor David Cruz",
      businessType: "Education",
      floor: "Second Floor",
      description: "Books, educational materials, stationery, and school supplies",
      contactNumber: "+63 916 543 2109",
      rating: 4.5,
      hours: "8:00 AM - 7:00 PM"
    }
  ];

  const availableStalls = [
    {
      stallCode: "3",
      floor: "Ground Floor",
      size: "3m × 3m",
      monthlyRent: "₱2,200",
      description: "Prime location near main entrance, perfect for food or retail business"
    },
    {
      stallCode: "6", 
      floor: "Ground Floor",
      size: "4m × 3m",
      monthlyRent: "₱2,800",
      description: "Corner stall with high foot traffic, ideal for electronics or services"
    },
    {
      stallCode: "13",
      floor: "Second Floor", 
      size: "3m × 4m",
      monthlyRent: "₱1,800",
      description: "Spacious stall perfect for clothing, handicrafts, or general merchandise"
    },
    {
      stallCode: "15",
      floor: "Second Floor",
      size: "2.5m × 3m", 
      monthlyRent: "₱1,500",
      description: "Affordable starter space, great for new entrepreneurs"
    }
  ];

  const categories = ["all", "Food", "Grocery", "Electronics", "Clothing", "Education", "Services"];

  const filteredBusinesses = businesses.filter(business => {
    const matchesSearch = !searchTerm || 
      business.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.businessType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || business.businessType === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getBusinessTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      "Food": "bg-orange-500",
      "Grocery": "bg-green-500",
      "Electronics": "bg-blue-500", 
      "Clothing": "bg-purple-500",
      "Education": "bg-indigo-500",
      "Services": "bg-yellow-500"
    };
    return colors[type] || "bg-gray-500";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Marketplace Directory</h1>
                <p className="text-sm text-muted-foreground">Discover local businesses and services</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/login")}
              className="flex items-center space-x-2"
            >
              <Users className="h-4 w-4" />
              <span>Admin Login</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex space-x-1 bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === "directory" ? "default" : "ghost"}
              onClick={() => setViewMode("directory")}
              className="px-6"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Business Directory
            </Button>
            <Button
              variant={viewMode === "available" ? "default" : "ghost"}
              onClick={() => setViewMode("available")}
              className="px-6"
            >
              <Home className="h-4 w-4 mr-2" />
              Available Stalls
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search businesses or services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-80"
            />
          </div>
        </div>

        {viewMode === "directory" && (
          <>
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="capitalize"
                >
                  {category === "all" ? "All Categories" : category}
                </Button>
              ))}
            </div>

            {/* Business Directory */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBusinesses.map((business) => (
                <Card key={business.stallCode} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{business.businessName}</CardTitle>
                        <CardDescription>Stall {business.stallCode} • {business.floor}</CardDescription>
                      </div>
                      <Badge className={`${getBusinessTypeColor(business.businessType)} text-white`}>
                        {business.businessType}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{business.description}</p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>Owner: {business.ownerName}</span>
                      </div>
                      
                      {business.hours && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{business.hours}</span>
                        </div>
                      )}
                      
                      {business.contactNumber && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{business.contactNumber}</span>
                        </div>
                      )}
                      
                      {business.rating && (
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{business.rating}</span>
                          <span className="text-xs text-muted-foreground">/5.0</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {viewMode === "available" && (
          <>
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-foreground">Available Stalls for Rent</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Prime commercial spaces available for new businesses. Contact us to schedule a viewing 
                and start your entrepreneurial journey in our thriving marketplace.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {availableStalls.map((stall) => (
                <Card key={stall.stallCode} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">Stall {stall.stallCode}</CardTitle>
                        <CardDescription>{stall.floor} • {stall.size}</CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{stall.monthlyRent}</div>
                        <div className="text-sm text-muted-foreground">per month</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">{stall.description}</p>
                    
                    <div className="flex space-x-2">
                      <Button className="flex-1">
                        <Phone className="h-4 w-4 mr-2" />
                        Contact Us
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <Mail className="h-4 w-4 mr-2" />
                        Inquire
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-muted/50">
              <CardContent className="p-8 text-center space-y-4">
                <h3 className="text-2xl font-bold text-foreground">Interested in Renting?</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Contact our leasing team to schedule a tour, discuss rental terms, 
                  and find the perfect space for your business.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" className="px-8">
                    <Phone className="h-5 w-5 mr-2" />
                    Call +63 912 RENT NOW
                  </Button>
                  <Button size="lg" variant="outline" className="px-8">
                    <Mail className="h-5 w-5 mr-2" />
                    Email Inquiry
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Building2 className="h-6 w-6 text-primary" />
                <span className="font-bold text-lg">Marketplace</span>
              </div>
              <p className="text-muted-foreground text-sm">
                A thriving community marketplace connecting local businesses with customers.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Quick Links</h4>
              <div className="space-y-2 text-sm">
                <div className="text-muted-foreground cursor-pointer hover:text-foreground">Business Directory</div>
                <div className="text-muted-foreground cursor-pointer hover:text-foreground">Available Stalls</div>
                <div className="text-muted-foreground cursor-pointer hover:text-foreground">Rental Information</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Contact Info</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>📍 123 Market Street, City Center</div>
                <div>📞 +63 912 RENT NOW</div>
                <div>✉️ info@marketplace.com</div>
              </div>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-4 text-center text-sm text-muted-foreground">
            © 2024 Marketplace. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default GuestView;