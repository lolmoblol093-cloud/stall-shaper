import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from "./pages/NotFound";
import GuestView from "./pages/GuestView";
import Dashboard from "./pages/Dashboard";
import TenantsPage from "./pages/TenantsPage";
import StallsPage from "./pages/StallsPage";
import DirectoryPage from "./pages/DirectoryPage";
import PaymentsPage from "./pages/PaymentsPage";
import SettingsPage from "./pages/SettingsPage";
import ReportsPage from "./pages/ReportsPage";
import InquiriesPage from "./pages/InquiriesPage";
import TenantPortal from "./pages/TenantPortal";

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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/tenants" element={<TenantsPage />} />
          <Route path="/dashboard/stalls" element={<StallsPage />} />
          <Route path="/dashboard/directory" element={<DirectoryPage />} />
          <Route path="/dashboard/payments" element={<PaymentsPage />} />
          <Route path="/dashboard/settings" element={<SettingsPage />} />
          <Route path="/dashboard/reports" element={<ReportsPage />} />
          <Route path="/dashboard/inquiries" element={<InquiriesPage />} />
          <Route path="/tenant-portal" element={<TenantPortal />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
