import { useState, useEffect, useRef, useCallback } from "react";
import type { ParsedEpubContent } from "@/lib/importer";
import * as pdfjs from "pdfjs-dist";

export interface AudioVoice {
  voice: SpeechSynthesisVoice;
  name: string;
  lang: string;
  isNatural: boolean;
}

export interface NarrationSentence {
  text: string;
  sectionOrPage: number;
  index: number;
}

export interface UseAudioNarrationProps {
  bookType?: "pdf" | "epub";
  epubDoc?: ParsedEpubContent | null;
  pdfDoc?: pdfjs.PDFDocumentProxy | null;
  currentLocation: number; // 0-indexed section for epub, 1-indexed page for pdf
  onLocationChange?: (newLoc: number) => void;
}

// Split text into coherent sentences for natural TTS flow
export function splitIntoSentences(rawText: string): string[] {
  if (!rawText) return [];
  // Clean whitespace and normalize linebreaks
  const clean = rawText
    .replace(/\r\n/g, " ")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!clean) return [];

  // Match sentences ending in punctuation or quotes
  const matches = clean.match(/[^.!?]+[.!?]+["']?|[^.!?]+$/g);
  if (!matches) return [clean];

  return matches
    .map((s) => s.trim())
    .filter((s) => s.length > 1 && /[a-zA-Z0-9\u00C0-\u024F\u1EA0-\u1EF9]/.test(s));
}

// Extract plain sentences from EPUB section HTML
export function extractEpubSentences(html: string, sectionIdx: number): NarrationSentence[] {
  if (!html) return [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Remove script and style elements
  doc.querySelectorAll("script, style, noscript").forEach((el) => el.remove());

  // Collect text from structural paragraphs/headings/blocks
  const blocks = doc.querySelectorAll("h1, h2, h3, h4, h5, h6, p, blockquote, li, td, th");
  const sentences: NarrationSentence[] = [];
  let sIdx = 0;

  if (blocks.length > 0) {
    blocks.forEach((b) => {
      const text = b.textContent?.trim();
      if (text) {
        const split = splitIntoSentences(text);
        for (const s of split) {
          sentences.push({ text: s, sectionOrPage: sectionIdx, index: sIdx++ });
        }
      }
    });
  } else {
    const rawText = doc.body.textContent || "";
    const split = splitIntoSentences(rawText);
    for (const s of split) {
      sentences.push({ text: s, sectionOrPage: sectionIdx, index: sIdx++ });
    }
  }

  return sentences;
}

export function useAudioNarration({
  bookType,
  epubDoc,
  pdfDoc,
  currentLocation,
  onLocationChange,
}: UseAudioNarrationProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeSentence, setActiveSentence] = useState<NarrationSentence | null>(null);
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [sentences, setSentences] = useState<NarrationSentence[]>([]);
  const [availableVoices, setAvailableVoices] = useState<AudioVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>("");
  const [rate, setRate] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("lumina-voice-rate");
      return saved ? parseFloat(saved) : 1.0;
    } catch {
      return 1.0;
    }
  });
  const [syncHighlight, setSyncHighlight] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("lumina-voice-synchighlight");
      return saved !== null ? saved === "true" : true;
    } catch {
      return true;
    }
  });

  const [isOpen, setIsOpen] = useState(false);

  // References to keep callbacks current without re-triggering effects
  const synthRef = useRef<SpeechSynthesis | null>(
    typeof window !== "undefined" ? window.speechSynthesis : null
  );
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const sentencesRef = useRef<NarrationSentence[]>([]);
  const sentenceIndexRef = useRef(0);
  const currentLocationRef = useRef(currentLocation);
  const onLocationChangeRef = useRef(onLocationChange);
  const isPlayingRef = useRef(isPlaying);
  const rateRef = useRef(rate);
  const selectedVoiceURIRef = useRef(selectedVoiceURI);

  sentencesRef.current = sentences;
  sentenceIndexRef.current = sentenceIndex;
  currentLocationRef.current = currentLocation;
  onLocationChangeRef.current = onLocationChange;
  isPlayingRef.current = isPlaying;
  rateRef.current = rate;
  selectedVoiceURIRef.current = selectedVoiceURI;

  // Load available voices from SpeechSynthesis
  const loadVoices = useCallback(() => {
    if (!synthRef.current) return;
    const rawVoices = synthRef.current.getVoices();
    if (!rawVoices.length) return;

    const list: AudioVoice[] = rawVoices.map((v) => {
      const nameLower = v.name.toLowerCase();
      const isNatural =
        nameLower.includes("natural") ||
        nameLower.includes("neural") ||
        nameLower.includes("online") ||
        nameLower.includes("enhanced") ||
        nameLower.includes("premium") ||
        nameLower.includes("siri") ||
        nameLower.includes("google");
      return {
        voice: v,
        name: v.name,
        lang: v.lang,
        isNatural,
      };
    });

    // Sort Natural voices first, then English / primary language, then alphabetically
    list.sort((a, b) => {
      if (a.isNatural && !b.isNatural) return -1;
      if (!a.isNatural && b.isNatural) return 1;
      if (a.lang.startsWith("en") && !b.lang.startsWith("en")) return -1;
      if (!a.lang.startsWith("en") && b.lang.startsWith("en")) return 1;
      return a.name.localeCompare(b.name);
    });

    setAvailableVoices(list);

    // Pick best default voice if none selected or saved
    const savedVoice = localStorage.getItem("lumina-voice-uri");
    if (savedVoice && list.some((v) => v.voice.voiceURI === savedVoice)) {
      setSelectedVoiceURI(savedVoice);
    } else if (list.length > 0) {
      const defaultNatural = list.find((v) => v.isNatural && v.lang.startsWith("en")) || list[0];
      setSelectedVoiceURI(defaultNatural.voice.voiceURI);
    }
  }, []);

  useEffect(() => {
    loadVoices();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [loadVoices]);

  // Load sentences for current EPUB section or PDF page
  const loadTextForLocation = useCallback(
    async (loc: number): Promise<NarrationSentence[]> => {
      if (bookType === "epub" && epubDoc?.sections) {
        const sec = epubDoc.sections[loc];
        if (!sec) return [];
        return extractEpubSentences(sec.html, loc);
      }

      if (bookType === "pdf" && pdfDoc) {
        try {
          const page = await pdfDoc.getPage(loc);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item) => ("str" in item ? item.str : ""))
            .join(" ");
          const split = splitIntoSentences(pageText);
          return split.map((text, idx) => ({
            text,
            sectionOrPage: loc,
            index: idx,
          }));
        } catch {
          return [];
        }
      }

      return [];
    },
    [bookType, epubDoc, pdfDoc]
  );

  // Update sentences whenever location changes or doc becomes available
  useEffect(() => {
    let active = true;
    loadTextForLocation(currentLocation).then((list) => {
      if (active) {
        setSentences(list);
        if (!isPlayingRef.current) {
          setSentenceIndex(0);
          setActiveSentence(list[0] || null);
        }
      }
    });
    return () => {
      active = false;
    };
  }, [currentLocation, loadTextForLocation]);

  // Main speech loop
  const speakSentenceAt = useCallback(
    (index: number, currentList: NarrationSentence[]) => {
      const synth = synthRef.current;
      if (!synth) return;

      synth.cancel();

      if (index >= currentList.length) {
        // End of current section or page -> automatically move to next!
        const nextLoc =
          bookType === "pdf"
            ? currentLocationRef.current + 1
            : currentLocationRef.current + 1;

        const maxLoc =
          bookType === "pdf"
            ? (pdfDoc?.numPages ?? 1)
            : (epubDoc?.sections?.length ?? 1) - 1;

        if (nextLoc <= maxLoc && onLocationChangeRef.current) {
          onLocationChangeRef.current(nextLoc);
          loadTextForLocation(nextLoc).then((newList) => {
            setSentences(newList);
            setSentenceIndex(0);
            if (newList.length > 0) {
              setActiveSentence(newList[0]);
              speakSentenceAt(0, newList);
            } else {
              setIsPlaying(false);
              setIsPaused(false);
            }
          });
        } else {
          // Reached very end of book
          setIsPlaying(false);
          setIsPaused(false);
          setActiveSentence(null);
        }
        return;
      }

      const target = currentList[index];
      if (!target) {
        setIsPlaying(false);
        return;
      }

      setSentenceIndex(index);
      setActiveSentence(target);

      const utterance = new SpeechSynthesisUtterance(target.text);
      utterance.rate = rateRef.current;

      const rawVoices = synth.getVoices();
      const chosen = rawVoices.find((v) => v.voiceURI === selectedVoiceURIRef.current);
      if (chosen) {
        utterance.voice = chosen;
      }

      utterance.onend = () => {
        if (isPlayingRef.current) {
          speakSentenceAt(index + 1, currentList);
        }
      };

      utterance.onerror = (e) => {
        if (e.error === "interrupted" || e.error === "canceled") return;
        if (isPlayingRef.current) {
          speakSentenceAt(index + 1, currentList);
        }
      };

      utteranceRef.current = utterance;
      synth.speak(utterance);
    },
    [bookType, pdfDoc, epubDoc, loadTextForLocation]
  );

  const handlePlay = useCallback(() => {
    if (!synthRef.current) return;

    if (isPaused) {
      synthRef.current.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    setIsPlaying(true);
    setIsPaused(false);
    setIsOpen(true);

    const list = sentencesRef.current;
    const startIdx = sentenceIndexRef.current < list.length ? sentenceIndexRef.current : 0;
    speakSentenceAt(startIdx, list);
  }, [isPaused, speakSentenceAt]);

  const handlePause = useCallback(() => {
    if (!synthRef.current) return;
    synthRef.current.pause();
    setIsPlaying(false);
    setIsPaused(true);
  }, []);

  const handleStop = useCallback(() => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setActiveSentence(null);
  }, []);

  const handleNext = useCallback(() => {
    const list = sentencesRef.current;
    const nextIdx = sentenceIndexRef.current + 1;
    speakSentenceAt(nextIdx, list);
  }, [speakSentenceAt]);

  const handlePrev = useCallback(() => {
    const list = sentencesRef.current;
    const prevIdx = Math.max(0, sentenceIndexRef.current - 1);
    speakSentenceAt(prevIdx, list);
  }, [speakSentenceAt]);

  const handleRateChange = useCallback((newRate: number) => {
    setRate(newRate);
    rateRef.current = newRate;
    try {
      localStorage.setItem("lumina-voice-rate", String(newRate));
    } catch {
      // ignore
    }
    // Re-speak current sentence with new rate if playing
    if (isPlayingRef.current && synthRef.current) {
      const list = sentencesRef.current;
      const curIdx = sentenceIndexRef.current;
      speakSentenceAt(curIdx, list);
    }
  }, [speakSentenceAt]);

  const handleVoiceChange = useCallback((voiceURI: string) => {
    setSelectedVoiceURI(voiceURI);
    selectedVoiceURIRef.current = voiceURI;
    try {
      localStorage.setItem("lumina-voice-uri", voiceURI);
    } catch {
      // ignore
    }
    if (isPlayingRef.current && synthRef.current) {
      const list = sentencesRef.current;
      const curIdx = sentenceIndexRef.current;
      speakSentenceAt(curIdx, list);
    }
  }, [speakSentenceAt]);

  const toggleSyncHighlight = useCallback(() => {
    setSyncHighlight((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("lumina-voice-synchighlight", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Cleanup synthesis when unmounting
  useEffect(() => {
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  return {
    isOpen,
    setIsOpen,
    isPlaying,
    isPaused,
    activeSentence,
    sentenceIndex,
    totalSentences: sentences.length,
    availableVoices,
    selectedVoiceURI,
    rate,
    syncHighlight,
    handlePlay,
    handlePause,
    handleStop,
    handleNext,
    handlePrev,
    handleRateChange,
    handleVoiceChange,
    toggleSyncHighlight,
  };
}
