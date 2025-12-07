import { Users, Shield, UserCheck, UserX, Github, Mail, TrendingUp, Activity, MessageSquare, Hash, Lock, ArrowRight, RefreshCw, BarChart3, Table, User2Icon } from "lucide-react";
import { useState, useEffect } from "react";
import { SystemAPI } from "@/api/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area } from 'recharts';

interface UserStats {
    overview: {
        totalUsers: number;
        activeUsers: number;
        inactiveUsers: number;
        onlineUsers: number;
    };
    usersByRole: {
        admin: number;
        user: number;
    };
    integrations: {
        githubLinked: number;
        emailVerified: number;
    };
    growth: {
        newUsersLast7Days: number;
    };
    recentOnlineUsers: Array<{
        id: number;
        username: string;
        email: string;
        avatar: string | null;
        isOnline: boolean;
        lastSeen: number | null;
    }>;
}

interface ChannelStats {
    totalChannels: number;
    personalChannels: number;
    groupChannels: number;
    privateChannels: number;
    totalMessages: number;
    topChannels: Array<{
        id: number;
        name: string;
        type: string;
        member_count: number;
        messageCount: number;
        owner: any;
    }>;
}

type ViewMode = 'chart' | 'table';

// Chuẩn màu sắc Dark Theme theo Material Design & Tailwind
const COLORS = {
    primary: '#60a5fa',      // blue-400 - softer blue for dark bg
    secondary: '#818cf8',    // indigo-400
    success: '#34d399',      // emerald-400 - better contrast
    warning: '#fbbf24',      // amber-400 - warmer tone
    danger: '#f87171',       // red-400 - less harsh
    info: '#22d3ee',         // cyan-400 - brighter
    purple: '#c084fc',       // purple-400 - better visibility
    orange: '#fb923c',       // orange-400
    pink: '#f472b6',         // pink-400
    // Background colors for cards
    cardBg: '#18181b',       // zinc-900
    cardBorder: '#27272a',   // zinc-800
    cardHover: '#3f3f46',    // zinc-700
};

