import { useState, useRef, useEffect } from "react";
import { X, Plus, Trash2, Upload, User, MessageSquare, FileText, Search, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { Member } from "@/types/channel";
import AvatarUser from "@/components/common/AvartarUser";
import { ROLES } from "@/components/blocks/channels/ChannelSettings";
import { cn } from "@/lib/utils";

interface BARequirementFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    channelMembers?: Array<Member | any>;
    channelMessages?: Array<{ id: string; text: string; sender: { name: string }; created_at: string } | any>;
    onSubmit: (data: BARequirementData) => void;
    memberRoles?: Array<any>
}

export interface BARequirementData {
    projectName: string;
    requirements: string[];
    attachments: File[];
    assignees: string[];
    relatedMessages: string[];
    notes: string;
}

const ALLOWED_FILE_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png'
];

const FILE_TYPE_EXTENSIONS = {
    'application/pdf': '.pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'image/jpeg': '.jpg',
    'image/png': '.png'
};

export const BARequirementForm = ({
    open,
    onOpenChange,
    channelMembers = [],
    channelMessages = [],
    onSubmit,
    memberRoles = []
}: BARequirementFormProps) => {
    const [projectName, setProjectName] = useState("");
    const [requirements, setRequirements] = useState<string[]>([""]);
    const [currentReq, setCurrentReq] = useState("");
    const [attachments, setAttachments] = useState<File[]>([]);
    const [assignees, setAssignees] = useState<string[]>([]);
    const [relatedMessages, setRelatedMessages] = useState<string[]>([]);
    const [notes, setNotes] = useState("");
    const [searchMessage, setSearchMessage] = useState("");
    const [searchMember, setSearchMember] = useState("");
    const [showMemberDropdown, setShowMemberDropdown] = useState(false);
    const [showMessageDropdown, setShowMessageDropdown] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const reqInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const memberDropdownRef = useRef<HTMLDivElement>(null);
    const messageDropdownRef = useRef<HTMLDivElement>(null);



    useEffect(() => {
        // Auto focus on first input
        const timer = setTimeout(() => {
            reqInputRef.current?.focus();
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (memberDropdownRef.current && !memberDropdownRef.current.contains(event.target as Node)) {
                setShowMemberDropdown(false);
                setSearchMember("");
            }
            if (messageDropdownRef.current && !messageDropdownRef.current.contains(event.target as Node)) {
                setShowMessageDropdown(false);
            }
        };

        if (showMemberDropdown || showMessageDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showMemberDropdown, showMessageDropdown]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // ESC to close form
            if (e.key === 'Escape') {
                if (showMemberDropdown) {
                    setShowMemberDropdown(false);
                } else if (showMessageDropdown) {
                    setShowMessageDropdown(false);
                } else {
                    onOpenChange(false);
                }
            }
            // Ctrl/Cmd + Enter to submit
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                handleSubmit();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [showMemberDropdown, showMessageDropdown]);

    const addRequirement = () => {
        if (currentReq.trim()) {
            setRequirements([...requirements.filter(r => r), currentReq.trim()]);
            setCurrentReq("");
            setErrors({ ...errors, requirements: "" });
        }
    };

    const removeRequirement = (index: number) => {
        setRequirements(requirements.filter((_, i) => i !== index));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const validFiles = files.filter(file => {
            if (!ALLOWED_FILE_TYPES.includes(file.type)) {
                alert(`File ${file.name} không được hỗ trợ. Chỉ chấp nhận: PDF, DOCX, XLSX, JPG, PNG`);
                return false;
            }
            return true;
        });
        setAttachments([...attachments, ...validFiles]);
    };

    const removeAttachment = (index: number) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    const toggleAssignee = (memberId: string) => {
        setAssignees(prev =>
            prev.includes(memberId)
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId]
        );
        setErrors({ ...errors, assignees: "" });
    };

    const toggleMessage = (messageId: string) => {
        setRelatedMessages(prev =>
            prev.includes(messageId)
                ? prev.filter(id => id !== messageId)
                : [...prev, messageId]
        );
    };

    const filteredMessages = channelMessages.filter(msg =>
        (msg.text?.toLowerCase() || '').includes(searchMessage.toLowerCase()) ||
        (msg.sender?.name?.toLowerCase() || '').includes(searchMessage.toLowerCase())
    );

    const filteredMembers = channelMembers.filter(member =>
        (member.name?.toLowerCase() || '').includes(searchMember.toLowerCase()) ||
        (member.username?.toLowerCase() || '').includes(searchMember.toLowerCase())
    );

    const validate = () => {
        const newErrors: { [key: string]: string } = {};

        if (!projectName.trim()) {
            newErrors.projectName = "Tên dự án là bắt buộc";
        }

        const validReqs = requirements.filter(r => r.trim());
        if (validReqs.length === 0 && !currentReq.trim()) {
            newErrors.requirements = "Cần ít nhất 1 yêu cầu";
        }

        if (assignees.length === 0) {
            newErrors.assignees = "Cần chọn ít nhất 1 người phụ trách";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!validate() || isSubmitting) return;

        setIsSubmitting(true);

        try {
            const validRequirements = [...requirements.filter(r => r.trim())];
            if (currentReq.trim()) {
                validRequirements.push(currentReq.trim());
            }

            const data: BARequirementData = {
                projectName: projectName.trim(),
                requirements: validRequirements,
                attachments,
                assignees,
                relatedMessages,
                notes: notes.trim()
            };

            console.log("📋 BA Requirement Data:", data);
            console.log("  📌 Project:", data.projectName);
            console.log("  📝 Requirements:", data.requirements);
            console.log("  📎 Attachments:", data.attachments.map(f => f.name));
            console.log("  👥 Assignees:", data.assignees);
            console.log("  💬 Related Messages:", data.relatedMessages);
            console.log("  📄 Notes:", data.notes);

            await onSubmit(data);

            // Small delay for better UX feedback
            setTimeout(() => {
                onOpenChange(false);
            }, 200);
        } catch (error) {
            console.error('Submit error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedMembers = channelMembers.filter(m => assignees.includes(m.id));
    const selectedMessages = channelMessages.filter(m => relatedMessages.includes(m.id));

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="bg-[#0f1419] border-gray-800 max-h-[95vh]">
                <DrawerHeader className="border-b border-gray-800">
                    <DrawerTitle className="text-2xl font-bold text-black dark:text-white flex items-center gap-2">
                        <FileText className="h-6 w-6 text-blue-500" />
                        BA Requirement
                    </DrawerTitle>
                    <DrawerDescription className="text-gray-400">
                        Tạo yêu cầu dự án mới
                    </DrawerDescription>
                </DrawerHeader>

                <div className="flex-1 p-6 overflow-y-auto">
                    <div className="space-y-6">
                        {/* Project Name */}
                        <div className="space-y-2 px-2">
                            <Label className="text-black dark:text-white text-sm font-semibold flex items-center gap-1">
                                Tên dự án / Khách hàng
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                value={projectName}
                                onChange={(e) => {
                                    setProjectName(e.target.value);
                                    setErrors({ ...errors, projectName: "" });
                                }}
                                placeholder="Nhập tên dự án hoặc khách hàng..."
                                className={`bg-gray-900 border-gray-700 text-black dark:text-white placeholder:text-gray-500 focus:border-blue-500 ${errors.projectName ? "border-red-500" : ""
                                    }`}
                            />
                            {errors.projectName && (
                                <p className="text-xs text-red-500">{errors.projectName}</p>
                            )}
                        </div>

                        {/* Requirements */}
                        <div className="space-y-2">
                            <Label className="text-black dark:text-white text-sm font-semibold flex items-center gap-1">
                                Danh sách yêu cầu
                                <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    ref={reqInputRef}
                                    value={currentReq}
                                    onChange={(e) => setCurrentReq(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            addRequirement();
                                            reqInputRef.current?.focus();
                                        }
                                        if (e.key === "Tab" && !e.shiftKey && requirements.filter(r => r).length > 0) {
                                            // Auto add current if has content, then move to next section
                                            if (currentReq.trim()) {
                                                addRequirement();
                                            }
                                        }
                                    }}
                                    placeholder="Nhập yêu cầu và nhấn Enter... (Tab để chuyển tiếp)"
                                    className="bg-gray-900 border-gray-700 text-black dark:text-white placeholder:text-gray-500 focus:border-blue-500 flex-1"
                                />
                                <Button
                                    onClick={addRequirement}
                                    size="icon"
                                    className="bg-blue-600 hover:bg-blue-700"
                                    disabled={!currentReq.trim()}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            {errors.requirements && (
                                <p className="text-xs text-red-500">{errors.requirements}</p>
                            )}

                            {/* Requirements List */}
                            {requirements.filter(r => r).length > 0 && (
                                <div className="mt-3 space-y-2 bg-gray-900/50 rounded-lg p-3 border border-gray-800">
                                    {requirements.filter(r => r).map((req, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-start gap-2 p-2 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors group"
                                        >
                                            <span className="text-blue-400 font-mono text-sm mt-0.5">{idx + 1}.</span>
                                            <p className="flex-1 text-sm text-gray-200">{req}</p>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeRequirement(idx)}
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-500 hover:bg-red-950"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Attachments */}
                        <div className="space-y-2">
                            <Label className="text-black dark:text-white text-sm font-semibold">Tài liệu đính kèm</Label>
                            <div
                                className="flex items-center gap-2 p-4 border-2 border-dashed border-gray-700 rounded-lg hover:border-blue-500 transition-colors"
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.classList.add('border-blue-500', 'bg-blue-950/20');
                                }}
                                onDragLeave={(e) => {
                                    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-950/20');
                                }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-950/20');
                                    const files = Array.from(e.dataTransfer.files);
                                    const validFiles = files.filter(file => {
                                        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
                                            return false;
                                        }
                                        return true;
                                    });
                                    setAttachments([...attachments, ...validFiles]);
                                }}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <Button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    variant="outline"
                                    className="bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-black dark:text-white"
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Chọn tệp
                                </Button>
                                <span className="text-xs text-gray-500">Kéo thả hoặc chọn: PDF, DOCX, XLSX, JPG, PNG</span>
                            </div>

                            {/* Attachments Preview */}
                            {attachments.length > 0 && (
                                <div className="grid grid-cols-2 gap-2 mt-3">
                                    {attachments.map((file, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center gap-2 p-2 bg-gray-900 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors group"
                                        >
                                            <div className="h-10 w-10 rounded bg-blue-950 flex items-center justify-center flex-shrink-0">
                                                <FileText className="h-5 w-5 text-blue-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-200 truncate">{file.name}</p>
                                                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeAttachment(idx)}
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-500 hover:bg-red-950"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Assignees */}
                        <div className="space-y-2">
                            <Label className="text-black dark:text-white text-sm font-semibold flex items-center gap-1">
                                Người phụ trách
                                <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative" ref={memberDropdownRef}>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setShowMemberDropdown(!showMemberDropdown);
                                        setShowMessageDropdown(false);
                                    }}
                                    className={`w-full justify-start bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800 transition-all ${errors.assignees ? "border-red-500" : ""
                                        }`}
                                >
                                    <User className="h-4 w-4 mr-2" />
                                    {assignees.length > 0
                                        ? `Đã chọn ${assignees.length} người`
                                        : "Chọn người phụ trách..."}
                                </Button>

                                {showMemberDropdown && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-[110] overflow-hidden animate-in slide-in-from-top-2 duration-200">
                                        <div className="p-2 border-b border-gray-700">
                                            <Input
                                                value={searchMember}
                                                onChange={(e) => setSearchMember(e.target.value)}
                                                placeholder="Tìm kiếm thành viên..."
                                                className="bg-gray-800 border-gray-600 text-black dark:text-white placeholder:text-gray-500 h-8 text-sm"
                                                autoFocus
                                            />
                                        </div>
                                        <div className="max-h-60 overflow-y-auto">
                                            {filteredMembers.length === 0 ? (
                                                <div className="p-3 text-sm text-gray-400 text-center">
                                                    {searchMember ? 'Không tìm thấy thành viên' : 'Không có thành viên'}
                                                </div>
                                            ) : (
                                                filteredMembers.map((member) => (
                                                    <div
                                                        key={member.id}
                                                        onClick={() => {
                                                            toggleAssignee(member.id);
                                                            setSearchMember("");
                                                        }}
                                                        className="flex items-center gap-3 p-3 hover:bg-gray-800 cursor-pointer transition-colors"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={assignees.includes(member.id)}
                                                            onChange={() => { }}
                                                            className="h-4 w-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <AvatarUser user={member} isMe={false} size="sm" />
                                                        <div className="flex-1">
                                                            <p className="text-sm text-black dark:text-white">{member.name}</p>
                                                            {member.username && (
                                                                <p className="text-xs text-gray-500">@{member.username}</p>
                                                            )}
                                                            {memberRoles && memberRoles.map(mr => mr.userId).includes(member.id) && (
                                                                <div className="flex items-center gap-1 mt-1">
                                                                    {memberRoles.find(mr => mr.userId === member.id).roles.map((roleId: number) => {
                                                                        const role = ROLES.find(r => r.id === roleId);
                                                                        if (!role) return null;
                                                                        return (<Badge
                                                                            key={role.id}
                                                                            className={cn("text-xs font-medium px-2 py-0.5", role.color, role.bgColor, role.borderColor, "border")}
                                                                        >{role.name}</Badge>);
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            {errors.assignees && (
                                <p className="text-xs text-red-500">{errors.assignees}</p>
                            )}

                            {/* Selected Members */}
                            {selectedMembers.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {selectedMembers.map((member) => (
                                        <Badge
                                            key={member.id}
                                            variant="secondary"
                                            className="bg-blue-950 text-blue-200 hover:bg-blue-900"
                                        >
                                            {member.name}
                                            <X
                                                className="h-3 w-3 ml-1 cursor-pointer"
                                                onClick={() => toggleAssignee(member.id)}
                                            />
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Related Messages */}
                        <div className="space-y-2">
                            <Label className="text-black dark:text-white text-sm font-semibold">Tin nhắn liên quan</Label>
                            <div className="relative" ref={messageDropdownRef}>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setShowMessageDropdown(!showMessageDropdown);
                                        setShowMemberDropdown(false);
                                    }}
                                    className="w-full justify-start bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800 transition-all"
                                >
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    {relatedMessages.length > 0
                                        ? `Đã chọn ${relatedMessages.length} tin nhắn`
                                        : "Chọn tin nhắn liên quan..."}
                                </Button>

                                {showMessageDropdown && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-[110] animate-in slide-in-from-top-2 duration-200">
                                        <div className="p-2 border-b border-gray-800">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                                <Input
                                                    value={searchMessage}
                                                    onChange={(e) => setSearchMessage(e.target.value)}
                                                    placeholder="Tìm kiếm tin nhắn..."
                                                    className="pl-9 bg-gray-800 border-gray-700 text-black dark:text-white"
                                                />
                                            </div>
                                        </div>
                                        <div className="max-h-40 overflow-y-auto">
                                            {filteredMessages.map((message) => (
                                                <div
                                                    key={message.id}
                                                    onClick={() => toggleMessage(message.id)}
                                                    className="flex items-start gap-3 p-3 hover:bg-gray-800 cursor-pointer transition-colors border-b border-gray-800 last:border-0"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={relatedMessages.includes(message.id)}
                                                        onChange={() => { }}
                                                        className="mt-1 h-4 w-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs text-gray-500 mb-1">{message.sender.name}</p>
                                                        <p className="text-sm text-gray-200 line-clamp-2">{message.text}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Selected Messages */}
                            {selectedMessages.length > 0 && (
                                <div className="space-y-2 mt-2">
                                    {selectedMessages.map((message) => (
                                        <div
                                            key={message.id}
                                            className="p-2 bg-gray-900 rounded-lg border border-gray-800 flex items-start gap-2 group"
                                        >
                                            <MessageSquare className="h-4 w-4 text-blue-400 mt-1 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-gray-500">{message.sender.name}</p>
                                                <p className="text-sm text-gray-200 line-clamp-1">{message.text}</p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => toggleMessage(message.id)}
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-500 hover:bg-red-950"
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label className="text-black dark:text-white text-sm font-semibold">Ghi chú</Label>
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Thêm ghi chú (không bắt buộc)..."
                                className="bg-gray-900 border-gray-700 text-black dark:text-white placeholder:text-gray-500 focus:border-blue-500 min-h-[100px]"
                            />
                        </div>
                    </div>
                </div>

                <DrawerFooter className="border-t border-gray-800">
                    <div className="flex items-center justify-between w-full">
                        <div className="text-xs text-gray-500">
                            <kbd className="px-2 py-1 bg-gray-800 rounded text-gray-400 font-mono">ESC</kbd> để đóng •
                            <kbd className="px-2 py-1 bg-gray-800 rounded text-gray-400 font-mono">Ctrl+Enter</kbd> để gửi
                        </div>
                        <div className="flex gap-3">
                            <DrawerClose asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-black dark:text-white transition-all"
                                >
                                    Hủy
                                </Button>
                            </DrawerClose>
                            <Button
                                type="button"
                                onClick={handleSubmit}
                                className="bg-blue-600 hover:bg-blue-700 text-black dark:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isSubmitting || (!projectName.trim() && (requirements.filter(r => r).length === 0 && !currentReq.trim()) && assignees.length === 0)}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Đang tạo...
                                    </>
                                ) : (
                                    <>
                                        <FileText className="h-4 w-4 mr-2" />
                                        Tạo Requirement
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
};
