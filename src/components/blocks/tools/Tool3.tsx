import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, MessageSquare, Clock } from "lucide-react";

export const Tool3 = () => {
    const analytics = [
        { label: "Total Messages", value: "2,847", change: "+12%", trend: "up" },
        { label: "Active Users", value: "156", change: "+8%", trend: "up" },
        { label: "Channels", value: "23", change: "+2%", trend: "up" },
        { label: "Avg Response Time", value: "2.3s", change: "-5%", trend: "down" },
    ];

    const recentActivity = [
        { action: "User joined #general", time: "2 min ago", type: "join" },
        { action: "New message in #dev-chat", time: "5 min ago", type: "message" },
        { action: "Channel #design created", time: "1h ago", type: "channel" },
        { action: "File uploaded to #resources", time: "2h ago", type: "file" },
    ];

    return (
        <div className="h-full p-4 bg-gray-900/50">
            <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-black dark:text-white">
                        <BarChart3 className="h-5 w-5 text-green-400" />
                        Tool 3 - Analytics Dashboard
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        {analytics.map((stat, index) => (
                            <div key={index} className="p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-xs text-gray-400">{stat.label}</p>
                                    <div className={`flex items-center gap-1 text-xs ${stat.trend === 'up' ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                        <TrendingUp className={`h-3 w-3 ${stat.trend === 'down' ? 'rotate-180' : ''}`} />
                                        {stat.change}
                                    </div>
                                </div>
                                <p className="text-lg font-semibold text-black dark:text-white">{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Activity Chart Placeholder */}
                    <div className="p-4 bg-gray-700/50 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-300 mb-3">Message Activity (24h)</h3>
                        <div className="h-20 bg-gray-600/30 rounded flex items-end gap-1 px-2 py-2">
                            {Array.from({ length: 12 }, (_, i) => (
                                <div
                                    key={i}
                                    className="flex-1 bg-green-400 rounded-sm opacity-60 hover:opacity-100 transition-opacity"
                                    style={{ height: `${Math.random() * 80 + 20}%` }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-gray-300">Recent Activity</h3>
                        {recentActivity.map((activity, index) => (
                            <div key={index} className="flex items-center gap-3 p-2 bg-gray-700/30 rounded">
                                <div className={`w-2 h-2 rounded-full ${activity.type === 'join' ? 'bg-green-400' :
                                    activity.type === 'message' ? 'bg-blue-400' :
                                        activity.type === 'channel' ? 'bg-purple-400' : 'bg-yellow-400'
                                    }`} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-300 truncate">{activity.action}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3 text-gray-500" />
                                    <span className="text-xs text-gray-500">{activity.time}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};