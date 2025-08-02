import ChatLayout from '@/components/ChatLayout';
import AuthGuard from '@/components/AuthGuard';

const Index = () => {


  return (
    <AuthGuard>
      <ChatLayout />
    </AuthGuard>
  );
};

export default Index;
