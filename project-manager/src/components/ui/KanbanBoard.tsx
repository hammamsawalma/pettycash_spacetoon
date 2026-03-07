"use client"
import React, { useState } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Project, User } from '@prisma/client';
import { Card } from '@/components/ui/Card';

type ProjectWithRelations = Project & {
    manager: User | null;
    _count: { members: number; invoices: number; purchases: number }
};

interface SortableProjectCardProps {
    project: ProjectWithRelations;
    onProjectClick?: (id: string) => void;
}

function SortableProjectCard({ project, onProjectClick }: SortableProjectCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: project.id, data: project });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        cursor: 'grab'
    };

    const isCompleted = project.status === 'COMPLETED';
    const isInProgress = project.status === 'IN_PROGRESS';
    const statusLabel = isCompleted ? 'مكتمل' : isInProgress ? 'قيد التنفيذ' : 'متوقف';

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none">
            <Card onClick={() => onProjectClick?.(project.id)} className={`p-4 space-y-3 relative overflow-hidden rounded-xl bg-white hover:shadow-md transition-shadow ${isDragging ? "ring-2 ring-[#102550]" : "border-gray-100"}`}>
                <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1">
                        <h4 className="font-bold text-sm text-gray-900 group-hover:text-[#102550] transition-colors line-clamp-1">{project.name}</h4>
                        <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-blue-50 text-[#102550]">
                            {statusLabel}
                        </span>
                    </div>
                    {project.manager && (
                        <div title={project.manager.name} className="w-6 h-6 rounded-full bg-blue-100 border border-white flex items-center justify-center text-[10px] shadow-sm text-blue-700 font-bold shrink-0">
                            {project.manager.name.charAt(0)}
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center pt-2 gap-2">
                    <p className="text-[10px] text-gray-500 font-medium">
                        {project.endDate ? new Date(project.endDate).toLocaleDateString('en-GB') : 'تاريخ غير محدد'}
                    </p>
                    <div className="flex row gap-2 text-[10px] text-gray-500 font-bold">
                        <span>{project._count.members} 👤</span>
                        <span>{project._count.invoices} 📄</span>
                    </div>
                </div>
            </Card>
        </div>
    );
}

export function KanbanBoard({ projects, onProjectClick, onStatusChange }: { projects: ProjectWithRelations[], onProjectClick: (id: string) => void, onStatusChange: (projectId: string, newStatus: string) => void }) {
    const [localProjects, setLocalProjects] = useState(projects);
    const [activeProject, setActiveProject] = useState<ProjectWithRelations | null>(null);

    // Sync with external updates
    React.useEffect(() => {
        setLocalProjects(projects);
    }, [projects]);

    const columns = [
        { id: 'PENDING', title: 'متوقفة', color: 'border-red-200 bg-red-50/50 text-red-700' },
        { id: 'IN_PROGRESS', title: 'قيد التنفيذ', color: 'border-blue-200 bg-blue-50/50 text-blue-700' },
        { id: 'COMPLETED', title: 'مكتملة', color: 'border-emerald-200 bg-emerald-50/50 text-emerald-700' }
    ];

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const project = localProjects.find((p) => p.id === active.id);
        if (project) setActiveProject(project);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveProject(null);
        const { active, over } = event;

        if (!over) return;

        const projectId = active.id as string;
        const overId = over.id as string;

        // Find if we hovered over a column
        const column = columns.find(col => col.id === overId);

        let newStatus = '';
        if (column) {
            newStatus = column.id;
        } else {
            const overProject = localProjects.find((p) => p.id === overId);
            if (overProject) newStatus = overProject.status;
        }

        if (newStatus && activeProject && activeProject.status !== newStatus) {
            // Optimistic update
            setLocalProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: newStatus as "COMPLETED" | "IN_PROGRESS" | "PENDING" } : p));
            // Backend update
            onStatusChange(projectId, newStatus);
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex flex-row gap-4 md:gap-6 w-full max-w-full overflow-x-auto pb-4 custom-scrollbar snap-x snap-mandatory px-1 hover:cursor-grab active:cursor-grabbing">
                {columns.map(column => {
                    const columnProjects = localProjects.filter(p => p.status === column.id);
                    return (
                        <div key={column.id} className="flex-1 min-w-[280px] md:min-w-[320px] shrink-0 flex flex-col gap-3 snap-center">
                            <div className={`p-3 rounded-xl border ${column.color} font-bold text-sm flex justify-between items-center`}>
                                <span>{column.title}</span>
                                <span className="bg-white/60 px-2 py-0.5 rounded-md text-xs">{columnProjects.length}</span>
                            </div>

                            <div className="flex-1 bg-gray-50/50 rounded-2xl p-2 md:p-3 min-h-[300px]">
                                <SortableContext
                                    items={columnProjects.map(p => p.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="space-y-3" id={column.id}>
                                        {columnProjects.map(project => (
                                            <SortableProjectCard
                                                key={project.id}
                                                project={project}
                                                onProjectClick={onProjectClick}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                                {columnProjects.length === 0 && (
                                    <div className="h-full w-full border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center p-6 mt-2 text-xs font-semibold text-gray-400">
                                        اسحب المشاريع إلى هنا
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <DragOverlay>
                {activeProject ? (
                    <div className="rotate-2 opacity-90 cursor-grabbing shadow-2xl scale-105">
                        <SortableProjectCard project={activeProject} />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
