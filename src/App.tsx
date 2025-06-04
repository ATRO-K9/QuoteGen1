import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import CustomerList from './pages/customers/CustomerList';
import CustomerForm from './pages/customers/CustomerForm';
import CustomerDetail from './pages/customers/CustomerDetail';
import ProjectList from './pages/projects/ProjectList';
import ProjectForm from './pages/projects/ProjectForm';
import ProjectDetail from './pages/projects/ProjectDetail';
import QuotationList from './pages/quotations/QuotationList';
import QuotationForm from './pages/quotations/QuotationForm';
import QuotationDetail from './pages/quotations/QuotationDetail';
import QuotationDownload from './pages/quotations/QuotationDownload';
import NotFound from './pages/NotFound';
import Login from './pages/auth/Login';
import Settings from './pages/settings/Settings';

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  useEffect(() => {
    // Check environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables. Please check your .env file.');
    }

    document.title = 'QuoteGen - Web Design Quotation Generator';
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            {/* Dashboard */}
            <Route index element={<Dashboard />} />
            
            {/* Customers */}
            <Route path="customers" element={<CustomerList />} />
            <Route path="customers/new" element={<CustomerForm mode="new" />} />
            <Route path="customers/:id" element={<CustomerDetail />} />
            <Route path="customers/:id/edit" element={<CustomerForm mode="edit" />} />
            
            {/* Projects */}
            <Route path="projects" element={<ProjectList />} />
            <Route path="projects/new" element={<ProjectForm mode="new" />} />
            <Route path="projects/:id" element={<ProjectDetail />} />
            <Route path="projects/:id/edit" element={<ProjectForm mode="edit" />} />
            
            {/* Quotations */}
            <Route path="quotations" element={<QuotationList />} />
            <Route path="quotations/new" element={<QuotationForm mode="new" />} />
            <Route path="quotations/:id" element={<QuotationDetail />} />
            <Route path="quotations/:id/edit" element={<QuotationForm mode="edit" />} />
            <Route path="quotations/:id/download" element={<QuotationDownload />} />
            
            {/* Settings */}
            <Route path="settings" element={<Settings />} />
          </Route>
          
          {/* 404 page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;