import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import GuestView from "./pages/GuestView";
import Dashboard from "./pages/Dashboard";
import TenantsPage from "./pages/TenantsPage";
import StallsPage from "./pages/StallsPage";
import DirectoryPage from "./pages/DirectoryPage";
import PaymentsPage from "./pages/PaymentsPage";
import SettingsPage from "./pages/SettingsPage";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<GuestView />} />
          <Route path="/guest" element={<GuestView />} />
          <Route path="/login" element={<Login />} />
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
                <PaymentsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/settings" 
            element={
              <ProtectedRoute>
                <SettingsPage />
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
