import AuthGuard from "@/components/AuthGuard";
import BlogsLayout from "@/components/BlogsLayout";
import MasterLayout from "@/components/MasterLayout";
import MenubarLayout from "@/components/MenubarLayout";
import { AuthProvider } from "@/hooks/useAuth";

function Blogs() {
    return (
        <AuthProvider>
            <AuthGuard>
                <MasterLayout
                    menu={<MenubarLayout selected="blogs" />}
                >

                    <BlogsLayout />
                </MasterLayout>
            </AuthGuard>
        </AuthProvider>
    );
}

export default Blogs;