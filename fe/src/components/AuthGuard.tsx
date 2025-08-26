import { ReactNode, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Loading from "./blocks/Loading";
import { useAuth } from "@/hooks/useAuth";

const AuthGuard = ({ children, roles }: { children: ReactNode; roles?: string[] }) => {
    const { user, token, refreshToken, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!loading) {
            // chưa login
            if (!user || !token || !refreshToken) {
                navigate("/auth", { replace: true, state: { from: location } });
                return;
            }

            // có roles thì kiểm tra quyền
            if (roles?.length) {
                const { role, is_master } = user;
                const isAllowed =
                    roles.includes(role) || (roles.includes("master-admin") && is_master);

                if (!isAllowed) {
                    navigate("/not-found", { replace: true });
                }
            }
        }
    }, [loading, user, token, refreshToken, roles, navigate, location]);

    if (loading) return <Loading />; // chờ verify xong mới render
    if (!user || !token) return null;

    return <>{children}</>;
};

export default AuthGuard;
