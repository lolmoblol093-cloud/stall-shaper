import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import Dashboard from "./pages/Dashboard";
import TenantsPage from "./pages/TenantsPage";
import StallsPage from "./pages/StallsPage";
import DirectoryPage from "./pages/DirectoryPage";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<AdminLogin />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/tenants" 
            element={
              <ProtectedRoute>
                <TenantsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/stalls" 
            element={
              <ProtectedRoute>
                <StallsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/directory" 
            element={
              <ProtectedRoute>
                <DirectoryPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/payments" 
            element={
              <ProtectedRoute>
                <div className="p-8">Payments feature coming soon...</div>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/settings" 
            element={
              <ProtectedRoute>
                <div className="p-8">Settings feature coming soon...</div>
              </ProtectedRoute>
            } 
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