export default function UserDashboard() {
    const [userStats, setUserStats] = useState<UserStats | null>(null);
    const [channelStats, setChannelStats] = useState<ChannelStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('table');
    const navigate = useNavigate();

    const loadStats = async (isInitialLoad = false) => {
        if (isInitialLoad) {
            setLoading(true);
        }
        try {
            const [userResponse, channelResponse] = await Promise.all([
                SystemAPI.UsersManagement({ method: "stats" }),
                SystemAPI.ChannelsManagement({ method: "stats" }),
            ]);

            if (userResponse?.data) {
                setUserStats(userResponse.data);
            }
            if (channelResponse?.data) {
                setChannelStats(channelResponse.data);
            }
        } catch (error) {
            console.error("Failed to load stats:", error);
        } finally {
            if (isInitialLoad) {
                setLoading(false);
            }
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadStats();
        setRefreshing(false);
    };

    useEffect(() => {
        loadStats(true);
        // Auto refresh every 30 seconds
        const interval = setInterval(loadStats, 30000);
        return () => clearInterval(interval);
    }, []);

    const formatLastSeen = (lastSeen: number | null) => {
        if (!lastSeen) return "Never";
        const now = Date.now();
        const diff = now - lastSeen;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return "Vừa xong";
        if (minutes < 60) return `${minutes} phút trước`;
        if (hours < 24) return `${hours} giờ trước`;
        return `${days} ngày trước`;
    };

    // Prepare chart data
    const getUserStatusChartData = () => {
        if (!userStats) return [];
        return [
            { name: 'Active', value: userStats.overview.activeUsers, color: COLORS.success, fill: COLORS.success },
            { name: 'Online', value: userStats.overview.onlineUsers, color: COLORS.info, fill: COLORS.info },
            { name: 'Inactive', value: userStats.overview.inactiveUsers, color: COLORS.danger, fill: COLORS.danger },
        ];
    };

    const getRoleChartData = () => {
        if (!userStats) return [];
        return [
            { name: 'Admin', value: userStats.usersByRole.admin, color: COLORS.purple, fill: COLORS.purple },
            { name: 'User', value: userStats.usersByRole.user, color: COLORS.primary, fill: COLORS.primary },
        ];
    };

    const getChannelTypeChartData = () => {
        if (!channelStats) return [];
        return [
            { name: 'Public', value: channelStats.groupChannels, color: COLORS.primary, fill: COLORS.primary },
            { name: 'Private', value: channelStats.privateChannels, color: COLORS.purple, fill: COLORS.purple },
            { name: 'Personal', value: channelStats.personalChannels, color: COLORS.warning, fill: COLORS.warning },
        ];
    };

    const getTopChannelsChartData = () => {
        if (!channelStats) return [];
        return channelStats.topChannels.slice(0, 5).map(channel => ({
            name: channel.name.length > 15 ? channel.name.substring(0, 15) + '...' : channel.name,
            messages: channel.messageCount,
            members: channel.member_count,
        }));
    };

    const getIntegrationChartData = () => {
        if (!userStats) return [];
        return [
            {
                name: 'GitHub',
                linked: userStats.integrations.githubLinked,
                notLinked: userStats.overview.totalUsers - userStats.integrations.githubLinked
            },
            {
                name: 'Email',
                linked: userStats.integrations.emailVerified,
                notLinked: userStats.overview.totalUsers - userStats.integrations.emailVerified
            },
        ];
    };

    if (loading) {
        return (
            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Activity className="h-8 w-8 text-green-400" />
                            Dashboard Tổng quan
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">Đang tải dữ liệu...</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 animate-pulse">
                            <div className="h-4 bg-zinc-800 rounded w-3/4 mb-4" />
                            <div className="h-8 bg-zinc-800 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!userStats) {
        return (
            <div className="text-center py-12 text-gray-400">
                <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Không thể tải thống kê</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Activity className="h-8 w-8 text-green-400" />
                        Dashboard Tổng quan
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                        Tổng quan về người dùng và kênh trong hệ thống
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-zinc-800 p-1 rounded-lg ">
                        <Button
                            onClick={() => setViewMode('table')}
                            variant={viewMode === 'table' ? 'default' : 'ghost'}
                            size="sm"
                            className="gap-2 text-white"
                        >
                            <Table className="h-4 w-4 " />
                            Số liệu
                        </Button>
                        <Button
                            onClick={() => setViewMode('chart')}
                            variant={viewMode === 'chart' ? 'default' : 'ghost'}
                            size="sm"
                            className="gap-2 text-white"
                        >
                            <BarChart3 className="h-4 w-4" />
                            Biểu đồ
                        </Button>
                    </div>
                    <Button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        variant="outline"
                        className="gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? 'Đang tải...' : 'Làm mới'}
                    </Button>
                </div>
            </div>

            {/* Quick Action Cards - Liquid Glass Style */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card
                    className="group relative cursor-pointer overflow-hidden rounded-2xl
                        bg-white/80 dark:bg-black/40
                        backdrop-blur-xl
                        border border-green-200/40 dark:border-green-500/20
                        shadow-[0_8px_32px_0_rgba(34,197,94,0.1)] dark:shadow-[0_8px_32px_0_rgba(34,197,94,0.2)]
                        transition-all duration-500
                        hover:shadow-[0_20px_60px_0_rgba(34,197,94,0.25)] dark:hover:shadow-[0_20px_60px_0_rgba(34,197,94,0.4)]
                        hover:border-green-400/60 dark:hover:border-green-500/50
                        hover:scale-[1.02]
                        active:scale-[0.98]"
                    onClick={() => navigate('/admin/users')}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent dark:from-green-500/20 dark:via-transparent dark:to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-white/5 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <CardContent className="relative p-6 z-10">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">Quản lý</p>
                                <h3 className="text-2xl font-bold text-green-600 dark:text-green-500 mb-1">Người dùng</h3>
                                <p className="text-sm text-green-600 dark:text-green-400 font-semibold">
                                    {userStats.overview.totalUsers} users
                                </p>
                            </div>
                            <div className="relative p-4 rounded-xl
                                bg-green-500/20 dark:bg-green-500/30
                                backdrop-blur-sm
                                border border-green-500/30 dark:border-green-500/40
                                group-hover:scale-110 group-hover:rotate-3
                                transition-all duration-500
                                shadow-[0_0_20px_rgba(34,197,94,0.3)] dark:shadow-[0_0_30px_rgba(34,197,94,0.5)]">
                                <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-gray-600 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300">
                            <span className="font-medium">Xem chi tiết</span>
                            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className="group relative cursor-pointer overflow-hidden rounded-2xl
                        bg-white/80 dark:bg-black/40
                        backdrop-blur-xl
                        border border-blue-200/40 dark:border-blue-500/20
                        shadow-[0_8px_32px_0_rgba(59,130,246,0.1)] dark:shadow-[0_8px_32px_0_rgba(59,130,246,0.2)]
                        transition-all duration-500
                        hover:shadow-[0_20px_60px_0_rgba(59,130,246,0.25)] dark:hover:shadow-[0_20px_60px_0_rgba(59,130,246,0.4)]
                        hover:border-blue-400/60 dark:hover:border-blue-500/50
                        hover:scale-[1.02]
                        active:scale-[0.98]"
                    onClick={() => navigate('/admin/channels')}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent dark:from-blue-500/20 dark:via-transparent dark:to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-white/5 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <CardContent className="relative p-6 z-10">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">Quản lý</p>
                                <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-500 mb-1">Kênh</h3>
                                <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold">
                                    {channelStats?.totalChannels || 0} channels
                                </p>
                            </div>
                            <div className="relative p-4 rounded-xl
                                bg-blue-500/20 dark:bg-blue-500/30
                                backdrop-blur-sm
                                border border-blue-500/30 dark:border-blue-500/40
                                group-hover:scale-110 group-hover:rotate-3
                                transition-all duration-500
                                shadow-[0_0_20px_rgba(59,130,246,0.3)] dark:shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                                <MessageSquare className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                            <span className="font-medium">Xem chi tiết</span>
                            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className="group relative cursor-pointer overflow-hidden rounded-2xl
                        bg-white/80 dark:bg-black/40
                        backdrop-blur-xl
                        border border-purple-200/40 dark:border-purple-500/20
                        shadow-[0_8px_32px_0_rgba(168,85,247,0.1)] dark:shadow-[0_8px_32px_0_rgba(168,85,247,0.2)]
                        transition-all duration-500
                        hover:shadow-[0_20px_60px_0_rgba(168,85,247,0.25)] dark:hover:shadow-[0_20px_60px_0_rgba(168,85,247,0.4)]
                        hover:border-purple-400/60 dark:hover:border-purple-500/50
                        hover:scale-[1.02]
                        active:scale-[0.98]"
                    onClick={() => navigate('/admin/attachments')}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent dark:from-purple-500/20 dark:via-transparent dark:to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-white/5 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <CardContent className="relative p-6 z-10">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">Quản lý</p>
                                <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-500 mb-1">File</h3>
                                <p className="text-sm text-purple-600 dark:text-purple-400 font-semibold">
                                    Tập tin đính kèm
                                </p>
                            </div>
                            <div className="relative p-4 rounded-xl
                                bg-purple-500/20 dark:bg-purple-500/30
                                backdrop-blur-sm
                                border border-purple-500/30 dark:border-purple-500/40
                                group-hover:scale-110 group-hover:rotate-3
                                transition-all duration-500
                                shadow-[0_0_20px_rgba(168,85,247,0.3)] dark:shadow-[0_0_30px_rgba(168,85,247,0.5)]">
                                <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-gray-600 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">
                            <span className="font-medium">Xem chi tiết</span>
                            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Conditional Rendering based on View Mode */}
            {viewMode === 'table' ? (
                <>
                    <div className="flex items-center gap-2 mt-8">
                        <User2Icon className="h-6 w-6 text-blue-400" />
                        <h3 className="text-xl font-bold text-white">Thống kê người dùng</h3>
                    </div>
                    {/* User Overview Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="bg-zinc-900 border-zinc-800 hover:border-blue-500/50 transition-colors">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    Tổng User
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-white">
                                    {userStats.overview.totalUsers}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Tất cả người dùng</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-zinc-900 border-zinc-800 hover:border-emerald-500/50 transition-colors">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                    <UserCheck className="h-4 w-4 text-emerald-400" />
                                    User Active
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-emerald-400">
                                    {userStats.overview.activeUsers}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {Math.round((userStats.overview.activeUsers / userStats.overview.totalUsers) * 100)}% tổng số
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-zinc-900 border-zinc-800 hover:border-cyan-500/50 transition-colors">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-cyan-400" />
                                    Đang Online
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-cyan-400">
                                    {userStats.overview.onlineUsers}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {Math.round((userStats.overview.onlineUsers / userStats.overview.totalUsers) * 100)}% tổng số
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-zinc-900 border-zinc-800 hover:border-red-500/50 transition-colors">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                    <UserX className="h-4 w-4 text-red-400" />
                                    User Inactive
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-red-400">
                                    {userStats.overview.inactiveUsers}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {Math.round((userStats.overview.inactiveUsers / userStats.overview.totalUsers) * 100)}% tổng số
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Channel Stats Section */}
                    {channelStats && (
                        <>
                            <div className="flex items-center gap-2 mt-8">
                                <MessageSquare className="h-6 w-6 text-blue-400" />
                                <h3 className="text-xl font-bold text-white">Thống kê Kênh</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <Card className="bg-zinc-900 border-zinc-800 hover:border-blue-500/50 transition-colors">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                            <MessageSquare className="h-4 w-4 text-blue-400" />
                                            Tổng Kênh
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-white">
                                            {channelStats.totalChannels}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Tất cả các kênh</p>
                                    </CardContent>
                                </Card>

                                <Card className="bg-zinc-900 border-zinc-800 hover:border-blue-500/50 transition-colors">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                            <Hash className="h-4 w-4 text-blue-400" />
                                            Kênh Public
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-blue-400">
                                            {channelStats.groupChannels}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {Math.round((channelStats.groupChannels / channelStats.totalChannels) * 100)}% tổng số
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="bg-zinc-900 border-zinc-800 hover:border-purple-500/50 transition-colors">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                            <Lock className="h-4 w-4 text-purple-400" />
                                            Kênh Private
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-purple-400">
                                            {channelStats.privateChannels}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {Math.round((channelStats.privateChannels / channelStats.totalChannels) * 100)}% tổng số
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-colors">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-orange-400" />
                                            Tổng Tin nhắn
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-orange-400">
                                            {channelStats.totalMessages}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Trên tất cả kênh</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Top Channels */}
                            <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-white flex items-center gap-2">
                                            <TrendingUp className="h-5 w-5 text-blue-400" />
                                            Top Kênh hoạt động
                                        </CardTitle>
                                        <p className="text-sm text-gray-400 mt-1">
                                            {channelStats.topChannels.length} kênh có hoạt động nhiều nhất
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => navigate('/admin/channels')}
                                        className="gap-2"
                                    >
                                        Xem tất cả
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {channelStats.topChannels.slice(0, 5).map((channel) => (
                                            <div
                                                key={channel.id}
                                                className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                                                onClick={() => navigate('/admin/channels')}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${channel.type === 'group-private' ? 'bg-purple-500/20' :
                                                        channel.type === 'personal' ? 'bg-orange-500/20' :
                                                            'bg-blue-500/20'
                                                        }`}>
                                                        {channel.type === 'group-private' || channel.type === 'personal' ? (
                                                            <Lock className={`h-4 w-4 ${channel.type === 'group-private' ? 'text-purple-400' : 'text-orange-400'
                                                                }`} />
                                                        ) : (
                                                            <Hash className="h-4 w-4 text-blue-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-medium">{channel.name}</p>
                                                        <p className="text-sm text-gray-400">
                                                            {channel.member_count} thành viên
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-white font-bold">{channel.messageCount}</p>
                                                    <p className="text-xs text-gray-500">tin nhắn</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}

                    {/* Role & Integration Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="bg-zinc-900 border-zinc-800 hover:border-purple-500/50 transition-colors">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-purple-400" />
                                    Admin
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-purple-400">
                                    {userStats.usersByRole.admin}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Quản trị viên</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-zinc-900 border-zinc-800 hover:border-blue-500/50 transition-colors">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                    <Users className="h-4 w-4 text-blue-400" />
                                    User
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-blue-400">
                                    {userStats.usersByRole.user}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Người dùng thường</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-colors">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                    <Github className="h-4 w-4 text-orange-400" />
                                    GitHub Linked
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-orange-400">
                                    {userStats.integrations.githubLinked}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {Math.round((userStats.integrations.githubLinked / userStats.overview.totalUsers) * 100)}% liên kết
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-zinc-900 border-zinc-800 hover:border-cyan-500/50 transition-colors">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-cyan-400" />
                                    Email Verified
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-cyan-400">
                                    {userStats.integrations.emailVerified}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {Math.round((userStats.integrations.emailVerified / userStats.overview.totalUsers) * 100)}% xác thực
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Growth Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="bg-zinc-900 border-zinc-800 hover:border-emerald-500/50 transition-colors">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                                    Tăng trưởng User
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-baseline gap-2">
                                    <div className="text-3xl font-bold text-emerald-400">
                                        {userStats.growth.newUsersLast7Days}
                                    </div>
                                    <span className="text-sm text-gray-400">user mới</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Trong 7 ngày gần đây</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-400">
                                    Thống kê nhanh
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Tỷ lệ Active:</span>
                                        <span className="text-white font-medium">
                                            {Math.round((userStats.overview.activeUsers / userStats.overview.totalUsers) * 100)}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Tỷ lệ Online:</span>
                                        <span className="text-white font-medium">
                                            {Math.round((userStats.overview.onlineUsers / userStats.overview.totalUsers) * 100)}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Tỷ lệ Admin:</span>
                                        <span className="text-white font-medium">
                                            {Math.round((userStats.usersByRole.admin / userStats.overview.totalUsers) * 100)}%
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Online Users */}
                    <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-blue-400" />
                                    User hoạt động gần đây
                                </CardTitle>
                                <p className="text-sm text-gray-400 mt-1">
                                    {userStats.recentOnlineUsers.length} người dùng được cập nhật gần nhất
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate('/admin/users')}
                                className="gap-2"
                            >
                                Xem tất cả
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {userStats.recentOnlineUsers.map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                                        onClick={() => navigate('/admin/users')}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage
                                                        src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}`}
                                                    />
                                                    <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                {user.isOnline && (
                                                    <div className="absolute bottom-0 right-0 h-3 w-3 bg-emerald-500 rounded-full border-2 border-zinc-900" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">{user.username}</p>
                                                <p className="text-sm text-gray-400">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {user.isOnline ? (
                                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                                    Online
                                                </Badge>
                                            ) : (
                                                <p className="text-xs text-gray-500">
                                                    {formatLastSeen(user.lastSeen)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </>
            ) : (
                <>
                    {/* Chart View */}
                    <div className="space-y-6">
                        {/* Overview Statistics Cards - Liquid Glass Style */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="group relative overflow-hidden rounded-2xl
                                bg-white/80 dark:bg-black/40
                                backdrop-blur-xl
                                border border-blue-200/40 dark:border-blue-500/20
                                shadow-[0_8px_32px_0_rgba(59,130,246,0.1)] dark:shadow-[0_8px_32px_0_rgba(59,130,246,0.2)]
                                transition-all duration-500
                                hover:shadow-[0_20px_60px_0_rgba(59,130,246,0.25)] dark:hover:shadow-[0_20px_60px_0_rgba(59,130,246,0.4)]
                                hover:border-blue-400/60 dark:hover:border-blue-500/50
                                hover:scale-[1.02]">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent dark:from-blue-500/20 dark:via-transparent dark:to-transparent" />
                                <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-white/5 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                <CardContent className="relative p-6 z-10">
                                    <div className="flex items-center justify-between mb-2">
                                        <Users className="h-8 w-8 text-blue-500 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300" />
                                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{userStats.overview.totalUsers}</div>
                                    </div>
                                    <p className="text-sm text-blue-500 dark:text-blue-400 font-medium">Tổng người dùng</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Tất cả users trong hệ thống</p>
                                </CardContent>
                            </Card>

                            <Card className="group relative overflow-hidden rounded-2xl
                                bg-white/80 dark:bg-black/40
                                backdrop-blur-xl
                                border border-emerald-200/40 dark:border-emerald-500/20
                                shadow-[0_8px_32px_0_rgba(16,185,129,0.1)] dark:shadow-[0_8px_32px_0_rgba(16,185,129,0.2)]
                                transition-all duration-500
                                hover:shadow-[0_20px_60px_0_rgba(16,185,129,0.25)] dark:hover:shadow-[0_20px_60px_0_rgba(16,185,129,0.4)]
                                hover:border-emerald-400/60 dark:hover:border-emerald-500/50
                                hover:scale-[1.02]">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent dark:from-emerald-500/20 dark:via-transparent dark:to-transparent" />
                                <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-white/5 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                <CardContent className="relative p-6 z-10">
                                    <div className="flex items-center justify-between mb-2">
                                        <Activity className="h-8 w-8 text-emerald-500 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300" />
                                        <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{userStats.overview.onlineUsers}</div>
                                    </div>
                                    <p className="text-sm text-emerald-500 dark:text-emerald-400 font-medium">Đang online</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                        {Math.round((userStats.overview.onlineUsers / userStats.overview.totalUsers) * 100)}% tổng số users
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="group relative overflow-hidden rounded-2xl
                                bg-white/80 dark:bg-black/40
                                backdrop-blur-xl
                                border border-purple-200/40 dark:border-purple-500/20
                                shadow-[0_8px_32px_0_rgba(168,85,247,0.1)] dark:shadow-[0_8px_32px_0_rgba(168,85,247,0.2)]
                                transition-all duration-500
                                hover:shadow-[0_20px_60px_0_rgba(168,85,247,0.25)] dark:hover:shadow-[0_20px_60px_0_rgba(168,85,247,0.4)]
                                hover:border-purple-400/60 dark:hover:border-purple-500/50
                                hover:scale-[1.02]">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent dark:from-purple-500/20 dark:via-transparent dark:to-transparent" />
                                <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-white/5 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                <CardContent className="relative p-6 z-10">
                                    <div className="flex items-center justify-between mb-2">
                                        <MessageSquare className="h-8 w-8 text-purple-500 dark:text-purple-400 group-hover:scale-110 transition-transform duration-300" />
                                        <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{channelStats?.totalChannels || 0}</div>
                                    </div>
                                    <p className="text-sm text-purple-500 dark:text-purple-400 font-medium">Tổng kênh</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Channels trong hệ thống</p>
                                </CardContent>
                            </Card>

                            <Card className="group relative overflow-hidden rounded-2xl
                                bg-white/80 dark:bg-black/40
                                backdrop-blur-xl
                                border border-orange-200/40 dark:border-orange-500/20
                                shadow-[0_8px_32px_0_rgba(249,115,22,0.1)] dark:shadow-[0_8px_32px_0_rgba(249,115,22,0.2)]
                                transition-all duration-500
                                hover:shadow-[0_20px_60px_0_rgba(249,115,22,0.25)] dark:hover:shadow-[0_20px_60px_0_rgba(249,115,22,0.4)]
                                hover:border-orange-400/60 dark:hover:border-orange-500/50
                                hover:scale-[1.02]">
                                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-transparent dark:from-orange-500/20 dark:via-transparent dark:to-transparent" />
                                <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-white/5 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                <CardContent className="relative p-6 z-10">
                                    <div className="flex items-center justify-between mb-2">
                                        <TrendingUp className="h-8 w-8 text-orange-500 dark:text-orange-400 group-hover:scale-110 transition-transform duration-300" />
                                        <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{channelStats?.totalMessages || 0}</div>
                                    </div>
                                    <p className="text-sm text-orange-500 dark:text-orange-400 font-medium">Tin nhắn</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Tổng messages đã gửi</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Main Charts Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* User Status Distribution - Stacked Bar Chart */}
                            <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
                                <CardHeader className="border-b border-zinc-800 pb-4">
                                    <CardTitle className="text-white flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-5 w-5 text-blue-400" />
                                            <span>Phân bố người dùng</span>
                                        </div>
                                        <span className="text-sm font-normal text-gray-400">{userStats.overview.totalUsers} users</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <ResponsiveContainer width="100%" height={320}>
                                        <BarChart
                                            data={[
                                                {
                                                    name: 'Users',
                                                    'Active': userStats.overview.activeUsers,
                                                    'Online': userStats.overview.onlineUsers,
                                                    'Inactive': userStats.overview.inactiveUsers,
                                                }
                                            ]}
                                            layout="vertical"
                                            margin={{ top: 20, right: 30, left: 80, bottom: 20 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                            <XAxis
                                                type="number"
                                                stroke="#9ca3af"
                                                style={{ fontSize: '14px', fill: '#9ca3af' }}
                                                tickLine={{ stroke: '#3f3f46' }}
                                            />
                                            <YAxis
                                                type="category"
                                                dataKey="name"
                                                stroke="#9ca3af"
                                                style={{ fontSize: '14px', fill: '#9ca3af' }}
                                                tickLine={{ stroke: '#3f3f46' }}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#18181b',
                                                    border: '1px solid #27272a',
                                                    borderRadius: '8px',
                                                    color: '#fff',
                                                    fontSize: '14px',
                                                    padding: '12px'
                                                }}
                                                itemStyle={{ color: '#fff' }}
                                                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                            />
                                            <Legend
                                                wrapperStyle={{
                                                    paddingTop: '10px',
                                                    fontSize: '14px',
                                                    color: '#fff'
                                                }}
                                            />
                                            <Bar dataKey="Inactive" stackId="a" fill={COLORS.danger} name="Inactive" radius={[0, 0, 0, 0]} barSize={60} />
                                            <Bar dataKey="Active" stackId="a" fill={COLORS.success} name="Active (bao gồm Online)" radius={[0, 8, 8, 0]} barSize={60} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                    <div className="mt-4 p-3 bg-zinc-800/30 rounded-lg">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-400">Online (đang hoạt động):</span>
                                            <span className="text-cyan-400 font-semibold">{userStats.overview.onlineUsers} users ({Math.round((userStats.overview.onlineUsers / userStats.overview.activeUsers) * 100)}% Active)</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* User Roles Distribution - Donut Chart */}
                            <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
                                <CardHeader className="border-b border-zinc-800 pb-4">
                                    <CardTitle className="text-white flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-5 w-5 text-purple-400" />
                                            <span>Phân bổ vai trò</span>
                                        </div>
                                        <span className="text-sm font-normal text-gray-400">Admin & Users</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <ResponsiveContainer width="100%" height={320}>
                                        <PieChart>
                                            <Pie
                                                data={getRoleChartData()}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={true}
                                                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                                                innerRadius={60}
                                                outerRadius={110}
                                                fill="#8884d8"
                                                dataKey="value"
                                                strokeWidth={2}
                                                stroke="#18181b"
                                            >
                                                {getRoleChartData().map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#18181b',
                                                    border: '1px solid #27272a',
                                                    borderRadius: '8px',
                                                    color: '#fff',
                                                    fontSize: '14px',
                                                    padding: '12px'
                                                }}
                                                itemStyle={{ color: '#fff' }}
                                            />
                                            <Legend
                                                wrapperStyle={{
                                                    paddingTop: '20px',
                                                    fontSize: '14px',
                                                    color: '#fff'
                                                }}
                                                iconType="circle"
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Channel Types Distribution */}
                            {channelStats && (
                                <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
                                    <CardHeader className="border-b border-zinc-800 pb-4">
                                        <CardTitle className="text-white flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <MessageSquare className="h-5 w-5 text-blue-400" />
                                                <span>Phân loại kênh</span>
                                            </div>
                                            <span className="text-sm font-normal text-gray-400">{channelStats.totalChannels} channels</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        <ResponsiveContainer width="100%" height={320}>
                                            <BarChart data={getChannelTypeChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                                <XAxis
                                                    dataKey="name"
                                                    stroke="#9ca3af"
                                                    style={{ fontSize: '14px', fill: '#9ca3af' }}
                                                    tickLine={{ stroke: '#3f3f46' }}
                                                />
                                                <YAxis
                                                    stroke="#9ca3af"
                                                    style={{ fontSize: '14px', fill: '#9ca3af' }}
                                                    tickLine={{ stroke: '#3f3f46' }}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: '#18181b',
                                                        border: '1px solid #27272a',
                                                        borderRadius: '8px',
                                                        color: '#fff',
                                                        fontSize: '14px',
                                                        padding: '12px'
                                                    }}
                                                    itemStyle={{ color: '#fff' }}
                                                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                                />
                                                <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={80}>
                                                    {getChannelTypeChartData().map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Top Channels Activity - Dual Axis */}
                            {channelStats && (
                                <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
                                    <CardHeader className="border-b border-zinc-800 pb-4">
                                        <CardTitle className="text-white flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="h-5 w-5 text-emerald-400" />
                                                <span>Top 5 kênh hoạt động</span>
                                            </div>
                                            <span className="text-sm font-normal text-gray-400">Tin nhắn & Thành viên</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        <ResponsiveContainer width="100%" height={320}>
                                            <ComposedChart data={getTopChannelsChartData()} margin={{ top: 20, right: 50, left: 20, bottom: 60 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                                <XAxis
                                                    dataKey="name"
                                                    stroke="#9ca3af"
                                                    angle={-25}
                                                    textAnchor="end"
                                                    height={80}
                                                    style={{ fontSize: '12px', fill: '#9ca3af' }}
                                                    tickLine={{ stroke: '#3f3f46' }}
                                                />
                                                <YAxis
                                                    yAxisId="left"
                                                    stroke="#9ca3af"
                                                    style={{ fontSize: '14px', fill: '#9ca3af' }}
                                                    tickLine={{ stroke: '#3f3f46' }}
                                                    label={{ value: 'Tin nhắn', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af', fontSize: '12px' } }}
                                                />
                                                <YAxis
                                                    yAxisId="right"
                                                    orientation="right"
                                                    stroke="#9ca3af"
                                                    style={{ fontSize: '14px', fill: '#9ca3af' }}
                                                    tickLine={{ stroke: '#3f3f46' }}
                                                    label={{ value: 'Thành viên', angle: 90, position: 'insideRight', style: { fill: '#9ca3af', fontSize: '12px' } }}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: '#18181b',
                                                        border: '1px solid #27272a',
                                                        borderRadius: '8px',
                                                        color: '#fff',
                                                        fontSize: '14px',
                                                        padding: '12px'
                                                    }}
                                                    itemStyle={{ color: '#fff' }}
                                                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                                />
                                                <Legend
                                                    wrapperStyle={{
                                                        paddingTop: '10px',
                                                        fontSize: '14px',
                                                        color: '#fff'
                                                    }}
                                                />
                                                <Bar yAxisId="left" dataKey="messages" fill={COLORS.primary} name="Tin nhắn" radius={[8, 8, 0, 0]} maxBarSize={40} />
                                                <Line yAxisId="right" type="monotone" dataKey="members" stroke={COLORS.success} strokeWidth={3} name="Thành viên" dot={{ fill: COLORS.success, r: 5 }} activeDot={{ r: 7 }} />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                        <div className="mt-4 p-3 bg-zinc-800/30 rounded-lg">
                                            <p className="text-xs text-gray-400 text-center">
                                                💡 Biểu đồ kết hợp: Cột (tin nhắn) sử dụng trục Y bên trái, Đường (thành viên) sử dụng trục Y bên phải
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Integration & Growth Stats - Full Width */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Integration Stats */}
                            <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
                                <CardHeader className="border-b border-zinc-800 pb-4">
                                    <CardTitle className="text-white flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Github className="h-5 w-5 text-orange-400" />
                                            <span>Tích hợp & Xác thực</span>
                                        </div>
                                        <span className="text-sm font-normal text-gray-400">GitHub & Email</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={getIntegrationChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                            <XAxis
                                                dataKey="name"
                                                stroke="#9ca3af"
                                                style={{ fontSize: '14px', fill: '#9ca3af' }}
                                                tickLine={{ stroke: '#3f3f46' }}
                                            />
                                            <YAxis
                                                stroke="#9ca3af"
                                                style={{ fontSize: '14px', fill: '#9ca3af' }}
                                                tickLine={{ stroke: '#3f3f46' }}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#18181b',
                                                    border: '1px solid #27272a',
                                                    borderRadius: '8px',
                                                    color: '#fff',
                                                    fontSize: '14px',
                                                    padding: '12px'
                                                }}
                                                itemStyle={{ color: '#fff' }}
                                                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                            />
                                            <Legend
                                                wrapperStyle={{
                                                    paddingTop: '10px',
                                                    fontSize: '14px',
                                                    color: '#fff'
                                                }}
                                            />
                                            <Bar dataKey="linked" stackId="a" fill={COLORS.success} name="Đã liên kết" radius={[0, 0, 0, 0]} />
                                            <Bar dataKey="notLinked" stackId="a" fill={COLORS.danger} name="Chưa liên kết" radius={[8, 8, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Growth & Engagement Stats */}
                            <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
                                <CardHeader className="border-b border-zinc-800 pb-4">
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <Activity className="h-5 w-5 text-emerald-400" />
                                        <span>Tăng trưởng & Hoạt động</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="space-y-4">
                                        {/* New Users Growth */}
                                        <div className="bg-gradient-to-r from-emerald-500/10 to-transparent p-4 rounded-lg border border-emerald-500/20">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                                                    <span className="text-sm text-gray-300 font-medium">Users mới (7 ngày)</span>
                                                </div>
                                                <span className="text-2xl font-bold text-emerald-400">+{userStats.growth.newUsersLast7Days}</span>
                                            </div>
                                            <div className="w-full bg-zinc-800 rounded-full h-2">
                                                <div
                                                    className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
                                                    style={{ width: `${Math.min((userStats.growth.newUsersLast7Days / userStats.overview.totalUsers) * 100 * 10, 100)}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">
                                                Tăng trưởng {((userStats.growth.newUsersLast7Days / userStats.overview.totalUsers) * 100).toFixed(1)}% so với tổng users
                                            </p>
                                        </div>

                                        {/* Active Rate */}
                                        <div className="bg-gradient-to-r from-cyan-500/10 to-transparent p-4 rounded-lg border border-cyan-500/20">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <UserCheck className="h-5 w-5 text-cyan-400" />
                                                    <span className="text-sm text-gray-300 font-medium">Tỷ lệ Active</span>
                                                </div>
                                                <span className="text-2xl font-bold text-cyan-400">
                                                    {Math.round((userStats.overview.activeUsers / userStats.overview.totalUsers) * 100)}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-zinc-800 rounded-full h-2">
                                                <div
                                                    className="bg-gradient-to-r from-cyan-500 to-cyan-400 h-2 rounded-full transition-all duration-500"
                                                    style={{ width: `${(userStats.overview.activeUsers / userStats.overview.totalUsers) * 100}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">
                                                {userStats.overview.activeUsers} trong {userStats.overview.totalUsers} users đang hoạt động
                                            </p>
                                        </div>

                                        {/* Online Rate */}
                                        <div className="bg-gradient-to-r from-blue-500/10 to-transparent p-4 rounded-lg border border-blue-500/20">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Activity className="h-5 w-5 text-blue-400" />
                                                    <span className="text-sm text-gray-300 font-medium">Tỷ lệ Online</span>
                                                </div>
                                                <span className="text-2xl font-bold text-blue-400">
                                                    {Math.round((userStats.overview.onlineUsers / userStats.overview.totalUsers) * 100)}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-zinc-800 rounded-full h-2">
                                                <div
                                                    className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full transition-all duration-500"
                                                    style={{ width: `${(userStats.overview.onlineUsers / userStats.overview.totalUsers) * 100}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">
                                                {userStats.overview.onlineUsers} users đang online ngay lúc này
                                            </p>
                                        </div>

                                        {/* Admin Rate */}
                                        <div className="bg-gradient-to-r from-purple-500/10 to-transparent p-4 rounded-lg border border-purple-500/20">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Shield className="h-5 w-5 text-purple-400" />
                                                    <span className="text-sm text-gray-300 font-medium">Tỷ lệ Admin</span>
                                                </div>
                                                <span className="text-2xl font-bold text-purple-400">
                                                    {Math.round((userStats.usersByRole.admin / userStats.overview.totalUsers) * 100)}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-zinc-800 rounded-full h-2">
                                                <div
                                                    className="bg-gradient-to-r from-purple-500 to-purple-400 h-2 rounded-full transition-all duration-500"
                                                    style={{ width: `${(userStats.usersByRole.admin / userStats.overview.totalUsers) * 100}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">
                                                {userStats.usersByRole.admin} admins quản lý hệ thống
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}