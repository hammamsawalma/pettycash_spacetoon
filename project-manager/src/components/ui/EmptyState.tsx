import * as React from "react";
import { FolderKanban, LucideIcon } from "lucide-react";

interface EmptyStateProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    action?: React.ReactNode;
}

export function EmptyState({ title, description, icon: Icon = FolderKanban, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
                <Icon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
            {description && <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">{description}</p>}
            {action && <div>{action}</div>}
        </div>
    );
}
