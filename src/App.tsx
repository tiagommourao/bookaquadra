import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SiteSettingsProvider } from "@/contexts/SiteSettingsContext";

// Auth Pages
import Login from "./pages/auth/Login";
import AuthCallback from "./pages/auth/AuthCallback";
import Onboarding from "./pages/auth/Onboarding";

// User Pages
import Dashboard from "./pages/user/Dashboard";
import CourtReservation from "./pages/user/CourtReservation";
import MyBookings from "./pages/user/MyBookings";
import Account from "./pages/user/Account";
import Social from "./pages/user/Social";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import CourtsList from "./pages/admin/courts/CourtsList";
import SchedulesList from "./pages/admin/schedules/SchedulesList";
import BookingsList from "./pages/admin/bookings/BookingsList";
import UsersList from "./pages/admin/users/UsersList";
import MercadoPagoIntegration from "./pages/admin/integrations/MercadoPagoIntegration";
import PaymentsList from "./pages/admin/payments/PaymentsList";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Protected route for users
const UserProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

// Protected route for admins
const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, user, isAdmin } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // Debug information in console
  console.log("Admin route check:", { 
    isAdmin, 
    user, 
    role: user?.role,
    email: user?.email
  });
  
  // Retornar children apenas se for admin
  return isAdmin ? <>{children}</> : <Navigate to="/" />;
};

// Main App Component
const App = () => (
  <QueryClientProvider client={queryClient}>
    <SiteSettingsProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Authentication Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/onboarding" element={<Onboarding />} />
              
              {/* User Routes */}
              <Route path="/" element={
                <UserProtectedRoute>
                  <Dashboard />
                </UserProtectedRoute>
              } />
              <Route path="/reservar" element={
                <UserProtectedRoute>
                  <CourtReservation />
                </UserProtectedRoute>
              } />
              <Route path="/minhas-reservas" element={
                <UserProtectedRoute>
                  <MyBookings />
                </UserProtectedRoute>
              } />
              <Route path="/conta" element={
                <UserProtectedRoute>
                  <Account />
                </UserProtectedRoute>
              } />
              
              {/* Social & Community Routes */}
              <Route path="/social" element={
                <UserProtectedRoute>
                  <Social />
                </UserProtectedRoute>
              } />
              <Route path="/rankings" element={
                <UserProtectedRoute>
                  <Social />
                </UserProtectedRoute>
              } />
              
              {/* Admin Routes */}
              <Route path="/admin" element={
                <AdminProtectedRoute>
                  <AdminDashboard />
                </AdminProtectedRoute>
              } />
              
              {/* Admin Courts Management */}
              <Route path="/admin/quadras" element={
                <AdminProtectedRoute>
                  <CourtsList />
                </AdminProtectedRoute>
              } />
              
              {/* Admin Schedules Management */}
              <Route path="/admin/horarios" element={
                <AdminProtectedRoute>
                  <SchedulesList />
                </AdminProtectedRoute>
              } />
              
              {/* Admin Bookings Management */}
              <Route path="/admin/reservas" element={
                <AdminProtectedRoute>
                  <BookingsList />
                </AdminProtectedRoute>
              } />
              
              {/* Admin Users Management */}
              <Route path="/admin/usuarios" element={
                <AdminProtectedRoute>
                  <UsersList />
                </AdminProtectedRoute>
              } />
              
              {/* Admin Payments Management */}
              <Route path="/admin/pagamentos" element={
                <AdminProtectedRoute>
                  <PaymentsList />
                </AdminProtectedRoute>
              } />
              
              {/* Admin Mercado Pago Integration */}
              <Route path="/admin/integracoes/mercadopago" element={
                <AdminProtectedRoute>
                  <MercadoPagoIntegration />
                </AdminProtectedRoute>
              } />
              
              {/* Other Admin Routes */}
              <Route path="/admin/:path" element={
                <AdminProtectedRoute>
                  <AdminDashboard />
                </AdminProtectedRoute>
              } />
              
              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </SiteSettingsProvider>
  </QueryClientProvider>
);

export default App;
