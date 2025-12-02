import { FolderOpen, File, Image, FileText, Music, Video, Archive, Filter, Search, X, ChevronLeft, Trash2, Download, Eye, Calendar, HardDrive, Hash, ChevronRight, Home } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { SystemAPI } from "@/api/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/useToast";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Channel {
    channelId: number;
    channelName: string;
    channelType: 'personal' | 'group' | 'group-private';
    fileCount: number;
    lastFileDate: string;
}

interface FileItem {
    id: number;
    filename: string;
    fileUrl: string;
    mimeType: string;
    fileSize: number;
    key: string;
    created_at: string;
    channel: {
        id: number;
        name: string;
        type: string;
    } | null;
    message: {
        id: number;
        text: string;
        send_at: string;
    } | null;
    user?: {
        id: number;
        username: string;
        email: string;
    };
}

interface FilterOptions {
    mimeType?: string;
    minSize?: number;
    maxSize?: number;
    startDate?: string;
    endDate?: string;
    filename?: string;
}

export default function FileManagement() {
    const [view, setView] = useState<'channels' | 'files'>('channels');
    const [channels, setChannels] = useState<Channel[]>([]);
    const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
    const [files, setFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingChannels, setLoadingChannels] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterOpen, setFilterOpen] = useState(false);
    const [filters, setFilters] = useState<FilterOptions>({});
    const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
    const [cursor, setCursor] = useState<number | null>(null);
    const [hasMore, setHasMore] = useState(false);

    // Load channels with file stats
    const loadChannels = async () => {
        setLoadingChannels(true);
        try {
            const response = await SystemAPI.FilesManagement({
                method: "list-channels-with-files",
            });
            if (response?.data?.channels) {
                setChannels(response.data.channels);
            }
        } catch (error) {
            console.error("Failed to load channels:", error);
            toast({
                title: "Lỗi",
                description: "Không thể tải danh sách kênh",
                variant: "destructive",
            });
        } finally {
            setLoadingChannels(false);
        }
    };

    // Load files by channel
    const loadFiles = async (channelId?: number, loadMore = false) => {
        setLoading(true);
        try {
            const params: any = {
                method: channelId ? "filter" : "list",
                limit: 50,
            };

            if (loadMore && cursor) {
                params.cursor = cursor;
            }

            if (channelId) {
                params.channelId = channelId;
            }

            // Apply filters - chỉ apply khi có giá trị
            if (filters.mimeType && filters.mimeType.trim()) {
                params.mimeType = filters.mimeType.trim();
            }
            if (filters.minSize && filters.minSize > 0) {
                params.minSize = filters.minSize;
            }
            if (filters.maxSize && filters.maxSize > 0) {
                params.maxSize = filters.maxSize;
            }
            if (filters.startDate && filters.startDate.trim()) {
                params.startDate = filters.startDate.trim();
            }
            if (filters.endDate && filters.endDate.trim()) {
                params.endDate = filters.endDate.trim();
            }
            if (searchQuery && searchQuery.trim()) {
                params.filename = searchQuery.trim();
            }

            const response = await SystemAPI.FilesManagement(params);

            if (response?.data) {
                const newFiles = response.data.files || [];
                setFiles(loadMore ? [...files, ...newFiles] : newFiles);
                setCursor(response.data.nextCursor || null);
                setHasMore(response.data.hasMore || false);
            }
        } catch (error) {
            console.error("Failed to load files:", error);
            toast({
                title: "Lỗi",
                description: "Không thể tải danh sách file",
                variant: "destructive",
            });
            setFiles([]);
            setCursor(null);
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    };

    // Delete file
    const handleDeleteFile = async (fileId: number, userId: number) => {
        if (!confirm("Bạn có chắc chắn muốn xóa file này?")) return;

        try {
            await SystemAPI.FilesManagement({
                method: "unlink",
                userId: userId,
                attachmentId: fileId,
            });

            toast({
                title: "Thành công",
                description: "Đã xóa file",
            });

            // Reload files
            if (selectedChannel) {
                await loadFiles(selectedChannel.channelId);
            } else {
                await loadFiles();
            }
        } catch (error: any) {
            console.error("Failed to delete file:", error);
            toast({
                title: "Lỗi",
                description: error?.response?.data?.msg || "Không thể xóa file",
                variant: "destructive",
            });
        }
    };

    // Get file icon
    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith("image/")) return <Image className="h-8 w-8" />;
        if (mimeType.startsWith("video/")) return <Video className="h-8 w-8" />;
        if (mimeType.startsWith("audio/")) return <Music className="h-8 w-8" />;
        if (mimeType.includes("pdf")) return <FileText className="h-8 w-8" />;
        if (mimeType.includes("zip") || mimeType.includes("rar")) return <Archive className="h-8 w-8" />;
        return <File className="h-8 w-8" />;
    };

    // Format file size
    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
    };

    // Format date
    const formatDate = (dateStr: string) => {
        return new Intl.DateTimeFormat("vi-VN", {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date(dateStr));
    };

    // Apply filters
    const applyFilters = () => {
        setCursor(null);
        setFiles([]); // Clear existing files
        if (selectedChannel) {
            loadFiles(selectedChannel.channelId);
        } else {
            loadFiles();
        }
        setFilterOpen(false);
    };

    // Clear filters
    const clearFilters = () => {
        setFilters({});
        setSearchQuery("");
        setCursor(null);
        setFiles([]); // Clear existing files
        if (selectedChannel) {
            loadFiles(selectedChannel.channelId);
        } else {
            loadFiles();
        }
    };

    // Navigate back to channels
    const navigateToChannels = () => {
        setView('channels');
        setSelectedChannel(null);
        setFiles([]);
        setSearchQuery("");
        setFilters({});
        setCursor(null);
    };

    // Load channels on mount
    useEffect(() => {
        loadChannels();
    }, []);

    // Filtered files for search
    const displayFiles = useMemo(() => {
        // Không cần filter ở đây vì API đã filter
        return files;
    }, [files]);

    // Thêm useEffect để reload khi search query thay đổi
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (view === 'files') {
                setCursor(null);
                setFiles([]);
                if (selectedChannel) {
                    loadFiles(selectedChannel.channelId);
                } else {
                    loadFiles();
                }
            }
        }, 500); // Debounce 500ms

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]); // Trigger khi search query thay đổi

    return (
        <div className="space-y-6 px-3 py-4">
            {/* Breadcrumb */}
            {view === 'files' && (
                <div className="flex items-center gap-2 text-sm">
                    <button
                        onClick={navigateToChannels}
                        className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
                    >
                        <Home className="h-4 w-4" />
                        <span>Quản lý File</span>
                    </button>
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                    <span className="text-white font-medium flex items-center gap-1">
                        <Hash className={`h-4 w-4 ${selectedChannel?.channelType === 'group-private' ? 'text-purple-400' :
                            selectedChannel?.channelType === 'personal' ? 'text-orange-400' :
                                'text-blue-400'
                            }`} />
                        {selectedChannel?.channelName}
                    </span>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {view === 'files' && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={navigateToChannels}
                            className="hover:bg-zinc-800"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    )}
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <FolderOpen className="h-8 w-8 text-blue-400" />
                            {view === 'channels' ? 'Quản lý File' : `Files trong ${selectedChannel?.channelName}`}
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">
                            {view === 'channels'
                                ? `${channels.length} kênh có file`
                                : `${displayFiles.length} file${hasMore ? '+' : ''}`}
                        </p>
                    </div>
                </div>

                {view === 'files' && (
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Tìm theo tên file..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-8 w-64 bg-zinc-800 border-zinc-700"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => setFilterOpen(true)}
                            className="gap-2 border-zinc-700"
                        >
                            <Filter className="h-4 w-4" />
                            Lọc
                            {Object.keys(filters).length > 0 && (
                                <Badge variant="secondary" className="ml-1">
                                    {Object.keys(filters).length}
                                </Badge>
                            )}
                        </Button>
                    </div>
                )}
            </div>

            {/* Channels Grid View */}
            {view === 'channels' && (
                <div className="space-y-4">
                    {loadingChannels ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 animate-pulse">
                                    <div className="h-12 w-12 bg-zinc-800 rounded-lg mb-4" />
                                    <div className="h-4 bg-zinc-800 rounded w-3/4 mb-2" />
                                    <div className="h-3 bg-zinc-800 rounded w-1/2" />
                                </div>
                            ))}
                        </div>
                    ) : channels.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <FolderOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">Chưa có kênh nào có file</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {channels.map((channel) => (
                                <button
                                    key={channel.channelId}
                                    onClick={() => {
                                        setSelectedChannel(channel);
                                        setView('files');
                                        loadFiles(channel.channelId);
                                    }}
                                    className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 hover:border-blue-500 hover:bg-zinc-800 transition-all text-left group"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`p-3 rounded-lg ${channel.channelType === 'group-private' ? 'bg-purple-500/20' :
                                            channel.channelType === 'personal' ? 'bg-orange-500/20' :
                                                'bg-blue-500/20'
                                            }`}>
                                            <Hash className={`h-6 w-6 ${channel.channelType === 'group-private' ? 'text-purple-400' :
                                                channel.channelType === 'personal' ? 'text-orange-400' :
                                                    'text-blue-400'
                                                }`} />
                                        </div>
                                        <Badge variant="secondary" className="text-xs">
                                            {channel.fileCount} files
                                        </Badge>
                                    </div>
                                    <h3 className="text-white font-semibold mb-1 truncate group-hover:text-blue-400 transition-colors">
                                        {channel.channelName}
                                    </h3>
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <Calendar className="h-3 w-3" />
                                        <span>{formatDate(channel.lastFileDate)}</span>
                                    </div>
                                    <div className="mt-2">
                                        <span className={`text-xs px-2 py-1 rounded ${channel.channelType === 'group-private' ? 'bg-purple-500/10 text-purple-400' :
                                            channel.channelType === 'personal' ? 'bg-orange-500/10 text-orange-400' :
                                                'bg-blue-500/10 text-blue-400'
                                            }`}>
                                            {channel.channelType === 'group-private' ? 'Private' :
                                                channel.channelType === 'personal' ? 'Personal' : 'Public'}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Files Grid View */}
            {view === 'files' && (
                <div className="space-y-4">
                    {loading && files.length === 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                            {Array.from({ length: 12 }).map((_, i) => (
                                <div key={i} className="bg-zinc-900 rounded-lg p-4 border border-zinc-800 animate-pulse">
                                    <div className="aspect-square bg-zinc-800 rounded-lg mb-3" />
                                    <div className="h-3 bg-zinc-800 rounded w-full mb-2" />
                                    <div className="h-2 bg-zinc-800 rounded w-2/3" />
                                </div>
                            ))}
                        </div>
                    ) : displayFiles.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <File className="h-16 w-16 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">Không có file nào</p>
                            <p className="text-sm mt-1">Thử thay đổi bộ lọc hoặc tìm kiếm</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                                {displayFiles.map((file) => (
                                    <div
                                        key={file.id}
                                        className="bg-zinc-900 rounded-lg p-4 border border-zinc-800 hover:border-blue-500 transition-all group relative"
                                    >
                                        <button
                                            onClick={() => setSelectedFile(file)}
                                            className="w-full text-left"
                                        >
                                            <div className="aspect-square bg-zinc-800 rounded-lg flex items-center justify-center mb-3 group-hover:bg-zinc-700 transition-colors">
                                                {file.mimeType.startsWith("image/") ? (
                                                    <img
                                                        src={file.fileUrl}
                                                        alt={file.filename}
                                                        className="w-full h-full object-cover rounded-lg"
                                                    />
                                                ) : (
                                                    <div className="text-gray-400 group-hover:text-blue-400 transition-colors">
                                                        {getFileIcon(file.mimeType)}
                                                    </div>
                                                )}
                                            </div>
                                            <h4 className="text-white text-sm font-medium truncate mb-1 group-hover:text-blue-400 transition-colors">
                                                {file.filename}
                                            </h4>
                                            <p className="text-xs text-gray-400">
                                                {formatFileSize(file.fileSize)}
                                            </p>
                                        </button>
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                size="icon"
                                                variant="destructive"
                                                className="h-8 w-8"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteFile(file.id, file.user?.id || 0);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Load More */}
                            {hasMore && (
                                <div className="text-center">
                                    <Button
                                        variant="outline"
                                        onClick={() => loadFiles(selectedChannel?.channelId, true)}
                                        disabled={loading}
                                        className="border-zinc-700"
                                    >
                                        {loading ? "Đang tải..." : "Tải thêm"}
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Filter Dialog */}
            <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
                    <DialogHeader>
                        <DialogTitle>Bộ lọc nâng cao</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm text-gray-400 mb-2 block">Loại file</label>
                            <Select
                                value={filters.mimeType || "all"}
                                onValueChange={(value) => setFilters({
                                    ...filters,
                                    mimeType: value === "all" ? undefined : value
                                })}
                            >
                                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                                    <SelectValue placeholder="Tất cả" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả</SelectItem>
                                    <SelectItem value="image/">Hình ảnh</SelectItem>
                                    <SelectItem value="video/">Video</SelectItem>
                                    <SelectItem value="audio/">Audio</SelectItem>
                                    <SelectItem value="pdf">PDF</SelectItem>
                                    <SelectItem value="zip">ZIP/Archive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-gray-400 mb-2 block">Kích thước min (MB)</label>
                                <Input
                                    type="number"
                                    value={filters.minSize ? filters.minSize / (1024 * 1024) : ""}
                                    onChange={(e) => setFilters({
                                        ...filters,
                                        minSize: e.target.value ? Number(e.target.value) * 1024 * 1024 : undefined
                                    })}
                                    className="bg-zinc-800 border-zinc-700"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 mb-2 block">Kích thước max (MB)</label>
                                <Input
                                    type="number"
                                    value={filters.maxSize ? filters.maxSize / (1024 * 1024) : ""}
                                    onChange={(e) => setFilters({
                                        ...filters,
                                        maxSize: e.target.value ? Number(e.target.value) * 1024 * 1024 : undefined
                                    })}
                                    className="bg-zinc-800 border-zinc-700"
                                    placeholder="100"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-gray-400 mb-2 block">Từ ngày</label>
                                <Input
                                    type="date"
                                    value={filters.startDate || ""}
                                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value || undefined })}
                                    className="bg-zinc-800 border-zinc-700"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 mb-2 block">Đến ngày</label>
                                <Input
                                    type="date"
                                    value={filters.endDate || ""}
                                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value || undefined })}
                                    className="bg-zinc-800 border-zinc-700"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button onClick={applyFilters} className="flex-1 bg-blue-600 hover:bg-blue-700">
                                Áp dụng
                            </Button>
                            <Button onClick={clearFilters} variant="outline" className="flex-1 border-zinc-700">
                                Xóa bộ lọc
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* File Detail Dialog */}
            {selectedFile && (
                <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
                    <DialogContent className="max-w-3xl bg-zinc-900 border-zinc-800 text-white">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                {getFileIcon(selectedFile.mimeType)}
                                {selectedFile.filename}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            {/* Preview */}
                            {selectedFile.mimeType.startsWith("image/") && (
                                <div className="bg-zinc-800 rounded-lg p-4">
                                    <img
                                        src={selectedFile.fileUrl}
                                        alt={selectedFile.filename}
                                        className="max-h-96 mx-auto rounded-lg"
                                    />
                                </div>
                            )}

                            {/* File Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-400 mb-1">Kích thước</p>
                                    <p className="text-white">{formatFileSize(selectedFile.fileSize)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400 mb-1">Loại file</p>
                                    <p className="text-white">{selectedFile.mimeType}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400 mb-1">Ngày tạo</p>
                                    <p className="text-white">{formatDate(selectedFile.created_at)}</p>
                                </div>
                                {selectedFile.channel && (
                                    <div>
                                        <p className="text-sm text-gray-400 mb-1">Kênh</p>
                                        <p className="text-white">{selectedFile.channel.name}</p>
                                    </div>
                                )}
                            </div>

                            {/* Message Context */}
                            {selectedFile.message && (
                                <div className="bg-zinc-800 rounded-lg p-4">
                                    <p className="text-sm text-gray-400 mb-2">Tin nhắn</p>
                                    <p className="text-white text-sm">{selectedFile.message.text}</p>
                                    <p className="text-xs text-gray-400 mt-2">
                                        {formatDate(selectedFile.message.send_at)}
                                    </p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2">
                                <Button
                                    asChild
                                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                                >
                                    <a href={selectedFile.fileUrl} target="_blank" rel="noopener noreferrer">
                                        <Download className="h-4 w-4 mr-2" />
                                        Tải xuống
                                    </a>
                                </Button>
                                <Button
                                    variant="destructive"
                                    className="flex-1"
                                    onClick={() => {
                                        handleDeleteFile(selectedFile.id, selectedFile.user?.id || 0);
                                        setSelectedFile(null);
                                    }}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Xóa file
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
