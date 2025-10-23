import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { NotificationProvider } from "@/hooks/useNotificationToast";
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
import Blogs from "./pages/Blogs";
import Error from "./pages/Error";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BrowserRouter>
        <NotificationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
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
              <Route path="/blogs" element={<Blogs />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/error" element={<Error />} />
            </Routes>
          </TooltipProvider>
        </NotificationProvider>
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
