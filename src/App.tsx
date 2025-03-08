
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Cadastre from "./pages/Cadastre";
import Images from "./pages/Images";
import PLU from "./pages/PLU";
import Residents from "./pages/Residents";
import Projet from "./pages/Projet";
import Synthese from "./pages/Synthese";
import Login from "./pages/Login";
import Register from "./pages/Register";
import FicheDetails from "./pages/FicheDetails";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/cadastre" element={<Cadastre />} />
          <Route path="/images" element={<Images />} />
          <Route path="/plu" element={<PLU />} />
          <Route path="/residents" element={<Residents />} />
          <Route path="/projet" element={<Projet />} />
          <Route path="/synthese" element={<Synthese />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/fiche/:ficheId" element={<FicheDetails />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
