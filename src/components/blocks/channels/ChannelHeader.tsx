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
import { Button } from "@/components/ui/button";
import { GithubAPI } from "@/api/api";
import { toast } from "@/hooks/useToast";
import { RepoChatDialog } from "../github/RepoChatDialog";
import { AttachmentModal } from "../attachments/AttachmentModal";
import AvatarUser from "@/components/common/AvartarUser";
import { AvatarGroupGrid } from "@/components/common/AvatarGroup";
import { ToolType, TOOL_CONFIGS } from "../tools";

interface ChannelHeaderProps {
  channel: Channel;
  members: Member[];
  selectedTool?: ToolType;
  onToolChange?: (tool: ToolType) => void;
}

const getChannelIcon = (channel: Channel, user?: any) => {
  if (channel.type === "group" || channel.type === "group-private") return <AvatarGroupGrid users={channel.members} tile={18} />;
  if (channel.type === "personal") {
    return (
      <div className="relative mr-2">
        <AvatarUser user={user} size={8} />
        {/* Chấm online */}
        {
          user?.id && channel.members && (
            <OnlineDot userId={user?.id} />

          )
        }
      </div>
    );
  }
  return <Hash className="h-4 w-4 mr-2 text-muted-foreground" />;
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

export const ChannelHeader = ({ channel, members, selectedTool, onToolChange }: ChannelHeaderProps) => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("members");
  const [otherUser, setOtherUser] = useState<any>();
  const { user } = useAuth();
  const [openGitModal, setOpenGitModal] = useState(false);
  const [openAttachmentModal, setOpenAttachmentModal] = useState(false);

  useEffect(() => {
    if (channel.type === "personal" && members && user?.id) {
      const otherMember = members.find((m: any) => m.id !== user.id);
      setOtherUser(otherMember);
    }
    console.log("Other User ID:", otherUser);
  }, [channel, members, user]);


  return (
    <div className="h-14 border-b border-border bg-card px-6 py-2 flex items-center justify-between">
      <div className="flex items-center">
        {channel.type === "personal"
          ? getChannelIcon(channel, otherUser)
          : getChannelIcon(channel)}
        <h2 className="font-semibold text-foreground ml-2">{channel.name}</h2>
        {channel.member_count > 2 && (
          <>
            <Separator orientation="vertical" className="mx-3 h-4 " />
            <p className="text-sm text-muted-foreground">
              {channel.member_count} thành viên
            </p>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        {/* Nút mở attachment modal */}
        <button
          className="p-2 rounded-lg hover:bg-muted transition-colors duration-200 group"
          title="Xem tệp đính kèm"
          onClick={() => setOpenAttachmentModal(true)}
        >
          <Paperclip className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
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
              className={`p-2 rounded-lg hover:bg-muted transition-colors duration-200 group ${selectedTool ? 'bg-blue-500/10 text-blue-400' : ''
                }`}
              title="Tools"
            >
              <div className="flex items-center gap-1">
                <Wrench className={`h-5 w-5 transition-colors ${selectedTool
                  ? 'text-blue-400'
                  : 'text-muted-foreground group-hover:text-foreground'
                  }`} />
                {selectedTool && (
                  <ChevronDown className="h-3 w-3 text-blue-400" />
                )}
              </div>
              <span className="sr-only">Tools</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-gray-900 border-gray-700">
            {Object.values(TOOL_CONFIGS).map((tool) => (
              <DropdownMenuItem
                key={tool.id}
                onClick={() => onToolChange?.(selectedTool === tool.id ? null : tool.id)}
                className={`cursor-pointer hover:bg-gray-800 ${selectedTool === tool.id ? 'bg-blue-900/50 text-blue-300' : 'text-gray-300'
                  }`}
              >
                <div className="flex items-center gap-3 w-full">
                  <span className="text-lg">{tool.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium">{tool.name}</div>
                    <div className="text-xs text-gray-500">{tool.description}</div>
                  </div>
                  {selectedTool === tool.id && (
                    <X className="h-4 w-4" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
            {selectedTool && (
              <>
                <DropdownMenuSeparator className="bg-gray-700" />
                <DropdownMenuItem
                  onClick={() => onToolChange?.(null)}
                  className="cursor-pointer hover:bg-gray-800 text-red-400"
                >
                  <X className="h-4 w-4 mr-2" />
                  Đóng tất cả tools
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Nút mở modal kết nối repo git */}
        <button
          className="p-2 rounded-lg  hover:bg-muted transition-colors duration-200"
          title="Chức năng GitHub"
          onClick={() => setOpenGitModal(true)}
        >
          <Github className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          <span className="sr-only">Kết nối repo Git</span>
        </button>
        <RepoChatDialog open={openGitModal} onOpenChange={setOpenGitModal} />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button
              className="p-2 rounded-lg  hover:bg-muted transition-colors duration-200"
              title="Xem thành viên"
              onClick={() => {
                setTab("members");
                setOpen(true);
              }}
            >
              <Users className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
          </DialogTrigger>
          <DialogTrigger asChild>
            <button
              className="p-2 rounded-lg  hover:bg-muted transition-colors duration-200"
              title="Thông tin kênh"
              onClick={() => {
                setTab("info");
                setOpen(true);
              }}
            >
              <Info className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
          </DialogTrigger>

          {/* Dark/Light Modal Design */}
          <DialogContent className="max-w-lg bg-zinc-950 text-white border border-zinc-800 shadow-2xl rounded-2xl overflow-hidden">
            {/* Header với background đen và viền trắng */}
            <div className="bg-zinc-900 border-b border-zinc-800 -mx-6 -mt-6 px-6 py-6 mb-6">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 flex items-center justify-center">
                    {channel.type === "personal"
                      ? getChannelIcon(channel, otherUser)
                      : getChannelIcon(channel)}

                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold text-white tracking-tight">
                      {channel.name}
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
              <TabsList className="grid w-full grid-cols-2 bg-zinc-900 rounded-xl p-1 shadow-sm border border-zinc-800">
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
                      <div className="w-10 h-10 bg-gradient-to-br from-zinc-700 to-zinc-900 rounded-lg flex items-center justify-center">
                        <Avatar className="h-12 w-12 rounded-xl">
                          <AvatarFallback className="bg-blue-800 text-white text-md">
                            {channel.name?.[0]?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        {/* Chấm online */}
                        {channel.type == "personal" && otherUser && (
                          <OnlineDot userId={otherUser} />
                        )}
                      </div>
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
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
