import AuthGuard from "@/components/AuthGuard";
import AdminLayout from "@/components/AdminLayout";
import { AuthProvider } from "@/hooks/useAuth";

export default function AdminPage() {
    return (
        <AuthProvider>
            <AuthGuard>
                <AdminLayout />
            </AuthGuard>
        </AuthProvider>
    );
}
