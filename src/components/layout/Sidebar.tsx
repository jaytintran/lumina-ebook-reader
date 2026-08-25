import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  Heart,
  BookOpen,
  Bookmark,
  CheckCircle2,
  Plus,
  Folder,
  Users,
  Building2,
  Tag,
  GripVertical,
} from "lucide-react";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import {
  useCollections,
  useSaveCollections,
} from "@/db/hooks";
import { Input } from "@/components/ui/input";

const primaryNav = [
  { to: "/", label: "Home", icon: Home, dropId: "sidebar-nav-home" },
  { to: "/favorites", label: "Favorites", icon: Heart, dropId: "sidebar-nav-favorites" },
  { to: "/currently-reading", label: "Currently Reading", icon: BookOpen, dropId: "sidebar-nav-reading" },
  { to: "/wanna-read", label: "Wanna Read", icon: Bookmark, dropId: "sidebar-nav-wanna-read" },
  { to: "/finished", label: "Finished", icon: CheckCircle2, dropId: "sidebar-nav-finished" },
];

const smartViews = [
  { to: "/authors", label: "Authors", icon: Users },
  { to: "/publishers", label: "Publishers", icon: Building2 },
  { to: "/tags", label: "Tags", icon: Tag },
];

function DroppableNavItem({
  to,
  label,
  icon: Icon,
  dropId,
}: {
  to: string;
  label: string;
  icon: typeof Home;
  dropId?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: dropId ?? `nav-${to}`,
    disabled: !dropId,
  });

  return (
    <div ref={setNodeRef} className="w-full">
      <NavLink
        to={to}
        className={({ isActive }) =>
          cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all whitespace-nowrap",
            isActive
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:bg-accent hover:text-foreground",
            isOver && "bg-primary/25 text-primary ring-1 ring-primary scale-[1.02]",
          )
        }
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="whitespace-nowrap">{label}</span>
      </NavLink>
    </div>
  );
}

function SortableCollectionItem({
  collection,
}: {
  collection: { id?: number; name: string; order: number };
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: collection.id! });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `sidebar-collection-${collection.id}`,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : undefined,
        zIndex: isDragging ? 20 : undefined,
      }}
      className="group/col flex items-center rounded-md"
    >
      <div
        {...attributes}
        {...listeners}
        className="opacity-0 group-hover/col:opacity-100 p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing transition-opacity"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </div>

      <div
        ref={setDropRef}
        className={cn(
          "flex-1 rounded-md transition-all",
          isOver && "bg-primary/25 ring-2 ring-primary scale-[1.02] shadow-sm",
        )}
      >
        <NavLink
          to={`/collections/${collection.id}`}
          className={({ isActive }) =>
            cn(
              "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium transition-colors whitespace-nowrap",
              isActive
                ? "bg-primary/15 text-primary font-semibold"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
              isOver && "text-primary font-semibold",
            )
          }
        >
          <Folder className="h-4 w-4 shrink-0 text-primary/80" />
          <span className="whitespace-nowrap truncate">{collection.name}</span>
        </NavLink>
      </div>
    </div>
  );
}

export function Sidebar() {
  const { data: collections = [] } = useCollections();
  const saveCollections = useSaveCollections();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 6,
      },
    }),
  );

  const addCollection = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    await saveCollections.mutateAsync([{ name: trimmed, order: collections.length }]);
    setName("");
    setAdding(false);
  };

  const handleCollectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = collections.findIndex((c) => c.id === active.id);
    const newIndex = collections.findIndex((c) => c.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(collections, oldIndex, newIndex).map((c, idx) => ({
        ...c,
        order: idx,
      }));
      saveCollections.mutate(reordered);
    }
  };

  return (
    <aside className="flex h-screen min-w-64 max-w-sm w-max shrink-0 flex-col border-r border-border bg-background transition-all duration-200">
      <div className="flex items-center gap-3 px-4 py-4.5 whitespace-nowrap border-b border-border/40">
        <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 via-indigo-500 to-purple-600 shadow-md shadow-indigo-500/20 shrink-0">
          <svg
            className="h-5 w-5 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" fill="white" fillOpacity="0.2" />
            <path d="M6 2v20" />
            <path d="M12 7l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" fill="white" stroke="none" />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-base font-extrabold tracking-wider bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            LUMINA
          </span>
          <span className="text-[10px] uppercase font-semibold tracking-widest text-muted-foreground/80 -mt-1">
            Ebook Reader
          </span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto overflow-x-hidden px-3 pb-4">
        {/* Primary Sections (Drop Targets) */}
        <div className="flex flex-col gap-1">
          {primaryNav.map((item) => (
            <DroppableNavItem
              key={item.to}
              to={item.to}
              label={item.label}
              icon={item.icon}
              dropId={item.dropId}
            />
          ))}
        </div>

        {/* Collections with Drag-to-Reorder and Drop Targets */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between px-3 py-1 whitespace-nowrap">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Collections
            </span>
            <button
              onClick={() => setAdding((v) => !v)}
              className="text-muted-foreground hover:text-foreground p-0.5 rounded hover:bg-accent cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          {adding && (
            <div className="px-3 pb-1">
              <Input
                autoFocus
                value={name}
                placeholder="Collection name"
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addCollection();
                  if (e.key === "Escape") setAdding(false);
                }}
                onBlur={addCollection}
                className="h-8 text-sm"
              />
            </div>
          )}

          <DndContext sensors={sensors} onDragEnd={handleCollectionDragEnd}>
            <SortableContext
              items={collections.map((c) => c.id!)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-0.5">
                {collections.map((c) => (
                  <SortableCollectionItem key={c.id} collection={c} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* Smart Views */}
        <div className="flex flex-col gap-1">
          <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
            Smart Views
          </span>
          {smartViews.map((item) => (
            <DroppableNavItem
              key={item.to}
              to={item.to}
              label={item.label}
              icon={item.icon}
            />
          ))}
        </div>
      </nav>
    </aside>
  );
}
