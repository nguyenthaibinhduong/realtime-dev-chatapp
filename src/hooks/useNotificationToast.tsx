import React, { createContext, useContext, ReactNode } from 'react';
import { useEffect, useCallback } from 'react';
import { useToast } from './useToast';
import { chatSocketService } from '@/services/chatSocketService';
import { useNavigate } from 'react-router-dom';
import { ChatAPI } from '@/api/api';

export interface NotificationAction {
    type: 'message' | 'github' | 'system' | 'default';
    data?: any;
    callback?: (data: any) => void;
}

interface NotificationContextType {
    registerHandler: (type: string, handler: (data: any) => void) => void;
    unregisterHandler: (type: string) => void;
    executeHandler: (type: string, data: any) => void;
    // Thêm navigation methods
    navigateToChannel?: (channelId: string, messageId?: string) => void;
    openGithubDetail?: (data: any) => void;
    openSystemDetail?: (data: any) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotificationActions = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotificationActions must be used within NotificationProvider');
    }
    return context;
};

interface NotificationProviderProps {
    children: ReactNode;
    // Optional callbacks cho custom navigation logic
    onNavigateToChannel?: (channelId: string, messageId?: string) => void;
    onOpenGithubDetail?: (data: any) => void;
    onOpenSystemDetail?: (data: any) => void;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
    children,
    onNavigateToChannel,
    onOpenGithubDetail,
    onOpenSystemDetail
}) => {
    const [handlers, setHandlers] = React.useState<Record<string, (data: any) => void>>({});

    const registerHandler = React.useCallback((type: string, handler: (data: any) => void) => {
        setHandlers(prev => ({ ...prev, [type]: handler }));
    }, []);

    const unregisterHandler = React.useCallback((type: string) => {
        setHandlers(prev => {
            const updated = { ...prev };
            delete updated[type];
            return updated;
        });
    }, []);

    const executeHandler = React.useCallback((type: string, data: any) => {
        const handler = handlers[type];
        if (handler) {
            handler(data);
        }
    }, [handlers]);

    const value = React.useMemo(() => ({
        registerHandler,
        unregisterHandler,
        executeHandler,
        navigateToChannel: onNavigateToChannel,
        openGithubDetail: onOpenGithubDetail,
        openSystemDetail: onOpenSystemDetail,
    }), [registerHandler, unregisterHandler, executeHandler, onNavigateToChannel, onOpenGithubDetail, onOpenSystemDetail]);

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

interface NotificationData {
    type: 'message' | 'github' | 'system' | string;
    data?: any;
    title?: string;
    body?: string;
    [key: string]: any;
}

export const useNotificationHandler = () => {
    const { toast } = useToast();
    const { executeHandler, navigateToChannel, openGithubDetail, openSystemDetail } = useNotificationActions();
    const navigate = useNavigate();

    const handleNotification = useCallback((notify: NotificationData) => {
        console.log("Received notification:", notify);

        // Xử lý notification dựa trên type và tạo toast với action
        switch (notify.type) {
            case "message":
                handleMessageNotification(notify);
                break;

            case "github":
                handleGithubNotification(notify);
                break;

            case "system":
                handleSystemNotification(notify);
                break;

            default:
                handleDefaultNotification(notify);
                break;
        }
    }, [toast, executeHandler, navigateToChannel, openGithubDetail, openSystemDetail]);

    const handleMessageNotification = useCallback((notify: NotificationData) => {
        const channelName = notify.data?.channel?.name || "kênh";
        const senderName = notify.data?.sender?.username || "Ai đó";
        const messageText = notify.data?.text || "tin nhắn";
        const channelId = notify.data?.channel?.id;
        const messageId = notify.data?.id;
        const messageType = notify.data?.type || 'message';

        // Truncate message nếu quá dài
        const truncatedText = messageText.length > 80
            ? `${messageText.substring(0, 80)}...`
            : messageText;

        // Determine notification content based on message type
        let description = `${senderName}: ${truncatedText}`;
        let title = `#${channelName}`;

        switch (messageType) {
            case "code-share":
                title = `🔗 ${channelName}`;
                description = `${senderName} đã chia sẻ code`;
                break;
            case "file-upload":
                title = `📁 ${channelName}`;
                const fileCount = notify.data?.attachments?.length || 1;
                description = `${senderName} đã gửi ${fileCount} file${fileCount > 1 ? 's' : ''}`;
                break;
            case "notification":
                title = `🔔 ${channelName}`;
                description = `${senderName} ${truncatedText}`;
                break;
        }

        toast({
            title,
            description,
            duration: 4000,
            action: {
                altText: "Xem tin nhắn",
                onClick: () => {
                    // Try custom callback first, fallback to registered handler, then navigate
                    if (navigateToChannel) {
                        navigateToChannel(channelId, messageId);
                    } else if (executeHandler) {
                        executeHandler('navigateToChannel', {
                            channelId,
                            channel: notify.data?.channel,
                            messageId,
                            type: 'message'
                        });
                    } else {
                        // Fallback to route navigation
                        navigate(`/?channel=${channelId}${messageId ? `&message=${messageId}` : ''}`);
                    }
                },
                children: "Xem"
            },
        });
    }, [toast, executeHandler, navigateToChannel, navigate]);

    const handleGithubNotification = useCallback(async (notify: NotificationData) => {
        const action = notify.data?.action;
        let title = "🔧 GitHub Event";
        let description = "";

        if (action === "created") {
            // Installation created
            const repoCount = notify.data?.repositories?.length || 0;
            const owner = notify.data?.installation?.account?.login || "Unknown";
            title = `🔧 GitHub App - ${owner}`;
            description = `Đã cài đặt ứng dụng cho ${repoCount} repository${repoCount > 1 ? 's' : ''}`;
        } else if (notify.data?.repository && notify.data?.commits) {
            // Push event
            const repository = notify.data.repository.name || notify.data.repository;
            const branch = notify.data.ref ? notify.data.ref.replace("refs/heads/", "") : notify.data.branch || "main";
            const gitMessage = notify.data.head_commit?.message || notify.data.message || notify.data.description || "Git activity";
            const owner = notify.data.repository.owner?.login || notify.data.pusher?.name || "Unknown";

            title = `📦 ${owner}/${repository}`;
            description = `Branch: ${branch} - ${gitMessage}`;


        } else {
            description = `Action: ${action || 'unknown'}`;
        }

        toast({
            title,
            description,
            duration: 4000,
            action: {
                altText: "Xem chi tiết",
                onClick: () => {
                    if (openGithubDetail) {
                        openGithubDetail(notify.data);
                    } else if (executeHandler) {
                        executeHandler('openGithubDetail', {
                            repository: notify.data?.repository,
                            action: notify.data?.action,
                            data: notify.data,
                            type: 'github'
                        });
                    } else {
                        // Fallback to GitHub page
                        navigate('/github');
                    }
                },
                children: "Chi tiết"
            },
        });
        // Gửi tin nhắn
        // Gửi tin nhắn thông báo đến các kênh liên quan đến repository
        const channelIdMatch: any = await ChatAPI.getChannelByRepository({
            repoIds: [notify.data?.repository?.id]
        });
        console.log("channel id match", channelIdMatch);


        if (channelIdMatch?.data?.length > 0) {
            const repository = notify.data?.repository?.name || notify.data?.repository;
            const branch = notify.data?.ref ? notify.data.ref.replace("refs/heads/", "") : notify.data?.branch || "main";
            const gitMessage = notify.data?.head_commit?.message || notify.data?.message || notify.data?.description || "Git activity";
            const owner = notify.data?.repository?.owner?.login || notify.data?.pusher?.name || "Unknown";
            const repoFullName = notify.data?.repository?.full_name || `${owner}/${repository}`;

            // Duyệt qua danh sách các channel IDs và gửi tin nhắn
            channelIdMatch.data.forEach((channelId: string | number) => {
                const messageText = `📦 **${repoFullName}** - Branch: \`${branch}\`\n${gitMessage}`;

                console.log({
                    channelId: String(channelId),
                    text: messageText,
                    type: 'notification',
                });

                chatSocketService.sendMessage({
                    channelId: String(channelId),
                    text: messageText,
                    type: 'notification',
                });
            });
        }
    }, [toast, executeHandler, openGithubDetail, navigate]);

    const handleSystemNotification = useCallback((notify: NotificationData) => {
        const systemTitle = notify.data?.title || "Thông báo hệ thống";
        const systemMessage = notify.data?.message || notify.data?.description || "Thông báo từ hệ thống";

        toast({
            title: `⚙️ ${systemTitle}`,
            description: systemMessage,
            duration: 6000,
            className: "border-l-4 border-l-orange-500 bg-orange-50/80 border-orange-200",
            action: {
                altText: "Xem chi tiết",
                onClick: () => {
                    if (openSystemDetail) {
                        openSystemDetail(notify.data);
                    } else if (executeHandler) {
                        executeHandler('openSystemDetail', {
                            title: systemTitle,
                            message: systemMessage,
                            data: notify.data,
                            type: 'system'
                        });
                    } else {
                        // Fallback to settings page
                        navigate('/settings');
                    }
                },
                children: "Chi tiết"
            },
        });
    }, [toast, executeHandler, openSystemDetail, navigate]);

    const handleDefaultNotification = useCallback((notify: NotificationData) => {
        const title = notify.title || notify.data?.title || "Thông báo mới";
        const description = notify.body || notify.data?.text || notify.data?.message || "Bạn có thông báo mới";

        toast({
            title,
            description,
            duration: 5000,
            className: "border-l-4 border-l-gray-500 bg-gray-50/80 border-gray-200",
            action: {
                altText: "Xem chi tiết",
                onClick: () => {
                    if (executeHandler) {
                        executeHandler('openNotificationDetail', {
                            title,
                            description,
                            data: notify.data,
                            type: notify.type || 'default'
                        });
                    } else {
                        // Fallback to notifications page
                        navigate('/notifications');
                    }
                },
                children: "Xem"
            },
        });
    }, [toast, executeHandler, navigate]);

    // Setup socket listener
    useEffect(() => {
        chatSocketService.onNotification(handleNotification);
        return () => chatSocketService.offNotification(handleNotification);
    }, [handleNotification]);

    return null; // Hook không render gì
};