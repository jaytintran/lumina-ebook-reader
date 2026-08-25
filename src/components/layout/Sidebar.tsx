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
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";

const primaryNav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/favorites", label: "Favorites", icon: Heart },
  { to: "/currently-reading", label: "Currently Reading", icon: BookOpen },
  { to: "/wanna-read", label: "Wanna Read", icon: Bookmark },
  { to: "/finished", label: "Finished", icon: CheckCircle2 },
];

const smartViews = [
  { to: "/authors", label: "Authors", icon: Users },
  { to: "/publishers", label: "Publishers", icon: Building2 },
  { to: "/tags", label: "Tags", icon: Tag },
];

// Mock — replaced with a Dexie liveQuery in the next step
const mockCollections = [
  { id: 1, name: "Esoteric & LoA" },
  { id: 2, name: "Power & Influence" },
];

function NavItem({
  to,
  label,
  icon: Icon,
}: {
  to: string;
  label: string;
  icon: typeof Home;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-primary/15 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-foreground",
        )
      }
    >
      <Icon className="h-4 w-4" />
      {label}
    </NavLink>
  );
}

export function Sidebar() {
  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-border bg-background">
      <div className="flex items-center gap-2 px-4 py-4">
        <LayoutGrid className="h-5 w-5 text-primary" />
        <span className="text-lg font-semibold">Bookshelf</span>
      </div>

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 pb-4">
        <div className="flex flex-col gap-1">
          {primaryNav.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between px-3 py-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Collections
            </span>
            <button className="text-muted-foreground hover:text-foreground">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          {mockCollections.map((c) => (
            <NavItem
              key={c.id}
              to={`/collections/${c.id}`}
              label={c.name}
              icon={Folder}
            />
          ))}
        </div>

        <div className="flex flex-col gap-1">
          <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Smart Views
          </span>
          {smartViews.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </div>
      </nav>
    </aside>
  );
}
