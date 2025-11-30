import { useState } from "react";
import { Settings, Save, Database, Shield, Bell, Palette, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export default function SystemSettings() {
    const [settings, setSettings] = useState({
        siteName: "Dev Chat App",
        siteDescription: "Real-time developer chat platform",
        maxFileSize: 10,
        allowFileUpload: true,
        enableNotifications: true,
        enableAIModeration: true,
        maintenanceMode: false,
        registrationEnabled: true,
        maxChannelsPerUser: 50,
        messageRetentionDays: 365,
    });

    const handleSave = () => {
        console.log("Save settings:", settings);
        alert("Cài đặt đã được lưu!");
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Settings className="h-8 w-8 text-gray-400" />
                        Cài đặt Hệ thống
                    </h1>
                    <p className="text-gray-400 mt-1">
                        Cấu hình và điều chỉnh các tham số hệ thống
                    </p>
                </div>
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="h-4 w-4 mr-2" />
                    Lưu thay đổi
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* General Settings */}
                <Card className="bg-zinc-900 border-zinc-800 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Globe className="h-5 w-5 text-blue-400" />
                        <h2 className="text-xl font-bold text-white">Cài đặt chung</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="siteName" className="text-gray-300">Tên website</Label>
                            <Input
                                id="siteName"
                                value={settings.siteName}
                                onChange={(e) =>
                                    setSettings({ ...settings, siteName: e.target.value })
                                }
                                className="bg-zinc-950 border-zinc-700"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="siteDesc" className="text-gray-300">Mô tả</Label>
                            <Textarea
                                id="siteDesc"
                                value={settings.siteDescription}
                                onChange={(e) =>
                                    setSettings({ ...settings, siteDescription: e.target.value })
                                }
                                className="bg-zinc-950 border-zinc-700"
                                rows={3}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-gray-300">Chế độ bảo trì</Label>
                                <p className="text-sm text-gray-400">Tạm ngưng truy cập hệ thống</p>
                            </div>
                            <Switch
                                checked={settings.maintenanceMode}
                                onCheckedChange={(checked) =>
                                    setSettings({ ...settings, maintenanceMode: checked })
                                }
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-gray-300">Cho phép đăng ký</Label>
                                <p className="text-sm text-gray-400">Người dùng mới có thể đăng ký</p>
                            </div>
                            <Switch
                                checked={settings.registrationEnabled}
                                onCheckedChange={(checked) =>
                                    setSettings({ ...settings, registrationEnabled: checked })
                                }
                            />
                        </div>
                    </div>
                </Card>

                {/* Storage Settings */}
                <Card className="bg-zinc-900 border-zinc-800 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Database className="h-5 w-5 text-purple-400" />
                        <h2 className="text-xl font-bold text-white">Lưu trữ & File</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="maxFileSize" className="text-gray-300">
                                Kích thước file tối đa (MB)
                            </Label>
                            <Input
                                id="maxFileSize"
                                type="number"
                                value={settings.maxFileSize}
                                onChange={(e) =>
                                    setSettings({
                                        ...settings,
                                        maxFileSize: parseInt(e.target.value),
                                    })
                                }
                                className="bg-zinc-950 border-zinc-700"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-gray-300">Cho phép upload file</Label>
                                <p className="text-sm text-gray-400">
                                    Người dùng có thể đính kèm file
                                </p>
                            </div>
                            <Switch
                                checked={settings.allowFileUpload}
                                onCheckedChange={(checked) =>
                                    setSettings({ ...settings, allowFileUpload: checked })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="retention" className="text-gray-300">
                                Thời gian lưu tin nhắn (ngày)
                            </Label>
                            <Input
                                id="retention"
                                type="number"
                                value={settings.messageRetentionDays}
                                onChange={(e) =>
                                    setSettings({
                                        ...settings,
                                        messageRetentionDays: parseInt(e.target.value),
                                    })
                                }
                                className="bg-zinc-950 border-zinc-700"
                            />
                        </div>
                    </div>
                </Card>

                {/* Security Settings */}
                <Card className="bg-zinc-900 border-zinc-800 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Shield className="h-5 w-5 text-red-400" />
                        <h2 className="text-xl font-bold text-white">Bảo mật</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-gray-300">AI Moderation</Label>
                                <p className="text-sm text-gray-400">
                                    Tự động phát hiện vi phạm bằng AI
                                </p>
                            </div>
                            <Switch
                                checked={settings.enableAIModeration}
                                onCheckedChange={(checked) =>
                                    setSettings({ ...settings, enableAIModeration: checked })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="maxChannels" className="text-gray-300">
                                Số kênh tối đa / người dùng
                            </Label>
                            <Input
                                id="maxChannels"
                                type="number"
                                value={settings.maxChannelsPerUser}
                                onChange={(e) =>
                                    setSettings({
                                        ...settings,
                                        maxChannelsPerUser: parseInt(e.target.value),
                                    })
                                }
                                className="bg-zinc-950 border-zinc-700"
                            />
                        </div>
                    </div>
                </Card>

                {/* Notification Settings */}
                <Card className="bg-zinc-900 border-zinc-800 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Bell className="h-5 w-5 text-yellow-400" />
                        <h2 className="text-xl font-bold text-white">Thông báo</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-gray-300">Bật thông báo</Label>
                                <p className="text-sm text-gray-400">
                                    Cho phép gửi thông báo đến người dùng
                                </p>
                            </div>
                            <Switch
                                checked={settings.enableNotifications}
                                onCheckedChange={(checked) =>
                                    setSettings({ ...settings, enableNotifications: checked })
                                }
                            />
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
