import { useState } from "react";
import { Download, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBooks, useSettings, useUpdateSettings } from "@/db/hooks";
import type { AppSettings } from "@/db/schema";
import { useUIStore } from "@/stores/uiStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function Segment<T extends string | number>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex rounded-md border border-border p-0.5">
      {options.map((o) => (
        <button
          key={String(o.value)}
          onClick={() => onChange(o.value)}
          className={cn(
            "flex-1 rounded px-3 py-1.5 text-sm",
            value === o.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const PREVIEW_FIELDS: { key: keyof AppSettings; label: string }[] = [
  { key: "showSubtitle", label: "Subtitle" },
  { key: "showAuthor", label: "Author" },
  { key: "showRating", label: "Rating" },
  { key: "showTags", label: "Tags" },
  { key: "showDescription", label: "Description" },
];

export function SettingsModal() {
  const open = useUIStore((s) => s.settingsOpen);
  const setOpen = useUIStore((s) => s.setSettingsOpen);
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const { data: books = [] } = useBooks();

  const [sourceTitle, setSourceTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");

  if (!open || isLoading || !settings) return null;

  const addSource = () => {
    if (!sourceTitle.trim() || !sourceUrl.trim()) return;
    updateSettings.mutate({
      sources: [
        ...settings.sources,
        {
          id: crypto.randomUUID(),
          title: sourceTitle.trim(),
          url: sourceUrl.trim(),
        },
      ],
    });
    setSourceTitle("");
    setSourceUrl("");
  };

  const exportBooks = () => {
    const blob = new Blob([JSON.stringify(books, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "books.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open onOpenChange={setOpen}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Theme</span>
            <Segment
              value={settings.theme}
              onChange={(theme) => updateSettings.mutate({ theme })}
              options={[
                { value: "dark", label: "Dark" },
                { value: "light", label: "Light" },
              ]}
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">View Mode</span>
            <Segment
              value={settings.viewMode}
              onChange={(viewMode) => updateSettings.mutate({ viewMode })}
              options={[
                { value: "grid", label: "Grid" },
                { value: "row", label: "Row" },
              ]}
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Books per row</span>
            <Segment
              value={settings.booksPerRow}
              onChange={(booksPerRow) => updateSettings.mutate({ booksPerRow })}
              options={[
                { value: 3, label: "3" },
                { value: 4, label: "4" },
                { value: 5, label: "5" },
              ]}
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Book preview shows</span>
            {PREVIEW_FIELDS.map((f) => (
              <label
                key={f.key}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={!!settings[f.key]}
                  onChange={() =>
                    updateSettings.mutate({ [f.key]: !settings[f.key] })
                  }
                  className="h-4 w-4 accent-primary"
                />
                {f.label}
              </label>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Download sources</span>
            {settings.sources.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{s.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{s.url}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() =>
                    updateSettings.mutate({
                      sources: settings.sources.filter((x) => x.id !== s.id),
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <Input
                value={sourceTitle}
                onChange={(e) => setSourceTitle(e.target.value)}
                placeholder="Source title"
                className="h-8"
              />
              <Input
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://..."
                className="h-8"
              />
              <Button size="sm" onClick={addSource}>
                <Plus className="mr-1 h-4 w-4" /> Add
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Export</span>
            <Button variant="outline" size="sm" onClick={exportBooks}>
              <Download className="mr-1 h-4 w-4" /> Export books (JSON)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
