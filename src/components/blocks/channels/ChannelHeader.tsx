import {
  Hash,
  Users,
  Info,
  Lock,
  Globe,
  Calendar,
  Crown,
  User,
  Github,
  Paperclip,
  Wrench,
  ChevronDown,
  X,
  Settings,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Badge } from "../../ui/badge";
import { Channel, Member } from "@/types/channel";
import { OnlineDot } from "../auth/OnlineDot";
import { useAuth } from "@/hooks/useAuth";
import { RepoChatDialog } from "../github/RepoChatDialog";
import { AttachmentModal } from "../attachments/AttachmentModal";
import AvatarUser from "@/components/common/AvartarUser";
import { AvatarGroupGrid, AvatarGroupStack } from "@/components/common/AvatarGroup";
import { ToolType, TOOL_CONFIGS } from "../tools";
import ChannelUpdate from "./ChannelSettings";

interface ChannelHeaderProps {
  channel: Channel;
  members: Member[];
  selectedTool?: ToolType;
  onToolChange?: (tool: ToolType) => void;
}

const getChannelIcon = (channel: Channel, user?: any) => {
  if (channel.type === "group")
    return (
      <div className="w-9 h-9 bg-green-500/15 border border-green-500/30 rounded-xl flex items-center justify-center">
        <Globe className="h-5 w-5 text-green-400" />
      </div>
    );
  if (channel.type === "group-private")
    return (
      <div className="w-9 h-9 bg-orange-500/15 border border-orange-500/30 rounded-xl flex items-center justify-center">
        <Lock className="h-5 w-5 text-orange-400" />
      </div>
    );
  if (channel.type === "personal") {
    return (
      <div className="relative">
        <AvatarUser user={user} size={9} />
        {/* Chấm online */}
        {user?.id && channel.members && <OnlineDot userId={user?.id} />}
      </div>
    );
  }
  return (
    <div className="w-9 h-9 bg-zinc-700/50 border border-zinc-600/30 rounded-xl flex items-center justify-center">
      <Hash className="h-5 w-5 text-zinc-400" />
    </div>
  );
};

const getChannelTypeLabel = (type: string) => {
  switch (type) {
    case "group":
      return "Kênh công khai";
    case "group-private":
      return "Kênh dự án";
    case "personal":
      return "Chat cá nhân";
    default:
      return "Khác";
  }
};

