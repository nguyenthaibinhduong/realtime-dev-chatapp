import {
  Hash,
  Users,
  Info,
  Lock,
  Globe,
  Calendar,
  Crown,
  User,
} from "lucide-react";
import { Separator } from "../../ui/separator";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Badge } from "../../ui/badge";
import { Channel, Member } from "@/types/channel";
import { OnlineDot } from "../auth/OnlineDot";
import { useAuth } from "@/hooks/useAuth";

interface ChannelHeaderProps {
  channel: Channel;
  members: Member[];
}

const getChannelIcon = (channel: Channel, userId?: any) => {
  if (channel.type === "group")
    return <Globe className="h-5 w-5 text-blue-500 mr-2" />;
  if (channel.type === "private")
    return <Lock className="h-5 w-5 text-red-500 mr-2" />;
  if (channel.type === "personal") {
    return (
      <div className="relative mr-2">
        <Avatar className="h-6 w-6">
          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
            {channel.name?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        {/* Chấm online */}
        {
          userId && channel.members && (


            <OnlineDot userId={userId} />

          )
        }
      </div>
    );
  }
  return <Hash className="h-5 w-5 text-muted-foreground mr-2" />;
};

const getChannelTypeLabel = (type: string) => {
  switch (type) {
    case "group":
      return "Kênh công khai";
    case "group-private":
      return "Kênh riêng tư";
    case "personal":
      return "Chat cá nhân";
    default:
      return "Khác";
  }
};

const getChannelTypeColor = (type: string) => {
  switch (type) {
    case "group":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "group-private":
      return "bg-red-100 text-red-800 border-red-200";
    case "personal":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export const ChannelHeader = ({ channel, members }: ChannelHeaderProps) => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("members");
  const [otherUserId, setOtherUserId] = useState<string | number | undefined>();
  const { user } = useAuth();
  useEffect(() => {
    if (channel.type === "personal" && members && user?.id) {
      const otherMember = members.find((m: any) => m.id !== user.id);
      setOtherUserId(otherMember?.id);
    }
    console.log("Other User ID:", otherUserId);
  }, [channel, members, user]);

  return (
    <div className="h-14 border-b border-border bg-card px-6 flex items-center justify-between">
      <div className="flex items-center">
        {channel.type === "personal"
          ? getChannelIcon(channel, otherUserId)
          : getChannelIcon(channel)}
        <h2 className="font-semibold text-foreground">{channel.name}</h2>
        {channel.member_count > 2 && (
          <>
            <Separator orientation="vertical" className="mx-3 h-4" />
            <p className="text-sm text-muted-foreground">
              {channel.member_count} thành viên
            </p>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button
              className="p-2 rounded-lg hover:bg-muted transition-colors duration-200"
              title="Xem thành viên"
              onClick={() => {
                setTab("members");
                setOpen(true);
              }}
            >
              <Users className="h-5 w-5 text-muted-foreground hover:text-foreground" />
            </button>
          </DialogTrigger>
          <DialogTrigger asChild>
            <button
              className="p-2 rounded-lg hover:bg-muted transition-colors duration-200"
              title="Thông tin kênh"
              onClick={() => {
                setTab("info");
                setOpen(true);
              }}
            >
              <Info className="h-5 w-5 text-muted-foreground hover:text-foreground" />
            </button>
          </DialogTrigger>

          {/* Modern Modal Design */}
          <DialogContent className="max-w-lg bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 border-0 shadow-2xl rounded-2xl overflow-hidden">
            {/* Header với gradient background */}
            <div className="bg-gradient-to-r from-blue-800 to-purple-600 -mx-6 -mt-6 px-6 py-6 mb-6">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-transparent flex items-center justify-center backdrop-blur-sm">
                    <Avatar className="h-12 w-12 rounded-xl">
                      <AvatarFallback className="bg-primary text-primary-foreground text-md">
                        {channel.name?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    {/* Chấm online */}
                    {
                      channel.type == "personal" && otherUserId && (
                        <OnlineDot userId={otherUserId} />

                      )
                    }
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold text-white tracking-tight">
                      {channel.name}
                    </DialogTitle>
                    <p className="text-blue-100 text-sm font-medium">
                      {getChannelTypeLabel(channel.type)}
                    </p>
                  </div>
                </div>
              </DialogHeader>
            </div>

            {/* Tabs với thiết kế hiện đại */}
            <Tabs value={tab} onValueChange={setTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 bg-white/50 dark:bg-slate-800/50 rounded-xl p-1 shadow-sm">
                <TabsTrigger
                  value="members"
                  className="rounded-lg font-medium transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-md"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Thành viên
                </TabsTrigger>
                <TabsTrigger
                  value="info"
                  className="rounded-lg font-medium transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-md"
                >
                  <Info className="h-4 w-4 mr-2" />
                  Thông tin
                </TabsTrigger>
              </TabsList>

              {/* Members Tab */}
              <TabsContent value="members" className="space-y-4">
                <div className="bg-white/70 dark:bg-slate-800/70 rounded-xl p-4 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">
                    Danh sách thành viên ({members.length})
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {members.map((member: any) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 p-3 bg-white/80 dark:bg-slate-700/80 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors duration-200"
                      >
                        <div className="relative mr-2">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary text-primary-foreground text-md">
                              {member.username?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          {/* Chấm online */}
                          {
                            <OnlineDot userId={member.id} />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {member.username}
                            </p>
                            {member.isOwner && (
                              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 px-2 py-0.5 text-xs">
                                <Crown className="h-3 w-3 mr-1" />
                                Trưởng nhóm
                              </Badge>
                            )}
                            {member.isMine && (
                              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 px-2 py-0.5 text-xs">
                                <User className="h-3 w-3 mr-1" />
                                Bạn
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                            {member.email}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Info Tab */}
              <TabsContent value="info" className="space-y-4">
                <div className="bg-white/70 dark:bg-slate-800/70 rounded-xl p-6  space-y-6">
                  {/* Channel Type */}
                  <div className="flex items-center justify-between p-4 bg-white/80 dark:bg-slate-700/80 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                        <div className="w-12 h-12 bg-blue-500 flex rounded-xl items-center justify-center ">
                          <Avatar className="h-12 w-12 rounded-xl">
                            <AvatarFallback className="bg-transparent text-primary-foreground text-md">
                              {channel.name?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          {/* Chấm online */}
                          {
                            channel.type == "personal" && otherUserId && (
                              <OnlineDot userId={otherUserId} />

                            )
                          }
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Loại kênh
                        </p>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {getChannelTypeLabel(channel.type)}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={`${getChannelTypeColor(
                        channel.type
                      )} border font-medium px-3 py-1`}
                    >
                      {channel.type.toUpperCase()}
                    </Badge>
                  </div>

                  {/* Created Date */}
                  {channel.created_at && (
                    <div className="flex items-center justify-between p-4 bg-white/80 dark:bg-slate-700/80 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            Ngày tạo
                          </p>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {new Date(channel.created_at).toLocaleDateString(
                              "vi-VN",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              }
                            )}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {new Date(channel.created_at).toLocaleTimeString(
                          "vi-VN",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    </div>
                  )}

                  {/* Member Count */}
                  {channel.member_count && (
                    <div className="flex items-center justify-between p-4 bg-white/80 dark:bg-slate-700/80 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            Số thành viên
                          </p>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {channel.member_count} người
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0 px-3 py-1 font-medium">
                        {channel.member_count}
                      </Badge>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
