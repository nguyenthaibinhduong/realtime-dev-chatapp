import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import NotificationsPage from "./pages/NotificationsPage";
import { GitHubCallback } from "./components/GithubCallback";
import ConfirmEmailPage from "./components/ConfirmEmail";
import GitHubRegister from "./pages/GitHubRegister";
import SettingsPage from "./pages/Setting";
import GithubRegisterLayout from "./components/GithubRegisterLayout";
import GitHubPage from "./pages/GitHubPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      {/* <NotificationProvider      
        autoConnect={true}
        enableToast={true}> */}
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/github/register" element={<GitHubRegister />} />
            <Route path="/github" element={<GitHubPage />} />
            <Route path="/auth/github/callback" element={<GitHubCallback />} />
            <Route path="/auth/confirm-email" element={<ConfirmEmailPage />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      {/* </NotificationProvider> */}
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
