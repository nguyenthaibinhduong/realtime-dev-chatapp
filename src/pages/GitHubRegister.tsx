
import AuthGuard from "@/components/AuthGuard";
import GithubRegisterLayout from "@/components/GithubRegisterLayout";
import { AuthProvider } from "@/hooks/useAuth";
const GitHubRegister = () => {
    return (
        <>
            <AuthProvider>
                <AuthGuard>
                    <GithubRegisterLayout />
                </AuthGuard>
            </AuthProvider>
        </>
    );
};

export default GitHubRegister;