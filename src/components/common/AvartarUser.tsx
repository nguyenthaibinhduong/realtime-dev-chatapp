import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const AvatarUser = ({ user, isMe = false, size = 8 }: { user: any, isMe?: boolean, size?: string | number }) => {
    const navigate = useNavigate();
    const url = isMe ? "/settings" : `/users/${user?.id}`;
    return (
        <Avatar
            className={`h-${size} w-${size} hover:cursor-pointer`}
            onClick={() => navigate(url)}
        >
            <AvatarImage
                src={(user as any)?.avatar || user?.github_avatar || undefined}
                alt={(user?.username as string) || (user?.email as string) || "User"}
            />
            <AvatarFallback className="bg-primary text-primary-foreground">
                {(user?.username?.[0] || user?.email?.[0] || "U").toUpperCase()}
            </AvatarFallback>
        </Avatar>
    );
};

export default AvatarUser;