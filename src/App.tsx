
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Cadastre from "./pages/Cadastre";
import PLU from "./pages/PLU";
import Residents from "./pages/Residents";
import Projet from "./pages/Projet";
import Synthese from "./pages/Synthese";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";
import Account from "./pages/Account";

import FicheDetails from "./pages/FicheDetails";
import AuthCallback from "./pages/AuthCallback";

// Création du client de requête pour React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            
            {/* All routes now public */}
            <Route path="/projets" element={<Index />} />
            <Route path="/cadastre" element={<Cadastre />} />
            <Route path="/plu" element={<PLU />} />
            <Route path="/residents" element={<Residents />} />
            <Route path="/projet" element={<Projet />} />
            <Route path="/fiche/:ficheId" element={<FicheDetails />} />
            <Route path="/synthese" element={<Synthese />} />
            <Route path="/account" element={<Account />} />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
