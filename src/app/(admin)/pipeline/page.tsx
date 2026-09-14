"use client";

import { useMemo } from "react";
import Link from "next/link";
import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import { Loader2 } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { useApiData } from "@/lib/use-api";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/Toast";
import { STAGES, STAGE_LABELS, STAGE_COLORS, POSITION_LABELS, type Stage, type Position } from "@/lib/constants";
import type { Candidate } from "@/db/schema";

export default function PipelinePage() {
  const { data, loading, setData } = useApiData<Candidate[]>("/api/candidates");
  const { show } = useToast();

  const columns = useMemo(() => {
    const map = new Map<Stage, Candidate[]>(STAGES.map((s) => [s, [] as Candidate[]]));
    for (const c of data ?? []) {
      map.get(c.stage as Stage)?.push(c);
    }
    return map;
  }, [data]);

  async function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newStage = destination.droppableId as Stage;
    const snapshot = data;
    setData((prev) => (prev ?? []).map((c) => (c.id === draggableId ? { ...c, stage: newStage } : c)));

    try {
      await api.patch(`/api/candidates/${draggableId}/stage`, { stage: newStage });
    } catch {
      setData(snapshot ?? null);
      show("Couldn't move candidate — please try again", "error");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Pipeline</h1>
        <p className="text-sm text-stone-500">Drag candidates between stages.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="animate-spin text-stone-400" size={28} />
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STAGES.map((stage) => (
              <div key={stage} className="flex w-72 shrink-0 flex-col rounded-2xl bg-stone-100/70">
                <div className="flex items-center justify-between px-3.5 pt-3.5 pb-2">
                  <span className={`flex items-center gap-1.5 text-sm font-semibold ${STAGE_COLORS[stage].text}`}>
                    <span className={`h-2 w-2 rounded-full ${STAGE_COLORS[stage].dot}`} />
                    {STAGE_LABELS[stage]}
                  </span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-stone-500">
                    {columns.get(stage)?.length ?? 0}
                  </span>
                </div>
                <Droppable droppableId={stage}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex min-h-[140px] flex-1 flex-col gap-2 p-3 transition-colors ${
                        snapshot.isDraggingOver ? "bg-orange-50/70" : ""
                      }`}
                    >
                      {(columns.get(stage) ?? []).map((candidate, index) => (
                        <Draggable key={candidate.id} draggableId={candidate.id} index={index}>
                          {(dragProvided, dragSnapshot) => (
                            <Link
                              href={`/candidates/${candidate.id}`}
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              draggable={false}
                              className={`flex items-center gap-2.5 rounded-xl border border-stone-200 bg-white p-2.5 shadow-sm ${
                                dragSnapshot.isDragging ? "shadow-lg ring-2 ring-orange-300" : "hover:border-stone-300"
                              }`}
                            >
                              <Avatar src={candidate.photoUrl} name={candidate.fullName} size="sm" />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-stone-800">{candidate.fullName}</p>
                                <p className="truncate text-xs text-stone-400">
                                  {candidate.position === "OTHER" && candidate.otherPositionText
                                    ? candidate.otherPositionText
                                    : POSITION_LABELS[candidate.position as Position]}
                                </p>
                              </div>
                            </Link>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {(columns.get(stage) ?? []).length === 0 && (
                        <p className="px-1 py-6 text-center text-xs text-stone-400">Drop candidates here</p>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}
    </div>
  );
}
