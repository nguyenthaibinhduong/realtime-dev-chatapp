import { Home, Users, Settings, Bell, MessageSquare, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export default function MenubarLayout({ onSelect, selected }: { onSelect?: (key: string) => void, selected?: string }) {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/auth');
    };

    const items = [
        { key: 'home', icon: <Home className="h-5 w-5" />, label: 'Home' },
        { key: 'channels', icon: <MessageSquare className="h-5 w-5" />, label: 'Channels' },
        { key: 'users', icon: <Users className="h-5 w-5" />, label: 'Users' },
        { key: 'notifications', icon: <Bell className="h-5 w-5" />, label: 'Notifications' },
        { key: 'settings', icon: <Settings className="h-5 w-5" />, label: 'Settings' },
    ];

    return (
        <nav className="flex flex-col items-center gap-2 py-4 bg-sidebar-accent border-r border-sidebar-border min-h-screen w-14">
            {items.map(item => (
                <Button
                    key={item.key}
                    variant={selected === item.key ? 'secondary' : 'ghost'}
                    size="icon"
                    className={`rounded-lg ${selected === item.key ? 'bg-blue-600 text-white' : 'text-sidebar-foreground hover:bg-blue-100'}`}
                    onClick={() => onSelect?.(item.key)}
                >
                    {item.icon}
                </Button>
            ))}
            <Button
                variant="ghost"
                size="icon"
                className="rounded-lg text-sidebar-foreground hover:bg-red-100 mt-4"
                onClick={handleLogout}
                title="Đăng xuất"
            >
                <LogOut className="h-5 w-5" />
            </Button>
        </nav>
    );
}