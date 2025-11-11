import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import attachmentService from "@/services/attachmentService";
import { useEffect, useState } from "react";

const AvatarUser = ({
  user,
  isMe = false,
  size = 8,
}: {
  user: any;
  isMe?: boolean;
  size?: string | number;
}) => {
  const navigate = useNavigate();
  const url = isMe ? "/settings" : `/users/${user?.id}`;
  const [avatarUrl, setAvatarUrl] = useState<string>(null);

  useEffect(() => {
    if (user?.avatar) {
      attachmentService.getObjectUrl(user.avatar).then(setAvatarUrl);
    }
  }, [user?.avatar]);

  return (
    <Avatar
      className={`h-${size} w-${size} hover:cursor-pointer`}
      onClick={() => navigate(url)}
    >
      <AvatarImage
        src={avatarUrl || user?.github_avatar || 'https://i.pravatar.cc/150?u=' + user?.id}
        alt={(user?.username as string) || (user?.email as string) || "User"}
      />
      <AvatarFallback className="bg-primary text-primary-foreground">
        {(user?.username?.[0] || user?.email?.[0] || "U").toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
};

export default AvatarUser;