export const ChannelHeader = ({ channel, members, selectedTool, onToolChange }: ChannelHeaderProps) => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("members");
  const [otherUser, setOtherUser] = useState<any>();
  const { user } = useAuth();
  const [openGitModal, setOpenGitModal] = useState(false);
  const [openAttachmentModal, setOpenAttachmentModal] = useState(false);
  const [openSettingsModal, setOpenSettingsModal] = useState(false);

  useEffect(() => {
    if (channel.type === "personal" && members && user?.id) {
      const otherMember = members.find((m: any) => m.id !== user.id);
      setOtherUser(otherMember);
    }
    console.log("Other User ID:", otherUser);
  }, [channel, members, user]);

  return (
    <div className="h-14 border-b border-zinc-700/50 bg-zinc-950/95 backdrop-blur-md px-6 py-0 flex items-center justify-between shadow-sm">
      <div className="flex items-center min-w-0 flex-1">
        <div className="flex items-center gap-3">
          {channel.type === "personal"
            ? getChannelIcon(channel, otherUser)
            : getChannelIcon(channel)}
          <h2 className="font-semibold text-white text-lg truncate">
            {channel.type === "personal" && otherUser
              ? (otherUser.username || otherUser.name || otherUser.email || channel.name)
              : channel.name
            }
          </h2>
        </div>

        {channel.member_count > 2 && (
          <>
            <Separator orientation="vertical" className="mx-4 h-5 bg-zinc-600/40" />
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/50 rounded-full border border-zinc-700/30">
                <Users className="h-3.5 w-3.5 text-zinc-400" />
                <span className="text-sm font-medium text-zinc-300">
                  {channel.member_count}
                </span>
              </div>
              <AvatarGroupStack
                users={channel.members || members}
                size="sm"
                max={4}
                overlap={true}
                overlapOffset={8}
                currentUserId={user?.id}
                tooltip={true}
              />
            </div>
          </>
        )}
      </div>
      <div className="flex items-center gap-1">
        {/* Nút mở attachment modal */}
        <button
          className="p-2.5 rounded-xl hover:bg-zinc-800/60 border border-transparent hover:border-zinc-600/30 transition-all duration-200 group"
          title="Xem tệp đính kèm"
          onClick={() => setOpenAttachmentModal(true)}
        >
          <Paperclip className="h-[20px] w-[20px] text-zinc-400 group-hover:text-zinc-200 transition-colors" />
          <span className="sr-only">Xem tệp đính kèm</span>
        </button>

        {/* Attachment Modal */}
        <AttachmentModal
          open={openAttachmentModal}
          onOpenChange={setOpenAttachmentModal}
          channelId={channel.id}
          members={members}
        />

        {/* Tools Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`p-2.5 rounded-xl border transition-all duration-200 group ${selectedTool
                ? 'bg-blue-500/15 border-blue-400/40 text-blue-400 shadow-lg shadow-blue-500/20'
                : 'hover:bg-zinc-800/60 border-transparent hover:border-zinc-600/30'
                }`}
              title="AI Tools"
            >
              <div className="flex items-center gap-1.5">
                <Wrench className={`h-[20px] w-[20px] transition-colors ${selectedTool
                  ? 'text-blue-400'
                  : 'text-zinc-400 group-hover:text-zinc-200'
                  }`} />
                {selectedTool && (
                  <ChevronDown className="h-3 w-3 text-blue-400" />
                )}
              </div>
              <span className="sr-only">AI Tools</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 bg-zinc-900/95 backdrop-blur-md border-zinc-700/50 shadow-2xl">
            {Object.values(TOOL_CONFIGS).map((tool) => (
              <DropdownMenuItem
                key={tool.id}
                onClick={() => onToolChange?.(selectedTool === tool.id ? null : tool.id)}
                className={`cursor-pointer transition-all duration-200 ${selectedTool === tool.id
                  ? 'bg-blue-500/20 border-l-2 border-blue-400 text-blue-300'
                  : 'hover:bg-zinc-800/70 text-zinc-200'
                  }`}
              >
                <div className="flex items-center gap-3 w-full py-1">
                  <span className="text-lg">{tool.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{tool.name}</div>
                    <div className="text-xs text-zinc-400 truncate">{tool.description}</div>
                  </div>
                  {selectedTool === tool.id && (
                    <div className="flex-shrink-0">
                      <X className="h-4 w-4 text-blue-400" />
                    </div>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
            {selectedTool && (
              <>
                <DropdownMenuSeparator className="bg-zinc-700/50" />
                <DropdownMenuItem
                  onClick={() => onToolChange?.(null)}
                  className="cursor-pointer hover:bg-red-500/20 text-red-400 font-medium"
                >
                  <X className="h-4 w-4 mr-2" />
                  Đóng tất cả tools
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Separator */}
        <div className="w-px h-6 bg-zinc-700/40 mx-1" />

        {/* Nút mở modal kết nối repo git */}
        <button
          className="p-2.5 rounded-xl hover:bg-zinc-800/60 border border-transparent hover:border-zinc-600/30 transition-all duration-200 group"
          title="GitHub Integration"
          onClick={() => setOpenGitModal(true)}
        >
          <Github className="h-[20px] w-[20px] text-zinc-400 group-hover:text-zinc-200 transition-colors" />
          <span className="sr-only">Kết nối repo Git</span>
        </button>
        <RepoChatDialog open={openGitModal} onOpenChange={setOpenGitModal} />

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button
              className="p-2.5 rounded-xl hover:bg-zinc-800/60 border border-transparent hover:border-zinc-600/30 transition-all duration-200 group"
              title="Xem thành viên"
              onClick={() => {
                setTab("members");
                setOpen(true);
              }}
            >
              <Users className="h-[20px] w-[20px] text-zinc-400 group-hover:text-zinc-200 transition-colors" />
            </button>
          </DialogTrigger>
          <DialogTrigger asChild>
            <button
              className="p-2.5 rounded-xl hover:bg-zinc-800/60 border border-transparent hover:border-zinc-600/30 transition-all duration-200 group"
              title="Thông tin kênh"
              onClick={() => {
                setTab("info");
                setOpen(true);
              }}
            >
              <Info className="h-[20px] w-[20px] text-zinc-400 group-hover:text-zinc-200 transition-colors" />
            </button>
          </DialogTrigger>

          {/* Dark/Light Modal Design */}
          <DialogContent className="max-w-lg bg-zinc-950 text-white border border-zinc-800 shadow-2xl rounded-2xl overflow-hidden">
            {/* Header với background đen và viền trắng */}
            <div className="bg-zinc-900 border-b border-zinc-800 -mx-6 -mt-6 px-6 py-6 mb-6">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 flex items-center justify-center">
                    {channel.type === "personal" ? (
                      <div className="relative">
                        <AvatarUser user={otherUser} size={12} />
                        {otherUser?.id && <OnlineDot userId={otherUser?.id} />}
                      </div>
                    ) : channel.type === "group" ? (
                      <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                        <Globe className="h-6 w-6 text-green-500" />
                      </div>
                    ) : channel.type === "group-private" ? (
                      <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                        <Lock className="h-6 w-6 text-orange-500" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-zinc-700 rounded-xl flex items-center justify-center">
                        <Hash className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold text-white tracking-tight">
                      {channel.type === "personal" && otherUser
                        ? (otherUser.username || otherUser.name || otherUser.email || channel.name)
                        : channel.name
                      }
                    </DialogTitle>
                    <p className="text-zinc-400 text-sm font-medium">
                      {getChannelTypeLabel(channel.type)}
                    </p>
                  </div>
                </div>
              </DialogHeader>
            </div>

            {/* Tabs với thiết kế tối */}
            <Tabs value={tab} onValueChange={setTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 bg-zinc-900 rounded-xl p-1 shadow-sm border border-zinc-800">
                <TabsTrigger
                  value="members"
                  className="rounded-lg font-medium transition-all duration-200 data-[state=active]:bg-zinc-800 data-[state=active]:text-white data-[state=active]:shadow-md text-zinc-300"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Thành viên
                </TabsTrigger>
                <TabsTrigger
                  value="info"
                  className="rounded-lg font-medium transition-all duration-200 data-[state=active]:bg-zinc-800 data-[state=active]:text-white data-[state=active]:shadow-md text-zinc-300"
                >
                  <Info className="h-4 w-4 mr-2" />
                  Thông tin
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="rounded-lg font-medium transition-all duration-200 data-[state=active]:bg-zinc-800 data-[state=active]:text-white data-[state=active]:shadow-md text-zinc-300"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Cài đặt kênh
                </TabsTrigger>
              </TabsList>

              {/* Members Tab */}
              <TabsContent value="members" className="space-y-4">
                <div className="bg-zinc-900 rounded-xl p-4">
                  <h3 className="text-lg font-semibold mb-4 text-white">
                    Danh sách thành viên ({members.length})
                  </h3>

                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {members.map((member: any) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors duration-200"
                      >
                        <div className="relative mr-2">
                          <AvatarUser user={member} size={8} />
                          {/* Chấm online */}
                          <OnlineDot userId={member.id} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-white truncate">
                              {member.username}
                            </p>
                            {member.isOwner && (
                              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 px-2 py-0.5 text-xs">
                                <Crown className="h-3 w-3 mr-1" />
                                Trưởng nhóm
                              </Badge>
                            )}
                            {member.isMine && (
                              <Badge className="bg-gradient-to-r from-green-500 to-blue-700 text-white border-0 px-2 py-0.5 text-xs">
                                <User className="h-3 w-3 mr-1" />
                                Bạn
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-zinc-400 truncate">
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
                <div className="bg-zinc-900 rounded-xl p-6 space-y-6">
                  {/* Channel Type */}
                  <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      {channel.type === "personal" && otherUser ? (
                        <div className="relative">
                          <Avatar className="h-12 w-12 rounded-xl">
                            <AvatarImage src={otherUser.avatar || otherUser.github_avatar} alt={otherUser.username} />
                            <AvatarFallback className="bg-blue-800 text-white text-md">
                              {(otherUser.username?.[0] || otherUser.name?.[0] || otherUser.email?.[0] || "U").toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <OnlineDot userId={otherUser.id} />
                        </div>
                      ) : channel.type === "group" ? (
                        <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                          <Globe className="h-6 w-6 text-green-500" />
                        </div>
                      ) : channel.type === "group-private" ? (
                        <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                          <Lock className="h-6 w-6 text-orange-500" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-zinc-700 rounded-xl flex items-center justify-center">
                          <Hash className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-zinc-400">
                          Loại kênh
                        </p>
                        <p className="font-semibold text-white">
                          {getChannelTypeLabel(channel.type)}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-zinc-800 text-white border border-zinc-700 font-medium px-3 py-1">
                      {channel.type.toUpperCase()}
                    </Badge>
                  </div>

                  {/* Created Date */}
                  {channel.created_at && (
                    <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-700 to-red-900 rounded-lg flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-400">
                            Ngày tạo
                          </p>
                          <p className="font-semibold text-white">
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
                      <p className="text-sm text-zinc-400">
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
                    <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-700 to-green-900 rounded-lg flex items-center justify-center">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-400">
                            Số thành viên
                          </p>
                          <p className="font-semibold text-white">
                            {channel.member_count} người
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-zinc-800 text-white border border-zinc-700 px-3 py-1 font-medium">
                        {channel.member_count}
                      </Badge>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Channel Settings */}
              <TabsContent value="settings">
                <div className="p-4">
                  <ChannelUpdate
                    open={true}
                    onOpenChange={setOpenSettingsModal}
                    channelId={channel.id}
                    channelName={channel.type === "personal" && otherUser
                      ? (otherUser.username || otherUser.name || otherUser.email || channel.name)
                      : channel.name
                    }
                    channelData={channel}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
