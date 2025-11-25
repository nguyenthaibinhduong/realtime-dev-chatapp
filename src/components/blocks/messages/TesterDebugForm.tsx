import { useState, useRef, useEffect } from "react";
import { X, Upload, User, MessageSquare, FileText, Search, Link2, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import AvatarUser from "@/components/common/AvartarUser";

interface TesterDebugFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    channelMembers?: Array<{ id: string; name: string; username?: string; avatar?: string }>;
    channelMessages?: Array<{ id: string; text: string; sender: { name: string }; created_at: string }>;
    onSubmit: (data: TesterDebugData) => void;
}

export interface TesterDebugData {
    projectName: string;
    relatedMessageId?: string;
    content: string;
    attachments: File[];
    assignees: string[];
    notes: string;
    syncGoogleSheet: boolean;
    driveLink: string;
}

const ALLOWED_FILE_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png'
];

// Quill editor modules
const quillModules = {
    toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ color: [] }, { background: [] }],
        ['link', 'code-block'],
        ['clean']
    ]
};

const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'link', 'code-block'
];

export const TesterDebugForm = ({
    open,
    onOpenChange,
    channelMembers = [],
    channelMessages = [],
    onSubmit
}: TesterDebugFormProps) => {
    const [projectName, setProjectName] = useState("");
    const [relatedMessageId, setRelatedMessageId] = useState<string | undefined>();
    const [content, setContent] = useState("");
    const [attachments, setAttachments] = useState<File[]>([]);
    const [assignees, setAssignees] = useState<string[]>([]);
    const [notes, setNotes] = useState("");
    const [syncGoogleSheet, setSyncGoogleSheet] = useState(false);
    const [driveLink, setDriveLink] = useState("");
    const [searchMessage, setSearchMessage] = useState("");
    const [searchMember, setSearchMember] = useState("");
    const [showMemberDropdown, setShowMemberDropdown] = useState(false);
    const [showMessageDropdown, setShowMessageDropdown] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const fileInputRef = useRef<HTMLInputElement>(null);
    const memberDropdownRef = useRef<HTMLDivElement>(null);
    const messageDropdownRef = useRef<HTMLDivElement>(null);

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
            // ESC to close
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

    const selectMessage = (messageId: string) => {
        setRelatedMessageId(messageId);
        setShowMessageDropdown(false);
        setErrors({ ...errors, projectOrMessage: "" });
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

        if (!projectName.trim() && !relatedMessageId) {
            newErrors.projectOrMessage = "Cần nhập tên dự án hoặc chọn yêu cầu gốc";
        }

        if (!content.trim() || content === '<p><br></p>') {
            newErrors.content = "Nội dung là bắt buộc";
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
            const data: TesterDebugData = {
                projectName: projectName.trim(),
                relatedMessageId,
                content: content.trim(),
                attachments,
                assignees,
                notes: notes.trim(),
                syncGoogleSheet,
                driveLink: driveLink.trim()
            };

            console.log("🐛 Tester Debug Report Data:", data);
            console.log("  📌 Project:", data.projectName);
            console.log("  🔗 Related Message:", data.relatedMessageId);
            console.log("  📝 Content:", data.content);
            console.log("  📎 Attachments:", data.attachments.map(f => f.name));
            console.log("  👥 Assignees:", data.assignees);
            console.log("  📄 Notes:", data.notes);
            console.log("  📊 Sync Google Sheet:", data.syncGoogleSheet);
            console.log("  🔗 Drive Link:", data.driveLink);

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
    const selectedMessage = relatedMessageId
        ? channelMessages.find(m => m.id === relatedMessageId)
        : undefined;

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="bg-[#0f1419] border-gray-800 max-h-[95vh]">
                <DrawerHeader className="border-b border-gray-800">
                    <DrawerTitle className="text-2xl font-bold text-black dark:text-white flex items-center gap-2">
                        <span className="bg-red-600 text-black dark:text-white px-2 py-1 rounded text-sm">BUG</span>
                        Tester Debug Report
                    </DrawerTitle>
                    <DrawerDescription className="text-gray-400">
                        Báo cáo lỗi và debug
                    </DrawerDescription>
                </DrawerHeader>

                <div className="flex-1 p-6 overflow-y-auto space-y-6">
                    <div className="space-y-2">
                        <Label className="text-black dark:text-white text-sm font-semibold flex items-center gap-1">
                            Tên dự án hoặc Yêu cầu gốc
                            <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            value={projectName}
                            onChange={(e) => {
                                setProjectName(e.target.value);
                                setErrors({ ...errors, projectOrMessage: "" });
                            }}
                            placeholder="Nhập tên dự án / khách hàng..."
                            className={`bg-gray-900 border-gray-700 text-black dark:text-white placeholder:text-gray-500 focus:border-red-500 ${errors.projectOrMessage ? "border-red-500" : ""
                                }`}
                            disabled={!!relatedMessageId}
                        />

                        <div className="text-center text-gray-500 text-sm py-2">hoặc</div>

                        <div className="relative" ref={messageDropdownRef}>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setShowMessageDropdown(!showMessageDropdown);
                                    setShowMemberDropdown(false);
                                }}
                                className={`w-full justify-start bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800 transition-all ${errors.projectOrMessage ? "border-red-500" : ""
                                    }`}
                                disabled={!!projectName.trim()}
                            >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                {relatedMessageId
                                    ? "Đã chọn yêu cầu gốc"
                                    : "Chọn yêu cầu gốc từ tin nhắn..."}
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
                                    <div className="max-h-60 overflow-y-auto">
                                        {filteredMessages.map((message) => (
                                            <div
                                                key={message.id}
                                                onClick={() => selectMessage(message.id)}
                                                className="flex items-start gap-3 p-3 hover:bg-gray-800 cursor-pointer transition-colors border-b border-gray-800 last:border-0"
                                            >
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

                        {errors.projectOrMessage && (
                            <p className="text-xs text-red-500">{errors.projectOrMessage}</p>
                        )}

                        {/* Selected Message Display */}
                        {selectedMessage && (
                            <div className="p-3 bg-gray-900 rounded-lg border border-red-800 flex items-start gap-2">
                                <MessageSquare className="h-4 w-4 text-red-400 mt-1 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-red-400 font-semibold mb-1">Yêu cầu gốc</p>
                                    <p className="text-xs text-gray-500">{selectedMessage.sender.name}</p>
                                    <p className="text-sm text-gray-200 line-clamp-2 mt-1">{selectedMessage.text}</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        setRelatedMessageId(undefined);
                                        setErrors({ ...errors, projectOrMessage: "" });
                                    }}
                                    className="h-6 w-6 text-red-400 hover:text-red-500 hover:bg-red-950"
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Content - Rich Text Editor */}
                    <div className="space-y-2">
                        <Label className="text-black dark:text-white text-sm font-semibold flex items-center gap-1">
                            Nội dung
                            <span className="text-red-500">*</span>
                        </Label>
                        <div className={`bg-gray-900 rounded-lg border ${errors.content ? "border-red-500" : "border-gray-700"}`}>
                            <ReactQuill
                                theme="snow"
                                value={content}
                                onChange={(value) => {
                                    setContent(value);
                                    setErrors({ ...errors, content: "" });
                                }}
                                modules={quillModules}
                                formats={quillFormats}
                                placeholder="Mô tả chi tiết về bug, các bước tái hiện, kết quả mong đợi..."
                                className="text-black  [&_.ql-editor]:min-h-[200px] [&_.ql-editor]:text-black dark:text-white [&_.ql-toolbar]:border-gray-700 [&_.ql-container]:border-gray-700"
                            />
                        </div>
                        {errors.content && (
                            <p className="text-xs text-red-500">{errors.content}</p>
                        )}
                    </div>

                    {/* Attachments */}
                    <div className="space-y-2">
                        <Label className="text-black dark:text-white text-sm font-semibold">Tài liệu đính kèm</Label>
                        <div
                            className="flex items-center gap-2 p-4 border-2 border-dashed border-gray-700 rounded-lg hover:border-red-500 transition-colors"
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.add('border-red-500', 'bg-red-950/20');
                            }}
                            onDragLeave={(e) => {
                                e.currentTarget.classList.remove('border-red-500', 'bg-red-950/20');
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.remove('border-red-500', 'bg-red-950/20');
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
                            <span className="text-xs text-gray-500">Kéo thả hoặc chọn: Screenshots, logs, documents</span>
                        </div>

                        {attachments.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 mt-3">
                                {attachments.map((file, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center gap-2 p-2 bg-gray-900 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors group"
                                    >
                                        {file.type.startsWith('image/') ? (
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt={file.name}
                                                className="h-10 w-10 rounded object-cover flex-shrink-0"
                                            />
                                        ) : (
                                            <div className="h-10 w-10 rounded bg-red-950 flex items-center justify-center flex-shrink-0">
                                                <FileText className="h-5 w-5 text-red-400" />
                                            </div>
                                        )}
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
                                            <X className="h-3 w-3" />
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
                                                        className="h-4 w-4 rounded border-gray-600 text-red-600 focus:ring-red-500"
                                                    />
                                                    <AvatarUser user={member} isMe={false} size="sm" />
                                                    <div className="flex-1">
                                                        <p className="text-sm text-black dark:text-white">{member.name}</p>
                                                        {member.username && (
                                                            <p className="text-xs text-gray-500">@{member.username}</p>
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

                        {selectedMembers.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {selectedMembers.map((member) => (
                                    <Badge
                                        key={member.id}
                                        variant="secondary"
                                        className="bg-red-950 text-red-200 hover:bg-red-900"
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

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label className="text-black dark:text-white text-sm font-semibold">Ghi chú</Label>
                        <Input
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Thêm ghi chú (không bắt buộc)..."
                            className="bg-gray-900 border-gray-700 text-black dark:text-white placeholder:text-gray-500 focus:border-red-500"
                        />
                    </div>

                    {/* Google Sheet Sync Toggle */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-800">
                            <div className="flex items-center gap-3">
                                {syncGoogleSheet ? (
                                    <ToggleRight className="h-6 w-6 text-green-500" />
                                ) : (
                                    <ToggleLeft className="h-6 w-6 text-gray-500" />
                                )}
                                <div>
                                    <Label className="text-black dark:text-white text-sm font-semibold cursor-pointer">
                                        Đồng bộ Google Sheet
                                    </Label>
                                    <p className="text-xs text-gray-500">Tự động cập nhật vào bảng tính</p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSyncGoogleSheet(!syncGoogleSheet)}
                                className={`${syncGoogleSheet
                                    ? "bg-green-950 border-green-800 text-green-200 hover:bg-green-900"
                                    : "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700"
                                    }`}
                            >
                                {syncGoogleSheet ? "Bật" : "Tắt"}
                            </Button>
                        </div>
                    </div>

                    {/* Drive Link */}
                    <div className="space-y-2">
                        <Label className="text-black dark:text-white text-sm font-semibold flex items-center gap-2">
                            <Link2 className="h-4 w-4" />
                            Thông tin Lưu trữ
                        </Label>
                        <Input
                            value={driveLink}
                            onChange={(e) => setDriveLink(e.target.value)}
                            placeholder="Nhập link Google Drive (nếu có)..."
                            className="bg-gray-900 border-gray-700 text-black dark:text-white placeholder:text-gray-500 focus:border-red-500"
                        />
                        <p className="text-xs text-gray-500">Link đến folder lưu trữ screenshots, videos, logs...</p>
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
                                className="bg-red-600 hover:bg-red-700 text-black dark:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isSubmitting || (!projectName.trim() && !relatedMessageId) || !content.trim() || content === '<p><br></p>' || assignees.length === 0}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Đang tạo...
                                    </>
                                ) : (
                                    <>
                                        <span className="bg-white text-red-600 px-2 py-0.5 rounded text-xs font-bold mr-2">BUG</span>
                                        Tạo Report
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
