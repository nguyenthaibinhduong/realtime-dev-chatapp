import { AuthProvider } from '@/hooks/useAuth';
import AuthForm from '@/components/blocks/auth/AuthForm';

const Index = () => {


  return (
    <AuthProvider>
      <AuthForm />
    </AuthProvider>
  );
};

export default Index;
