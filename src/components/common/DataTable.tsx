import { useState, useEffect, useCallback, ReactNode } from "react";
import { Search, Plus, Edit, Trash2, Eye, MoreVertical, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Column types
export type ColumnType = "text" | "image" | "avatar" | "switch" | "badge" | "badges" | "custom" | "date";

export interface BadgeConfig {
    label: string;
    color: string;
    variant?: "default" | "destructive" | "outline" | "secondary";
}

export interface ColumnConfig<T = any> {
    key: string;
    label: string;
    type: ColumnType;
    render?: (value: any, item: T) => ReactNode;
    // For badge type
    getBadgeConfig?: (value: any) => BadgeConfig;
    // For badges (array) type
    getBadgesConfig?: (value: any[]) => BadgeConfig[];
    // For switch type
    onToggle?: (item: T, newValue: boolean) => void;
    // For avatar/image
    avatarKey?: string; // Key for avatar image URL
    fallbackKey?: string; // Key for fallback text (e.g., username initial)
    width?: string;
}

export interface FilterConfig {
    key: string;
    label: string;
    type: "select" | "text" | "date";
    options?: { label: string; value: string }[];
}

export interface DataTableProps<T = any> {
    // Data & API
    onLoadData: (params: {
        page: number;
        limit: number;
        search: string;
        filters: Record<string, any>;
    }) => Promise<{ data: T[]; total: number }>;

    // Columns configuration
    columns: ColumnConfig<T>[];

    // Filters configuration
    filters?: FilterConfig[];

    // Actions
    onDelete?: (item: T) => Promise<void>;
    onUpdate?: (item: T) => Promise<void>;
    onCreate?: (data: any) => Promise<void>;
    onSelectOne?: (item: T) => void;
    customActions?: Array<{
        label: string | ((item: T) => string);
        icon?: ReactNode;
        onClick: (item: T) => void | Promise<void>;
        className?: string | ((item: T) => string);
        hidden?: boolean | ((item: T) => boolean);
    }>;

    // API Integration (optional - for automatic CRUD)
    apiEndpoint?: (params: { method: string;[key: string]: any }) => Promise<any>;

    // Detail Modal
    detailModalContent?: (item: T) => ReactNode;
    detailModalTitle?: string;

    // Create/Edit Form
    formContent?: (item: T | null, onSubmit: (data: any) => void) => ReactNode;

    // UI Customization
    title?: string;
    icon?: ReactNode;
    description?: string;
    enableCreate?: boolean;
    enableEdit?: boolean;
    enableDelete?: boolean;
    enableView?: boolean;
    enableActiveToggle?: boolean;

    // Pagination
    defaultLimit?: number;
    limitOptions?: number[];

    // Theme
    primaryColor?: string;
}

export default function DataTable<T extends { id: number | string; isActive?: boolean }>({
    onLoadData,
    columns,
    filters = [],
    onDelete,
    onUpdate,
    onCreate,
    onSelectOne,
    customActions = [],
    apiEndpoint,
    detailModalContent,
    detailModalTitle = "Chi tiết",
    formContent,
    title = "Quản lý dữ liệu",
    icon,
    description,
    enableCreate = true,
    enableEdit = true,
    enableDelete = true,
    enableView = false,
    enableActiveToggle = false,
    defaultLimit = 10,
    limitOptions = [10, 20, 50, 100],
    primaryColor = "blue",
}: DataTableProps<T>) {
    const [data, setData] = useState<T[]>([]);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(defaultLimit);
    const [total, setTotal] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterValues, setFilterValues] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(false);

    // Modal states
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showFormModal, setShowFormModal] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<T | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);

    const totalPages = Math.ceil(total / limit);

    // Load data with debounce for search
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const result = await onLoadData({
                page,
                limit,
                search: searchQuery,
                filters: filterValues,
            });
            setData(Array.isArray(result.data) ? result.data : []);
            setTotal(result.total || 0);
        } catch (error) {
            console.error("Failed to load data:", error);
            setData([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [page, limit, searchQuery, filterValues, onLoadData]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadData();
        }, 300); // Debounce 300ms
        return () => clearTimeout(timer);
    }, [loadData]);

    // Reset to page 1 when search or filters change
    useEffect(() => {
        setPage(1);
    }, [searchQuery, filterValues]);

    // Handlers
    const handleView = async (item: T) => {
        try {
            if (apiEndpoint) {
                setLoading(true);
                const result = await apiEndpoint({ method: "read-one", id: item.id });
                setSelectedItem(result.data || item);
            } else {
                setSelectedItem(item);
            }
            setShowDetailModal(true);
            onSelectOne?.(item);
        } catch (error) {
            console.error("Failed to load detail:", error);
            setSelectedItem(item); // Fallback to table data
            setShowDetailModal(true);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item: T) => {
        setSelectedItem(item);
        setIsEditMode(true);
        setShowFormModal(true);
    };

    const handleCreate = () => {
        setSelectedItem(null);
        setIsEditMode(false);
        setShowFormModal(true);
    };

    const handleDelete = async (item: T) => {
        if (!confirm("Bạn có chắc muốn xóa mục này?")) return;

        try {
            if (apiEndpoint) {
                await apiEndpoint({ method: "delete", id: item.id });
            } else if (onDelete) {
                await onDelete(item);
            }
            await loadData();
        } catch (error) {
            console.error("Failed to delete:", error);
            alert("Xóa thất bại!");
        }
    };

    const handleToggleActive = async (item: T) => {
        try {
            if (apiEndpoint) {
                await apiEndpoint({
                    method: "toggle-active",
                    id: item.id
                });
            }
            await loadData();
        } catch (error) {
            console.error("Failed to toggle active:", error);
        }
    };

    const handleFormSubmit = async (formData: any) => {
        try {
            if (isEditMode) {
                if (apiEndpoint) {
                    await apiEndpoint({ method: "update", id: selectedItem?.id, ...formData });
                } else if (onUpdate && selectedItem) {
                    await onUpdate({ ...selectedItem, ...formData });
                }
            } else {
                if (apiEndpoint) {
                    await apiEndpoint({ method: "create", ...formData });
                } else if (onCreate) {
                    await onCreate(formData);
                }
            }
            setShowFormModal(false);
            await loadData();
        } catch (error) {
            console.error("Failed to submit form:", error);
            alert("Lưu thất bại!");
        }
    };

    const renderCellContent = (column: ColumnConfig<T>, item: T) => {
        const value = (item as any)[column.key];

        switch (column.type) {
            case "custom":
                return column.render?.(value, item);

            case "image":
                return (
                    <img
                        src={value}
                        alt=""
                        className="h-10 w-10 rounded object-cover"
                    />
                );

            case "avatar":
                const avatarUrl = column.avatarKey ? (item as any)[column.avatarKey] : value;
                const fallback = column.fallbackKey
                    ? ((item as any)[column.fallbackKey] as string)?.[0]?.toUpperCase()
                    : "?";
                return (
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={avatarUrl} />
                        <AvatarFallback>{fallback}</AvatarFallback>
                    </Avatar>
                );

            case "switch":
                return (
                    <Switch
                        checked={!!value}
                        onCheckedChange={(checked) => column.onToggle?.(item, checked)}
                    />
                );

            case "badge":
                const badgeConfig = column.getBadgeConfig?.(value);
                if (!badgeConfig) return <span className="text-white">{value}</span>;
                return (
                    <Badge
                        variant={badgeConfig.variant || "default"}
                        className={badgeConfig.color}
                    >
                        {badgeConfig.label}
                    </Badge>
                );

            case "badges":
                const badgesConfig = column.getBadgesConfig?.(value || []);
                if (!badgesConfig) return null;
                return (
                    <div className="flex flex-wrap gap-1">
                        {badgesConfig.map((badge, idx) => (
                            <Badge
                                key={idx}
                                variant={badge.variant || "default"}
                                className={badge.color}
                            >
                                {badge.label}
                            </Badge>
                        ))}
                    </div>
                );

            case "date":
                return (
                    <span className="text-white">
                        {value ? new Date(value).toLocaleString("vi-VN") : "-"}
                    </span>
                );

            case "text":
            default:
                return <span className="text-white">{value || "-"}</span>;
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        {icon}
                        {title}
                    </h1>
                    {description && <p className="text-gray-400 mt-1">{description}</p>}
                </div>
                {enableCreate && (
                    <Button
                        onClick={handleCreate}
                        className={`bg-${primaryColor}-600 hover:bg-${primaryColor}-700`}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm mới
                    </Button>
                )}
            </div>

            {/* Search & Filters */}
            <div className="flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Tìm kiếm..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-zinc-900 border-zinc-700"
                    />
                </div>
                {filters.length > 0 && (
                    <Button
                        variant="outline"
                        onClick={() => setShowFilterModal(true)}
                        className="border-zinc-700"
                    >
                        <Filter className="h-4 w-4 mr-2" />
                        Bộ lọc
                    </Button>
                )}
            </div>

            {/* Table */}
            <div className="border border-zinc-800 rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-zinc-900 hover:bg-zinc-900">
                            {columns.map((column) => (
                                <TableHead key={column.key} className="text-gray-400" style={{ width: column.width }}>
                                    {column.label}
                                </TableHead>
                            ))}
                            {enableActiveToggle && (
                                <TableHead className="text-gray-400">Trạng thái</TableHead>
                            )}
                            {(enableEdit || enableDelete || enableView || customActions.length > 0) && (
                                <TableHead className="text-gray-400 text-right">Thao tác</TableHead>
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={columns.length + 2} className="text-center text-gray-400 py-8">
                                    Đang tải...
                                </TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length + 2} className="text-center text-gray-400 py-8">
                                    Không có dữ liệu
                                </TableCell>
                            </TableRow>
                        ) : (
                            Array.isArray(data) && data.map((item) => (
                                <TableRow key={item.id} className="border-zinc-800">
                                    {columns.map((column) => (
                                        <TableCell key={column.key}>
                                            {renderCellContent(column, item)}
                                        </TableCell>
                                    ))}
                                    {enableActiveToggle && (
                                        <TableCell>
                                            <Switch
                                                checked={item.isActive ?? false}
                                                onCheckedChange={() => handleToggleActive(item)}
                                            />
                                        </TableCell>
                                    )}
                                    {(enableEdit || enableDelete || enableView || customActions.length > 0) && (
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="hover:bg-white/10 hover:text-white p-1 hover:dark:bg-blue-600 px-3">
                                                        <MoreVertical className="h-4 w-4 text-gray-800 dark:text-gray-200" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-700">
                                                    {enableView && (
                                                        <DropdownMenuItem
                                                            onClick={() => handleView(item)}
                                                            className="cursor-pointer text-gray-800 dark:text-gray-200"
                                                        >
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            Xem chi tiết
                                                        </DropdownMenuItem>
                                                    )}
                                                    {enableEdit && (
                                                        <DropdownMenuItem
                                                            onClick={() => handleEdit(item)}
                                                            className="cursor-pointer text-gray-800 dark:text-gray-200"
                                                        >
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Chỉnh sửa
                                                        </DropdownMenuItem>
                                                    )}
                                                    {customActions.map((action, idx) => {
                                                        const isHidden = typeof action.hidden === 'function'
                                                            ? action.hidden(item)
                                                            : action.hidden || false;

                                                        if (isHidden) return null;

                                                        const label = typeof action.label === 'function'
                                                            ? action.label(item)
                                                            : action.label;

                                                        const className = typeof action.className === 'function'
                                                            ? action.className(item)
                                                            : action.className;

                                                        return (
                                                            <DropdownMenuItem
                                                                key={idx}
                                                                onClick={() => action.onClick(item)}
                                                                className={`cursor-pointer text-gray-800 dark:text-gray-200 ${className || ""}`}
                                                            >
                                                                {action.icon}
                                                                {label}
                                                            </DropdownMenuItem>
                                                        );
                                                    })}
                                                    {enableDelete && (
                                                        <DropdownMenuItem
                                                            onClick={() => handleDelete(item)}
                                                            className="cursor-pointer text-red-400"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Xóa
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">
                    Hiển thị {Math.min((page - 1) * limit + 1, total)} - {Math.min(page * limit, total)} trong tổng số {total} mục
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        className="border-zinc-700"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1))
                            .map((p, idx, arr) => (
                                <div key={p}>
                                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                                        <span className="px-2 text-gray-500">...</span>
                                    )}
                                    <Button
                                        variant={p === page ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setPage(p)}
                                        className={p === page ? `bg-${primaryColor}-600` : "border-zinc-700"}
                                    >
                                        {p}
                                    </Button>
                                </div>
                            ))
                        }
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPages}
                        className="border-zinc-700"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <select
                        value={limit}
                        onChange={(e) => {
                            setLimit(Number(e.target.value));
                            setPage(1);
                        }}
                        className="ml-4 px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-sm text-white"
                    >
                        {limitOptions.map((opt) => (
                            <option key={opt} value={opt}>
                                {opt} / trang
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Detail Modal */}
            {enableView && detailModalContent && (
                <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
                    <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-white">{detailModalTitle}</DialogTitle>
                        </DialogHeader>
                        {selectedItem && detailModalContent(selectedItem)}
                    </DialogContent>
                </Dialog>
            )}

            {/* Form Modal (Create/Edit) */}
            {(enableCreate || enableEdit) && formContent && (
                <Dialog open={showFormModal} onOpenChange={setShowFormModal}>
                    <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-white">
                                {isEditMode ? "Chỉnh sửa" : "Thêm mới"}
                            </DialogTitle>
                        </DialogHeader>
                        {formContent(selectedItem, handleFormSubmit)}
                    </DialogContent>
                </Dialog>
            )}

            {/* Filter Modal */}
            {filters.length > 0 && (
                <Dialog open={showFilterModal} onOpenChange={setShowFilterModal}>
                    <DialogContent className="bg-zinc-900 border-zinc-800">
                        <DialogHeader>
                            <DialogTitle className="text-white">Bộ lọc</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            {filters.map((filter) => (
                                <div key={filter.key}>
                                    <label className="text-sm text-gray-400 mb-2 block">{filter.label}</label>
                                    {filter.type === "select" ? (
                                        <Select
                                            value={filterValues[filter.key] || ""}
                                            onValueChange={(value) =>
                                                setFilterValues({ ...filterValues, [filter.key]: value })
                                            }
                                        >
                                            <SelectTrigger className="bg-zinc-950 border-zinc-700">
                                                <SelectValue placeholder="Chọn..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-zinc-700">
                                                {filter.options?.map((opt) => (
                                                    <SelectItem key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Input
                                            type={filter.type}
                                            value={filterValues[filter.key] || ""}
                                            onChange={(e) =>
                                                setFilterValues({ ...filterValues, [filter.key]: e.target.value })
                                            }
                                            className="bg-zinc-950 border-zinc-700"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setFilterValues({});
                                    setShowFilterModal(false);
                                }}
                            >
                                Xóa bộ lọc
                            </Button>
                            <Button onClick={() => setShowFilterModal(false)} className={`bg-${primaryColor}-600`}>
                                Áp dụng
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
