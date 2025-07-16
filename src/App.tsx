
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Layout from "./components/layout/Layout";
import LoginForm from "./components/auth/LoginForm";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Employees from "./pages/Employees";
import Clients from "./pages/Clients";
import Services from "./pages/Services";
import Budgets from "./pages/Budgets";
import Inventory from "./pages/Inventory";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import MyTasks from "./pages/MyTasks";
import NotFound from "./pages/NotFound";
import TaskManagement from '@/pages/TaskManagement';
import ServiceOrderCalls from "./pages/ServiceOrderCalls";
import InvoicePage from "./pages/InvoicesPage"; // ✅ Importação da tela de fatura


const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return <Layout>{children}</Layout>;
};

const RootRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<RootRoute />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/orders" 
                element={
                  <ProtectedRoute>
                    <Orders />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/my-tasks" 
                element={
                  <ProtectedRoute>
                    <MyTasks />
                  </ProtectedRoute>
                } 
              />

        
              <Route 
                path="/employees" 
                element={
                  <ProtectedRoute>
                    <Employees />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/clients" 
                element={
                  <ProtectedRoute>
                    <Clients />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/services" 
                element={
                  <ProtectedRoute>
                    <Services />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/budgets" 
                element={
                  <ProtectedRoute>
                    <Budgets />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/inventory" 
                element={
                  <ProtectedRoute>
                    <Inventory />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/reports" 
                element={
                  <ProtectedRoute>
                    <Reports />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } 
              />
              <Route path="/tasks/:serviceOrderId"
               element={
               <ProtectedRoute>
                <TaskManagement />
               </ProtectedRoute>
               }
              />

              <Route path="/chamados"
              element={
                <ProtectedRoute>
                  <ServiceOrderCalls />
                </ProtectedRoute>
                }
              />

              <Route path="/invoices" 
              element={
              <ProtectedRoute>
                <InvoicePage />
              </ProtectedRoute>} /> {/* ✅ Nova Rota */}


              <Route path="*" element={<NotFound />} />
            </Routes>

          </BrowserRouter>
          <Toaster />
          <Sonner />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
