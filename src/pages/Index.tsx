import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        if (isAdmin) {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        navigate('/login');
      }
    }
  }, [isAuthenticated, isLoading, isAdmin, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-primary mb-4">BookaQuadra</h1>
        <p className="text-gray-600">Carregando...</p>
      </div>
    </div>
  );
};

export default Index;
