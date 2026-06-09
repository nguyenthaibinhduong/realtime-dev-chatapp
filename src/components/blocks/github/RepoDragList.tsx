import React from "react";
import { Grip, Check, Lock, Eye, Github, ArrowRight } from "lucide-react";

interface Repo {
    id: number;
    name: string;
    full_name: string;
    description?: string;
    private: boolean;
}

interface RepoDragListProps {
    repos: Repo[];
    addedRepos: Repo[];
    isDragOver: boolean;
    onDragStart: (e: React.DragEvent, repo: Repo) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    children: React.ReactNode;
}

export const RepoDragList: React.FC<RepoDragListProps> = ({
    repos,
    addedRepos,
    isDragOver,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    children,
}) => {
    return (
        <div className="flex flex-col h-full">
            {/* Available Repos */}
            <div className="p-6 pt-2 border-b border-border">
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-foreground">Repository có sẵn</h3>
                        <span className="text-xs text-muted-foreground">{repos.length} repo</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Kéo repository vào khu vực bên dưới để thêm vào kênh
                    </p>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {repos.map((repo) => {
                        const isAlreadyAdded = addedRepos.some(r => r.id === repo.id);
                        return (
                            <div
                                key={repo.id}
                                draggable={!isAlreadyAdded}
                                onDragStart={(e) => onDragStart(e, repo)}
                                className={`
                                    group flex items-center gap-3 p-3 rounded-lg border transition-all duration-200
                                    ${isAlreadyAdded
                                        ? 'bg-muted/60 border-border opacity-60 cursor-not-allowed'
                                        : 'bg-card border-border hover:border-primary/40 hover:bg-accent/50 cursor-grab active:cursor-grabbing hover:shadow-sm'
                                    }
                                `}
                            >
                                <div className="flex-shrink-0">
                                    {!isAlreadyAdded ? (
                                        <Grip className="h-4 w-4 text-zinc-500 group-hover:text-blue-400 transition-colors" />
                                    ) : (
                                        <Check className="h-4 w-4 text-green-500" />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="flex items-center gap-1">
                                            {repo.private ? (
                                                <Lock className="h-3 w-3 text-orange-400" />
                                            ) : (
                                                <Eye className="h-3 w-3 text-green-400" />
                                            )}
                                            <span className="text-sm font-semibold text-foreground truncate">
                                                {repo.name}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate">
                                        {repo.full_name}
                                    </div>
                                    {repo.description && (
                                        <div className="text-xs text-muted-foreground truncate mt-1">
                                            {repo.description}
                                        </div>
                                    )}
                                </div>

                                {!isAlreadyAdded && (
                                    <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                        Kéo để thêm
                                    </div>
                                )}
                                {isAlreadyAdded && (
                                    <div className="text-xs text-green-400">
                                        Đã thêm
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Drop Zone */}
            <div
                className={`
                    flex-1 min-h-0 overflow-y-auto transition-all duration-300 border-2 border-dashed rounded-lg m-4 p-4
                    ${isDragOver
                        ? 'border-primary bg-primary/10 shadow-inner'
                        : 'border-border bg-background'
                    }
                `}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
            >
                <div className={`pb-2 flex items-center justify-between border-b mb-4 transition-colors ${isDragOver ? 'border-primary/60' : 'border-border'}`}>
                    <div className="text-lg font-semibold flex items-center text-foreground">
                        <Github className="h-6 w-6 mr-2" />
                        Repository trong kênh
                    </div>
                    {isDragOver && (
                        <div className="flex items-center gap-2 text-blue-400">
                            <ArrowRight className="h-4 w-4 animate-pulse" />
                            <span className="text-sm font-medium">Thả để thêm vào kênh</span>
                        </div>
                    )}
                </div>

                {isDragOver ? (
                    <div className="flex flex-col items-center justify-center py-12 text-blue-400">
                        <div className="relative mb-4">
                            <Github className="h-16 w-16 animate-pulse" />
                            <div className="absolute -top-1 -right-1 h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center">
                                <ArrowRight className="h-3 w-3 text-white" />
                            </div>
                        </div>
                        <div className="text-xl font-bold mb-2">Thả repository vào đây</div>
                        <div className="text-sm opacity-75 text-center max-w-md">
                            Repository sẽ được thêm vào kênh và tất cả thành viên có thể xem
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RepoDragList;
