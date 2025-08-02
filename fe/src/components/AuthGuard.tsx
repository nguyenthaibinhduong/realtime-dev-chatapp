import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Loading from './blocks/Loading';

const AuthGuard = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setIsAuthenticated(true);
            } else {
                navigate('/auth');
            }
            setIsLoading(false);
        };

        checkAuth();
    }, []);

    if (isLoading) return <Loading />;
    if (!isAuthenticated) return null; // tránh render sớm trong lúc redirect

    return <>{children}</>;
};

export default AuthGuard;
