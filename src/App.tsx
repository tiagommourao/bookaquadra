
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import Login from './pages/auth/Login';

import Dashboard from './pages/user/Dashboard';
import CourtReservation from './pages/user/CourtReservation';
import MyBookings from './pages/user/MyBookings';
import Account from './pages/user/Account';

import AdminDashboard from './pages/admin/AdminDashboard';
import CourtsPage from './pages/admin/courts/CourtsPage';
import SchedulesPage from './pages/admin/schedules/SchedulesPage';
import BookingsPage from './pages/admin/bookings/BookingsPage';

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          
          {/* User Routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/reservas" element={<CourtReservation />} />
          <Route path="/minhas-reservas" element={<MyBookings />} />
          <Route path="/conta" element={<Account />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/quadras" element={<CourtsPage />} />
          <Route path="/admin/horarios" element={<SchedulesPage />} />
          <Route path="/admin/reservas" element={<BookingsPage />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
