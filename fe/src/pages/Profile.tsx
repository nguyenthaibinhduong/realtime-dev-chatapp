import ProfileLayout from "@/components/ProfileLayout";
import { supabase } from "@/integrations/supabase/client";
import React from "react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
    const [isLoading, setIsLoading] = React.useState(true);
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);
    const navigate = useNavigate();

    React.useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            setIsAuthenticated(true);
        } else {
            navigate('/auth');
        }
        setIsLoading(false);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--chat-background))]">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-foreground">Đang tải...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null; // Will redirect to /auth
    }

    return <ProfileLayout />

}

export default Profile;