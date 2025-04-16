
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

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import CourtsList from "./pages/admin/courts/CourtsList";
import SchedulesList from "./pages/admin/schedules/SchedulesList";
import BookingsList from "./pages/admin/bookings/BookingsList";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
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
