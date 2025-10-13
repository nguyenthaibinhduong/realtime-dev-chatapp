import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Database, Activity } from "lucide-react";

export const Tool1 = () => {
    return (
        <div className="h-full p-4 bg-gray-900/50">
            <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                        <Settings className="h-5 w-5 text-blue-400" />
                        Tool 1 - System Monitor
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 bg-gray-700/50 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-300 mb-2">CPU Usage</h3>
                        <div className="w-full bg-gray-600 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">65%</p>
                    </div>

                    <div className="p-4 bg-gray-700/50 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-300 mb-2">Memory Usage</h3>
                        <div className="w-full bg-gray-600 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">45%</p>
                    </div>

                    <div className="p-4 bg-gray-700/50 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-300 mb-2">Network Activity</h3>
                        <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-orange-400" />
                            <span className="text-sm text-gray-300">24.5 MB/s</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};