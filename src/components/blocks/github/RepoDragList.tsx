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
            <div className="p-6 pt-2 border-b border-zinc-800">
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-zinc-300">Repository có sẵn</h3>
                        <span className="text-xs text-zinc-500">{repos.length} repo</span>
                    </div>
                    <p className="text-xs text-zinc-400">
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
                                        ? 'bg-zinc-100 dark:bg-zinc-800/50 border-zinc-700 opacity-50 cursor-not-allowed'
                                        : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-700 hover:border-blue-500 hover:bg-zinc-100 dark:bg-zinc-800 cursor-grab active:cursor-grabbing hover:shadow-lg hover:shadow-blue-500/10'
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
                                            <span className="text-sm font-semibold text-black dark:text-white truncate">
                                                {repo.name}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-xs text-zinc-400 truncate">
                                        {repo.full_name}
                                    </div>
                                    {repo.description && (
                                        <div className="text-xs text-zinc-500 truncate mt-1">
                                            {repo.description}
                                        </div>
                                    )}
                                </div>

                                {!isAlreadyAdded && (
                                    <div className="text-xs text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
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
                        ? 'border-blue-500 bg-blue-950/20 shadow-inner shadow-blue-500/20'
                        : 'border-zinc-700 bg-zinc-50 dark:bg-zinc-950'
                    }
                `}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
            >
                <div className={`pb-2 flex items-center justify-between border-b mb-4 transition-colors ${isDragOver ? 'border-blue-600' : 'border-zinc-800'}`}>
                    <div className="text-lg font-semibold flex items-center text-black dark:text-white">
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
                                <ArrowRight className="h-3 w-3 text-black dark:text-white" />
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