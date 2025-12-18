import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Circle, Clock, CheckCircle } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { chatSocketService } from "@/services/chatSocketService";
import { toast } from "@/hooks/useToast";

export const StatusDropDown = ({ 
  msg
}: { 
  msg: any;
}) => {
  const [statusValue, setStatusValue] = useState<string>(msg?.json_data?.status || "open");
  const {user} = useAuth();

  useEffect(() => {
    setStatusValue(msg?.json_data?.status || "open");
  }, [msg?.json_data?.status]);
  
  const disabled = useCallback(() => {
    const actor = [msg?.sender?.id, ...(msg?.json_data?.assignees || [])];
    const disabled = actor.includes(user?.id);
    return !disabled;
  }, [msg, user])();


    const handleStatusChange = async (newStatus: string) => {
      const channelId = localStorage.getItem("selectedChannelId") || "";
    try {
      await chatSocketService.sendMessage({
        id: msg.id,
        json_data: {
          ...msg.json_data,
          status: newStatus,
        },
        channelId,
        isUpdate: true,
      });
      toast({
        title: "Cập nhật thành công",
        description: `Trạng thái đã chuyển sang: ${
          newStatus === 'open' ? 'Chờ thực hiện' :
          newStatus === 'in_progress' ? 'Đang thực hiện' : 'Hoàn thành'
        }`,
      });
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể cập nhật trạng thái",
        variant: "destructive",
      });
    }
  };


  // ✅ Config cho từng status
  const statusConfig = {
    open: {
      label: "Chờ thực hiện",
      icon: Circle,
      textColor: "text-blue-400",
      bgColor: "bg-blue-500/20",
      borderColor: "border-blue-500/50",
      hoverBg: "hover:bg-blue-500/30",
      itemHoverBg: "hover:bg-blue-500/20",
    },
    in_progress: {
      label: "Đang thực hiện",
      icon: Clock,
      textColor: "text-yellow-400",
      bgColor: "bg-yellow-500/20",
      borderColor: "border-yellow-500/50",
      hoverBg: "hover:bg-yellow-500/30",
      itemHoverBg: "hover:bg-yellow-500/20",
    },
    completed: {
      label: "Hoàn thành",
      icon: CheckCircle,
      textColor: "text-green-400",
      bgColor: "bg-green-500/20",
      borderColor: "border-green-500/50",
      hoverBg: "hover:bg-green-500/30",
      itemHoverBg: "hover:bg-green-500/20",
    },
  };

  const currentStatus = statusConfig[statusValue as keyof typeof statusConfig] || statusConfig.open;
  const CurrentIcon = currentStatus.icon;

  return (
    <Select 
      value={statusValue} 
      onValueChange={(v) => { 
        setStatusValue(v); 
        handleStatusChange(v);
      }} 
      disabled={disabled}
    >
      <SelectTrigger 
        className={cn(
          "w-auto min-w-[160px] h-9",
          "border rounded-full px-4",
          "font-medium text-sm",
          "transition-all duration-200",
          "focus:ring-2 focus:ring-offset-0",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          currentStatus.bgColor,
          currentStatus.borderColor,
          currentStatus.textColor,
          currentStatus.hoverBg,
          !disabled && "hover:shadow-lg hover:scale-[1.02]"
        )}
      >
        <div className="flex items-center gap-2">
          <CurrentIcon className="h-3.5 w-3.5" />
          <span>{currentStatus.label}</span>
        </div>
      </SelectTrigger>
      
      <SelectContent 
        className="bg-[#1a1d29] border-gray-700 rounded-xl p-2 min-w-[200px]"
        sideOffset={8}
      >
        {/* Open Status */}
        <SelectItem 
          value="open" 
          className={cn(
            "cursor-pointer rounded-lg px-3 py-2.5 my-1",
            "transition-all duration-150",
            "focus:outline-none focus:bg-blue-500/20",
            "data-[state=checked]:bg-blue-500/30",
            statusConfig.open.itemHoverBg
          )}
        >
          <div className="flex items-center gap-3">
            <Circle className="h-4 w-4 text-blue-400" />
            <span className="text-blue-400 font-medium">Chờ thực hiện</span>
          </div>
        </SelectItem>

        {/* In Progress Status */}
        <SelectItem 
          value="in_progress" 
          className={cn(
            "cursor-pointer rounded-lg px-3 py-2.5 my-1",
            "transition-all duration-150",
            "focus:outline-none focus:bg-yellow-500/20",
            "data-[state=checked]:bg-yellow-500/30",
            statusConfig.in_progress.itemHoverBg
          )}
        >
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-yellow-400" />
            <span className="text-yellow-400 font-medium">Đang thực hiện</span>
          </div>
        </SelectItem>

        {/* Completed Status */}
        <SelectItem 
          value="completed" 
          className={cn(
            "cursor-pointer rounded-lg px-3 py-2.5 my-1",
            "transition-all duration-150",
            "focus:outline-none focus:bg-green-500/20",
            "data-[state=checked]:bg-green-500/30",
            statusConfig.completed.itemHoverBg
          )}
        >
          <div className="flex items-center gap-3">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <span className="text-green-400 font-medium">Hoàn thành</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
};