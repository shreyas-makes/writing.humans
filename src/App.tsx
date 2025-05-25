import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ApiKeyProtectedRoute from "@/components/ApiKeyProtectedRoute";
import Home from "./pages/Home";
import EditorPage from "./pages/Editor";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";
import UpdatePassword from "./pages/UpdatePassword";
import Landing from "./pages/Landing";
import SharedDocumentPage from "./pages/SharedDocument";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/shared/:shareToken" element={<SharedDocumentPage />} />
            
            {/* Settings route - requires auth but not API key */}
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            
            {/* Protected routes that require API key */}
            <Route path="/home" element={
              <ApiKeyProtectedRoute>
                <Home />
              </ApiKeyProtectedRoute>
            } />
            <Route path="/" element={<Landing />} />
            <Route path="/editor/:documentId" element={
              <ApiKeyProtectedRoute>
                <EditorPage />
              </ApiKeyProtectedRoute>
            } />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
