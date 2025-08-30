import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Loading from './blocks/Loading';

const AuthGuard = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const { isAuthenticated, loading } = useAuth();

    useEffect(() => {
        if (!loading) {
            if (!isAuthenticated()) {
                navigate('/auth');
            } else {
                setIsLoading(false);
            }
        }
    }, [loading, isAuthenticated, navigate]);

    if (loading || isLoading) return <Loading />;
    if (!isAuthenticated()) return null; // tránh render sớm trong lúc redirect

    return <>{children}</>;
};

export default AuthGuard;
