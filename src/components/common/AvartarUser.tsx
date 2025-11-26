import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import attachmentService from "@/services/attachmentService";
import { useEffect, useState } from "react";
import { UserProfileDialog } from "./UserProfileDialog";
import { useAuth } from "@/hooks/useAuth";

const AvatarUser = ({
  user,
  isMe = false,
  size = 6,
}: {
  user: any;
  isMe?: boolean;
  size?: string | number;
}) => {
  const { user: currentUser } = useAuth();
  // const [avatarUrl, setAvatarUrl] = useState<string>(null);
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  // useEffect(() => {
  //   if (user?.avatar) {
  //     attachmentService.getObjectUrl(user.avatar).then(setAvatarUrl);
  //   }
  // }, [user?.avatar]);

  const handleClick = () => {
    setShowProfileDialog(true);
  };

  const isCurrentUser = isMe || (currentUser?.id === user?.id);

  return (
    <>
      <Avatar
        className={`h-${size} w-${size} hover:cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all`}
        onClick={handleClick}
      >
        <AvatarImage
          src={user?.avatar ?? user?.github_avatar ?? 'https://i.pravatar.cc/150?u=' + user?.id}
          alt={(user?.username as string) || (user?.email as string) || "User"}
        />
        <AvatarFallback className="bg-primary text-primary-foreground">
          {(user?.username?.[0] || user?.email?.[0] || "U").toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <UserProfileDialog
        user={user}
        open={showProfileDialog}
        onOpenChange={setShowProfileDialog}
        isCurrentUser={isCurrentUser}
      />
    </>
  );
};

export default AvatarUser;
