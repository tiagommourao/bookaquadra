import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SiteSettingsProvider } from "@/contexts/SiteSettingsContext";
import { Loading } from "@/components/ui/loading";

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
import EventsList from "./pages/admin/events/EventsList";
import StripeIntegration from "./pages/admin/integrations/StripeIntegration";
import PaymentMethodSettings from "./pages/admin/settings/PaymentMethodSettings";

import NotFound from "./pages/NotFound";

// Protected route for users
const UserProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, error } = useAuth();
  
  if (isLoading) {
    return <Loading message="Verificando autenticação..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-destructive">
        <p>Erro ao verificar autenticação</p>
        <p className="text-sm mt-2">{error}</p>
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

// Protected route for admins
const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, isAdmin, user, error } = useAuth();
  
  if (isLoading) {
    return <Loading message="Verificando permissões..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-destructive">
        <p>Erro ao verificar permissões</p>
        <p className="text-sm mt-2">{error}</p>
      </div>
    );
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
  
  // For development purposes, consider all authenticated users as admins
  // Remove or modify this for production
  return <>{children}</>;
  
  // Uncomment this for production:
  // return isAdmin ? <>{children}</> : <Navigate to="/" />;
};

// Main App Component
const App = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });

  return (
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
                
                {/* Admin Events Management */}
                <Route path="/admin/eventos_torneios" element={
                  <AdminProtectedRoute>
                    <EventsList />
                  </AdminProtectedRoute>
                } />
                
                {/* Admin Mercado Pago Integration */}
                <Route path="/admin/integracoes/mercadopago" element={
                  <AdminProtectedRoute>
                    <MercadoPagoIntegration />
                  </AdminProtectedRoute>
                } />
                
                {/* Admin Stripe Integration */}
                <Route path="/admin/integracoes/stripe" element={
                  <AdminProtectedRoute>
                    <StripeIntegration />
                  </AdminProtectedRoute>
                } />
                
                {/* Admin Payment Method Settings */}
                <Route path="/admin/configuracoes/pagamentos" element={
                  <AdminProtectedRoute>
                    <PaymentMethodSettings />
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
};

export default App;
