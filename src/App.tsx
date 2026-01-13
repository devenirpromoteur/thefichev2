import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Cadastre from "./pages/Cadastre";
import PLU from "./pages/PLU";
import Residents from "./pages/Residents";
import Projet from "./pages/Projet";
import Synthese from "./pages/Synthese";
import Projets from "./pages/Projets";
import FicheDetails from "./pages/FicheDetails";

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
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/projets" element={<Projets />} />
            <Route path="/cadastre" element={<Cadastre />} />
            <Route path="/plu" element={<PLU />} />
            <Route path="/residents" element={<Residents />} />
            <Route path="/projet" element={<Projet />} />
            <Route path="/fiche/:ficheId" element={<FicheDetails />} />
            <Route path="/synthese" element={<Synthese />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
