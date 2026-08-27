import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, FileText, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { computeFileHash, findDuplicateBook, importBookFile, type ImportOptions } from "@/lib/importer";
import { keys } from "@/db/hooks";
import { useUIStore } from "@/stores/uiStore";
import type { Book } from "@/db/schema";

interface DuplicateConflict {
  file: File;
  existingBook: Book;
}

export function ImportButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [pendingQueue, setPendingQueue] = useState<File[]>([]);
  const [currentConflict, setCurrentConflict] = useState<DuplicateConflict | null>(null);
  const qc = useQueryClient();
  const activeFolderContext = useUIStore((s) => s.activeFolderContext);

  const getActiveImportOptions = (): ImportOptions => {
    if (!activeFolderContext) return {};
    return {
      folderId: activeFolderContext.folderId,
      collectionId:
        activeFolderContext.scopeType === "collection"
          ? Number(activeFolderContext.scopeId)
          : undefined,
      isFavorite:
        activeFolderContext.scopeId === "favorites" ? true : undefined,
      readingStatus:
        activeFolderContext.scopeId === "currently-reading"
          ? "currently-reading"
          : activeFolderContext.scopeId === "wanna-read"
          ? "wanna-read"
          : activeFolderContext.scopeId === "finished"
          ? "finished"
          : undefined,
    };
  };

  const processNextInQueue = async (queue: File[]) => {
    if (queue.length === 0) {
      setBusy(false);
      qc.invalidateQueries({ queryKey: keys.books });
      qc.invalidateQueries({ queryKey: keys.folders });
      qc.invalidateQueries({ queryKey: ["bookFolders"] });
      qc.invalidateQueries({ queryKey: ["bookCollections"] });
      qc.invalidateQueries({ queryKey: ["bookOrderScope"] });
      qc.invalidateQueries({ queryKey: ["scopeBooks"] });
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    const [file, ...rest] = queue;
    setPendingQueue(rest);

    try {
      const buffer = await file.arrayBuffer();
      const hash = await computeFileHash(buffer);
      const duplicate = await findDuplicateBook(hash);

      if (duplicate) {
        setCurrentConflict({ file, existingBook: duplicate });
      } else {
        await importBookFile(file, getActiveImportOptions());
        processNextInQueue(rest);
      }
    } catch (err) {
      console.error("Import processing error:", err);
      processNextInQueue(rest);
    }
  };

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    const fileList = Array.from(files);
    processNextInQueue(fileList);
  };

  const handleSkip = () => {
    setCurrentConflict(null);
    processNextInQueue(pendingQueue);
  };

  const handleReplace = async () => {
    if (currentConflict) {
      await importBookFile(currentConflict.file, {
        ...getActiveImportOptions(),
        replaceBookId: currentConflict.existingBook.id,
      });
    }
    setCurrentConflict(null);
    processNextInQueue(pendingQueue);
  };

  const handleKeepBoth = async () => {
    if (currentConflict) {
      await importBookFile(currentConflict.file, getActiveImportOptions());
    }
    setCurrentConflict(null);
    processNextInQueue(pendingQueue);
  };

  const tooltipText = busy
    ? "Importing…"
    : activeFolderContext
    ? `Import books into "${activeFolderContext.folderName}"`
    : "Import books";

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.epub"
        multiple
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
            </Button>
          }
        />
        <TooltipContent>{tooltipText}</TooltipContent>
      </Tooltip>

      {currentConflict && (
        <Dialog open onOpenChange={(open) => !open && handleSkip()}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-yellow-400">
                <AlertCircle className="h-5 w-5" />
                Duplicate Book Detected
              </DialogTitle>
              <DialogDescription className="pt-2 text-sm leading-relaxed text-foreground">
                This book already exists in your library as:
                <div className="my-3 flex items-center gap-3 rounded-lg border border-border/80 bg-accent/30 p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-primary/15 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-sm text-foreground">
                      "{currentConflict.existingBook.title}"
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      by {currentConflict.existingBook.author} · {currentConflict.existingBook.fileType.toUpperCase()}
                    </p>
                  </div>
                </div>
                What would you like to do with <span className="font-semibold text-foreground">"{currentConflict.file.name}"</span>?
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={handleSkip}>
                Skip
              </Button>
              <Button variant="secondary" size="sm" onClick={handleKeepBoth}>
                Keep Both
              </Button>
              <Button variant="default" size="sm" onClick={handleReplace}>
                Replace Existing
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
