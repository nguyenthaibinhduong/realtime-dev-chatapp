import ChatLayout from '@/components/ChatLayout';
import AuthGuard from '@/components/AuthGuard';
import { AuthProvider } from '@/hooks/useAuth';

const Index = () => {


  return (
    <AuthProvider>
      <AuthGuard>
        <ChatLayout />
      </AuthGuard>
    </AuthProvider>
  );
};

export default Index;
