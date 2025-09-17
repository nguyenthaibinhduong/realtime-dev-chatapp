import AuthGuard from "@/components/AuthGuard";
import SettingLayout from "@/components/SettingLayout";
import { AuthProvider } from "@/hooks/useAuth";

export default function SettingsPage() {
  return (
    <AuthProvider>
      <AuthGuard>
        <SettingLayout />
      </AuthGuard>
    </AuthProvider>
  );
}
