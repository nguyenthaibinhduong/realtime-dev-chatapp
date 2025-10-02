
import AuthGuard from "@/components/AuthGuard";
import GithubRegisterLayout from "@/components/GithubRegisterLayout";
import MasterLayout from "@/components/MasterLayout";
import MenubarLayout from "@/components/MenubarLayout";
import { AuthProvider } from "@/hooks/useAuth";
const GitHubPage = () => {
    return (
        <>
            <AuthProvider>
                <AuthGuard>

                    <MasterLayout
                        menu={<MenubarLayout selected="github" />}
                    >
                        <GithubRegisterLayout />
                    </MasterLayout>

                </AuthGuard>
            </AuthProvider>
        </>
    );
};

export default GitHubPage;