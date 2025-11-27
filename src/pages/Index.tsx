import ChatLayout from "@/components/ChatLayout";
import AuthGuard from "@/components/AuthGuard";
import { AuthProvider } from "@/hooks/useAuth";
import { PresenceProvider } from "@/hooks/usePresense";
import { chatSocketService } from "@/services/chatSocketService";
import { AttachmentPreviewProvider } from "@/hooks/useAttachmentPreview";

const Index = () => {
  return (
    <AuthProvider>
      <AuthGuard>
        <PresenceProvider
          onPresenceUpdate={chatSocketService.onPresenceUpdate}
          offPresenceUpdate={chatSocketService.offPresenceUpdate}
        >
          <AttachmentPreviewProvider>
            <ChatLayout />
          </AttachmentPreviewProvider>
        </PresenceProvider>
      </AuthGuard>
    </AuthProvider>
  );
};

export default Index;
