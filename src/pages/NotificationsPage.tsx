import AuthGuard from "@/components/AuthGuard";
import NotificationLayout from "@/components/NotificationLayout";
import { AuthProvider } from "@/hooks/useAuth";

export default function NotificationsPage() {
  return (
    <AuthProvider>
      <AuthGuard>
        <NotificationLayout />
      </AuthGuard>
    </AuthProvider>
  );
}
