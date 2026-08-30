import { useState } from "react";
import {
  FastForward,
  Gauge,
  Headphones,
  Highlighter,
  Minus,
  Pause,
  Play,
  Rewind,
  Sparkles,
  Square,
  Volume2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { AudioVoice, NarrationSentence } from "@/hooks/useAudioNarration";

interface AudioPlayerBarProps {
  isOpen: boolean;
  isPlaying: boolean;
  isPaused?: boolean;
  activeSentence: NarrationSentence | null;
  sentenceIndex: number;
  totalSentences: number;
  availableVoices: AudioVoice[];
  selectedVoiceURI: string;
  rate: number;
  syncHighlight: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onNext: () => void;
  onPrev: () => void;
  onRateChange: (rate: number) => void;
  onVoiceChange: (voiceURI: string) => void;
  onToggleSyncHighlight: () => void;
  onClose: () => void;
  locationLabel: string;
}

const SPEED_OPTIONS = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

export function AudioPlayerBar({
  isOpen,
  isPlaying,
  activeSentence,
  sentenceIndex,
  totalSentences,
  availableVoices,
  selectedVoiceURI,
  rate,
  syncHighlight,
  onPlay,
  onPause,
  onStop,
  onNext,
  onPrev,
  onRateChange,
  onVoiceChange,
  onToggleSyncHighlight,
  onClose,
  locationLabel,
}: AudioPlayerBarProps) {
  const [minimized, setMinimized] = useState(false);

  if (!isOpen) return null;

  const currentVoice = availableVoices.find((v) => v.voice.voiceURI === selectedVoiceURI);
  const progressPercent =
    totalSentences > 0 ? Math.round(((sentenceIndex + 1) / totalSentences) * 100) : 0;

  // Render floating mini pill when minimized
  if (minimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
        <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-background/90 p-1.5 shadow-2xl backdrop-blur-md">
          <button
            type="button"
            onClick={isPlaying ? onPause : onPlay}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-105 cursor-pointer"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </button>
          <button
            type="button"
            onClick={() => setMinimized(false)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-foreground hover:text-primary transition-colors cursor-pointer"
          >
            <Headphones className="h-3.5 w-3.5 text-primary" />
            <span>Audiobook ({locationLabel})</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="flex flex-col gap-2 rounded-2xl border border-border/80 bg-card/95 p-3.5 shadow-2xl backdrop-blur-md text-foreground select-none ring-1 ring-white/10">
        {/* Top Info Bar */}
        <div className="flex items-center justify-between text-xs px-1">
          <div className="flex items-center gap-2 truncate">
            <span className="flex h-5 items-center gap-1 rounded-md bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-primary border border-primary/20">
              <Headphones className="h-3 w-3" />
              <span>Narration</span>
            </span>
            <span className="font-semibold text-foreground truncate">{locationLabel}</span>
            {totalSentences > 0 && (
              <span className="text-[11px] text-muted-foreground tabular-nums">
                ({sentenceIndex + 1}/{totalSentences})
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Sync Highlight Toggle */}
            <button
              type="button"
              onClick={onToggleSyncHighlight}
              className={cn(
                "flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer border",
                syncHighlight
                  ? "bg-amber-400/15 border-amber-400/30 text-amber-400"
                  : "bg-muted border-transparent text-muted-foreground hover:text-foreground"
              )}
              title={
                syncHighlight
                  ? "Sentence highlight & auto-scroll enabled"
                  : "Sentence highlight disabled"
              }
            >
              <Highlighter className="h-3 w-3" />
              <span className="hidden sm:inline">Highlight Sync</span>
            </button>

            {/* Minimize */}
            <button
              type="button"
              onClick={() => setMinimized(true)}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Minimize player"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={() => {
                onStop();
                onClose();
              }}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Close audio reader"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Spoken Text Preview (Snippet) */}
        {activeSentence && (
          <div className="rounded-lg bg-background/60 px-3 py-1.5 text-xs text-muted-foreground italic truncate border border-border/50">
            &ldquo;{activeSentence.text}&rdquo;
          </div>
        )}

        {/* Progress Bar */}
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Main Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          {/* Voice Selector Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 max-w-[180px] gap-1.5 text-xs font-medium truncate cursor-pointer bg-background/50 border-border/70"
                >
                  <Volume2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="truncate">
                    {currentVoice ? currentVoice.name.replace(/(Microsoft|Google|Apple)\s*/i, "") : "Select Voice"}
                  </span>
                </Button>
              }
            />
            <DropdownMenuContent align="start" className="w-72 max-h-60 overflow-y-auto p-1">
              <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
                Natural & Neural Voices
              </DropdownMenuLabel>
              {availableVoices.map((v) => (
                <DropdownMenuItem
                  key={v.voice.voiceURI}
                  onClick={() => onVoiceChange(v.voice.voiceURI)}
                  className={cn(
                    "flex items-center justify-between text-xs cursor-pointer py-1.5",
                    v.voice.voiceURI === selectedVoiceURI && "bg-primary/10 text-primary font-semibold"
                  )}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="truncate">{v.name}</span>
                    <span className="text-[10px] text-muted-foreground">{v.lang}</span>
                  </div>
                  {v.isNatural && (
                    <span className="flex items-center gap-1 rounded bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[9px] font-bold text-amber-400 shrink-0">
                      <Sparkles className="h-2.5 w-2.5" /> Natural
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Core Playback Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onPrev}
              disabled={sentenceIndex <= 0}
              className="h-8 w-8 text-foreground hover:bg-muted cursor-pointer"
              title="Previous sentence"
            >
              <Rewind className="h-4 w-4" />
            </Button>

            <Button
              size="sm"
              onClick={isPlaying ? onPause : onPlay}
              className="h-9 w-9 rounded-full bg-primary text-primary-foreground shadow-md hover:scale-105 transition-transform cursor-pointer p-0"
              title={isPlaying ? "Pause Narration (Space)" : "Play Narration (Space)"}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onNext}
              disabled={sentenceIndex >= totalSentences - 1}
              className="h-8 w-8 text-foreground hover:bg-muted cursor-pointer"
              title="Next sentence"
            >
              <FastForward className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onStop}
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
              title="Stop Narration"
            >
              <Square className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Speed Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 text-xs font-semibold tabular-nums cursor-pointer bg-background/50 border-border/70"
                  title="Speech Speed"
                >
                  <Gauge className="h-3.5 w-3.5 text-primary" />
                  <span>{rate}×</span>
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-28 p-1">
              <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
                Speed
              </DropdownMenuLabel>
              {SPEED_OPTIONS.map((speed) => (
                <DropdownMenuItem
                  key={speed}
                  onClick={() => onRateChange(speed)}
                  className={cn(
                    "justify-between text-xs cursor-pointer tabular-nums",
                    rate === speed && "bg-primary/15 text-primary font-bold"
                  )}
                >
                  <span>{speed}×</span>
                  {speed === 1.0 && <span className="text-[10px] text-muted-foreground">Normal</span>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
