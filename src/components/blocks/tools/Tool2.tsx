import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Server, HardDrive, Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Tool2 = () => {
    const databases = [
        { name: "PostgreSQL", status: "online", connections: 45, size: "2.3 GB" },
        { name: "Redis Cache", status: "online", connections: 12, size: "156 MB" },
        { name: "MongoDB", status: "maintenance", connections: 0, size: "890 MB" },
    ];

    return (
        <div className="h-full p-4 bg-gray-900/50">
            <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                        <Database className="h-5 w-5 text-purple-400" />
                        Tool 2 - Database Manager
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {databases.map((db, index) => (
                        <div key={index} className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Server className="h-4 w-4 text-gray-400" />
                                    <h3 className="text-sm font-medium text-white">{db.name}</h3>
                                </div>
                                <Badge
                                    variant={db.status === 'online' ? 'default' : 'secondary'}
                                    className={db.status === 'online' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}
                                >
                                    {db.status}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div className="flex items-center gap-2">
                                    <Wifi className="h-3 w-3 text-blue-400" />
                                    <span className="text-gray-300">{db.connections} connections</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <HardDrive className="h-3 w-3 text-yellow-400" />
                                    <span className="text-gray-300">{db.size}</span>
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="mt-6 p-4 bg-blue-900/30 border border-blue-700/50 rounded-lg">
                        <h3 className="text-sm font-medium text-blue-300 mb-2">Total Statistics</h3>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                                <p className="text-gray-400">Total Size</p>
                                <p className="text-white font-medium">3.346 GB</p>
                            </div>
                            <div>
                                <p className="text-gray-400">Active Connections</p>
                                <p className="text-white font-medium">57</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};