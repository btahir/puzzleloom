"use client";
import { copy } from "../content/ui";

import { ArrowRight, Download, Shuffle } from "./Icon";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_WORDS,
  LABELS,
  TYPES,
  QUOTES,
  optionsSchema,
  parseWords,
  readPuzzle,
  encode,
  decode,
  type Input,
  type Puzzle,
  type PuzzleType,
  type Options,
  type Warning,
} from "../../../../packages/core/src/index";
import {
  listPuzzles,
  savePuzzle,
  deletePuzzle,
  type Saved,
} from "../lib/storage";

/** The prerendered starter puzzle uses this seed so the static HTML is deterministic. */
const STARTER_SEED = 4317;
const newSeed = () => crypto.getRandomValues(new Uint32Array(1))[0];
const SUPPORT_NOTE_KEY = "puzzleloom-support-note";
const DEFAULT_TITLE = "In the garden";
/** The answer words of a list, for spotting a new puzzle. */
function wordSet(text: string): Set<string> {
  return new Set(
    text
      .split(/\r?\n/)
      .map((line) =>
        line
          .split(/:|\t|\s+-\s+|,/)[0]
          .trim()
          .toUpperCase(),
      )
      .filter(Boolean),
  );
}
/** The words of a quote. */
function quoteSet(text: string): Set<string> {
  return new Set(text.toUpperCase().split(/\s+/).filter(Boolean));
}
/** A new list: it shares fewer than half of its words with the earlier one. */
function mostlyNew(before: Set<string>, now: Set<string>): boolean {
  let shared = 0;
  now.forEach((w) => {
    if (before.has(w)) shared++;
  });
  return shared < Math.min(before.size, now.size) / 2;
}
/** "Week 3 spelling" + crossword -> "week-3-spelling-crossword". */
function fileStem(title: string, type: PuzzleType) {
  const slug = title
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const kind = type === "scramble" ? "word-scramble" : type;
  return !slug ? kind : slug.endsWith(kind) ? slug : `${slug}-${kind}`;
}
function download(data: BlobPart, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
type WorkerResult = {
  puzzle?: Puzzle;
  warnings?: Warning[];
  bytes?: Uint8Array;
  previews?: { puzzle: string[]; answer: string[] };
  layoutError?: string;
  images?: { svg: string; width: number; height: number }[];
};
const TypeIcon = ({ type }: { type: PuzzleType }) => (
  <svg
    className="type-icon"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.3"
    aria-hidden="true"
  >
    {type === "crossword" && (
      <path d="M1.5 5.5h13v5h-13zM5.5 1.5h5v13h-5zM6 6h4v4H6z" />
    )}
    {type === "word-search" && (
      <>
        <rect x="1.5" y="1.5" width="13" height="13" />
        <path d="M4 5.5h8M4 8h8M4 10.5h8" strokeDasharray="1.4 1.6" />
      </>
    )}
    {type === "scramble" && <path d="M2 4.5h3l6 7h3M2 11.5h3l6-7h3" />}
    {type === "cryptogram" && (
      <path d="M2.5 3.5h4M2.5 7h4M9.5 3.5h4M9.5 7h4M4.5 9.5v4M11.5 9.5v4M3 13.5h3M10 13.5h3" />
    )}
  </svg>
);
export default function Maker({
  initialType = "crossword",
  initialWords = DEFAULT_WORDS,
  initialTitle = DEFAULT_TITLE,
  initialQuote = QUOTES[0],
  initialOptions,
  initialPuzzle,
  initialPreviews,
}: {
  initialType?: PuzzleType;
  initialWords?: string;
  initialTitle?: string;
  initialQuote?: string;
  initialOptions?: Partial<Options>;
  initialPuzzle?: Puzzle;
  initialPreviews?: { puzzle: string[]; answer: string[] };
}) {
  const [type, setType] = useState<PuzzleType>(initialType),
    [words, setWords] = useState(initialWords),
    [quote, setQuote] = useState(initialQuote),
    [customTitle, setCustomTitle] = useState<string | null>(null),
    [instructions, setInstructions] = useState(""),
    [options, setOptions] = useState<Options>(() => ({
      ...optionsSchema.parse({}),
      ...(initialPuzzle?.options ?? {}),
      ...(initialOptions ?? {}),
    })),
    [autoSize, setAutoSize] = useState(!initialOptions?.size),
    [seed, setSeed] = useState(STARTER_SEED),
    [puzzle, setPuzzle] = useState<Puzzle | null>(initialPuzzle ?? null),
    [doneKey, setDoneKey] = useState(""),
    [previews, setPreviews] = useState(
      initialPreviews ?? { puzzle: [] as string[], answer: [] as string[] },
    ),
    [warnings, setWarnings] = useState<Warning[]>([]),
    [error, setError] = useState(""),
    [actionError, setActionError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(true),
    [exporting, setExporting] = useState(false),
    [showKey, setShowKey] = useState(false),
    [page, setPage] = useState(0),
    [count, setCount] = useState(1),
    [keyMode, setKeyMode] = useState<"appended" | "separate" | "none">(
      "appended",
    ),
    [dialog, setDialog] = useState<"saved" | "share" | "zoom" | null>(null),
    [deleted, setDeleted] = useState<Saved | null>(null),
    [saved, setSaved] = useState<Saved[]>([]),
    [support, setSupport] = useState(false);
  // Until the user types a title it follows the content: the page's starter title while
  // the starter content is unchanged, "In the garden" for the example list, otherwise
  // the puzzle type ("Crossword", "Word search").
  const unchanged =
    type === initialType &&
    (type === "cryptogram" ? quote === initialQuote : words === initialWords);
  // A landing page's topic title (e.g. "Christmas word search") survives list edits.
  const topicTitle = initialTitle !== DEFAULT_TITLE && type === initialType;
  const title =
    customTitle ??
    (unchanged || topicTitle
      ? initialTitle
      : type !== "cryptogram" && words === DEFAULT_WORDS
        ? DEFAULT_TITLE
        : copy.defaultTitles[type]);
  // Every new puzzle gets its own layout number, and so its own printed ID: a type
  // switch, or a list sharing fewer than half its words with the last one. Editing a
  // clue, fixing a typo or changing print options keeps the ID. The prerendered
  // starter keeps STARTER_SEED so the static HTML is deterministic.
  const seedBasis = useRef({
    type: initialType,
    words: wordSet(initialWords),
    quote: quoteSet(initialQuote),
  });
  useEffect(() => {
    const basis = seedBasis.current,
      nowWords = wordSet(words),
      nowQuote = quoteSet(quote);
    const isNew =
      type !== basis.type ||
      (type === "cryptogram"
        ? mostlyNew(basis.quote, nowQuote)
        : mostlyNew(basis.words, nowWords));
    if (!isNew) return;
    seedBasis.current = { type, words: nowWords, quote: nowQuote };
    setSeed(newSeed());
  }, [type, words, quote]);
  const workerReady = useRef<Promise<void>>(Promise.resolve());
  const worker = useRef<Worker | null>(null),
    seq = useRef(0),
    pending = useRef(
      new Map<
        number,
        { resolve: (x: WorkerResult) => void; reject: (e: Error) => void }
      >(),
    ),
    generation = useRef(0),
    fileInput = useRef<HTMLInputElement>(null),
    importInput = useRef<HTMLInputElement>(null),
    modal = useRef<HTMLDialogElement>(null);
  const request = useCallback(
    (data: Record<string, unknown>) =>
      new Promise<WorkerResult>((resolve, reject) => {
        const id = ++seq.current;
        pending.current.set(id, { resolve, reject });
        const activeWorker = worker.current;
        workerReady.current.then(() =>
          activeWorker?.postMessage({ ...data, id }),
        );
      }),
    [],
  );
  const load = useCallback((p: Puzzle) => {
    setType(p.type);
    if (p.entries.length)
      setWords(p.entries.map((e) => `${e.word}: ${e.clue}`).join("\n"));
    if (p.quote) setQuote(p.quote);
    setCustomTitle(p.title);
    setInstructions(p.instructions);
    setOptions(p.options);
    setAutoSize(
      (p.options as Options & { autoSize?: boolean }).autoSize ?? false,
    );
    // An opened puzzle keeps its own layout number.
    seedBasis.current = {
      type: p.type,
      words: wordSet(p.entries.map((e) => e.word).join("\n")),
      quote: quoteSet(p.quote),
    };
    setSeed(p.seed);
    setDialog(null);
    setNotice(copy.puzzleOpened);
  }, []);
  useEffect(() => {
    let markReady = () => {};
    workerReady.current = new Promise<void>((resolve) => {
      markReady = resolve;
    });
    const w = new Worker(new URL("../lib/puzzle.worker.ts", import.meta.url));
    worker.current = w;
    w.onmessage = ({ data }) => {
      if (data.ready) {
        markReady();
        return;
      }
      const task = pending.current.get(data.id);
      pending.current.delete(data.id);
      if (data.error) task?.reject(new Error(data.error));
      else task?.resolve(data);
    };
    w.onerror = () => {
      pending.current.forEach((t) => t.reject(new Error(copy.workerFailed)));
      pending.current.clear();
    };
    const locale = navigator.language;
    setOptions((o) => ({
      ...o,
      paper: /^(en-US|en-CA)$/i.test(locale) ? "letter" : "a4",
    }));
    const openHash = () => {
      if (location.hash.startsWith("#p=")) {
        try {
          load(decode(location.hash.slice(3)));
        } catch (error) {
          setActionError((error as Error).message);
        }
      }
    };
    openHash();
    window.addEventListener("hashchange", openHash);
    return () => {
      window.removeEventListener("hashchange", openHash);
      w.terminate();
      worker.current = null;
    };
  }, [load]);
  // Identifies the inputs a result belongs to, so a stale preview never counts as ready.
  const inputKey = JSON.stringify([
    type,
    words,
    quote,
    title,
    seed,
    options,
    autoSize,
    instructions,
  ]);
  useEffect(() => {
    const ticket = ++generation.current;
    const key = inputKey;
    setBusy(true);
    setError("");
    const timer = setTimeout(() => {
      // Auto: leave the size out and let the engine choose (it records the size it used).
      const { size, ...rest } = options;
      const input: Input = {
        type,
        words,
        quote,
        title,
        seed,
        options: (autoSize
          ? { ...rest, autoSize: true }
          : { ...rest, size, autoSize: false }) as Input["options"],
        ...(instructions ? { instructions } : {}),
      };
      request({ action: "generate", input })
        .then(({ puzzle, warnings, previews, layoutError }) => {
          if (ticket === generation.current) {
            setPuzzle(puzzle!);
            setWarnings(warnings ?? []);
            setPreviews(previews!);
            setError(layoutError ?? "");
            setPage(0);
            setDoneKey(key);
            setBusy(false);
          }
        })
        .catch((e) => {
          if (ticket === generation.current) {
            // Layout failed, but list clean-up notes still apply.
            try {
              setWarnings(
                type === "cryptogram" ? [] : parseWords(words, options).details,
              );
            } catch {
              setWarnings([]);
            }
            setError(e.message);
            setDoneKey(key);
            setBusy(false);
          }
        });
    }, 180);
    return () => clearTimeout(timer);
  }, [
    type,
    words,
    quote,
    title,
    seed,
    options,
    autoSize,
    instructions,
    inputKey,
    request,
  ]);
  useEffect(() => {
    if (dialog) modal.current?.showModal();
    else modal.current?.close();
  }, [dialog]);
  // Confirmations fade after a few seconds; errors stay until fixed.
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 6000);
    return () => clearTimeout(t);
  }, [notice]);
  // The support note never blocks: it clears itself after a short read.
  useEffect(() => {
    if (!support) return;
    const t = setTimeout(() => setSupport(false), 15000);
    return () => clearTimeout(t);
  }, [support]);
  useEffect(() => {
    if (!deleted) return;
    const t = setTimeout(() => setDeleted(null), 8000);
    return () => clearTimeout(t);
  }, [deleted]);
  const option = <K extends keyof Options>(key: K, value: Options[K]) =>
    setOptions((o) => ({ ...o, [key]: value }));
  const currentPreviews = showKey ? previews.answer : previews.puzzle;
  const pages = currentPreviews.length,
    svg = currentPreviews[Math.min(page, pages - 1)] ?? "";
  let wordCount = 0;
  try {
    wordCount = parseWords(words, options).entries.length;
  } catch {
    /* generation displays parser errors */
  }
  const warningMessages = [...new Set(warnings.map((w) => w.message))];
  const isCrypto = type === "cryptogram";
  const hasGrid = type === "crossword" || type === "word-search";
  const usedSize =
    puzzle && puzzle.type === type && hasGrid ? puzzle.options.size : null;
  const current = !busy && doneKey === inputKey;
  const stem = puzzle ? fileStem(puzzle.title, puzzle.type) : "puzzle";
  const setSuffix = count > 1 ? `-class-set-${count}` : "";
  const imageName = (i: number, total: number) =>
    `${stem}${showKey ? "-answers" : ""}${total > 1 ? `-page-${i + 1}` : ""}`;
  const canExport = !!puzzle && current && !error && !exporting;
  async function pdf(mode: "download" | "print" = "download") {
    if (!canExport) return;
    setExporting(true);
    setActionError("");
    try {
      const { bytes } = await request({
        action: "pdf",
        puzzle,
        count,
        mode: keyMode === "appended" ? "appended" : "none",
      });
      if (mode === "print") {
        const url = URL.createObjectURL(
          new Blob([bytes as BlobPart], { type: "application/pdf" }),
        );
        const frame = document.createElement("iframe");
        frame.style.display = "none";
        frame.src = url;
        document.body.append(frame);
        frame.onload = () => {
          frame.contentWindow?.focus();
          frame.contentWindow?.print();
        };
        setTimeout(() => {
          frame.remove();
          URL.revokeObjectURL(url);
        }, 120000);
      } else {
        download(
          bytes as BlobPart,
          `${stem}${setSuffix}.pdf`,
          "application/pdf",
        );
        if (keyMode === "separate") {
          const key = await request({
            action: "pdf",
            puzzle,
            count,
            mode: "only",
          });
          download(
            key.bytes as BlobPart,
            `${stem}${setSuffix}-answers.pdf`,
            "application/pdf",
          );
        }
        setNotice(
          keyMode === "separate"
            ? copy.pdfDownloadedKeySeparate
            : copy.pdfDownloaded,
        );
        // The support note appears once per session, after the first successful download.
        try {
          if (!sessionStorage.getItem(SUPPORT_NOTE_KEY)) {
            setSupport(true);
            sessionStorage.setItem(SUPPORT_NOTE_KEY, "shown");
          }
        } catch {
          /* Without session storage, skip the note rather than repeat it. */
        }
      }
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setExporting(false);
    }
  }
  async function imageExport(format: "svg" | "png") {
    if (!canExport) return;
    try {
      const { images } = await request({
        action: "image",
        puzzle,
        answer: showKey,
      });
      const sheets = images!;
      for (let i = 0; i < sheets.length; i++) {
        const source = sheets[i].svg;
        if (format === "svg")
          download(
            source,
            `${imageName(i, sheets.length)}.svg`,
            "image/svg+xml",
          );
        else {
          const url = URL.createObjectURL(
            new Blob([source], { type: "image/svg+xml" }),
          );
          const image = new Image();
          await new Promise<void>((resolve, reject) => {
            image.onload = () => resolve();
            image.onerror = () => reject(new Error(copy.pngFailed));
            image.src = url;
          });
          const canvas = document.createElement("canvas");
          canvas.width = sheets[i].width * 2;
          canvas.height = sheets[i].height * 2;
          canvas
            .getContext("2d")!
            .drawImage(image, 0, 0, canvas.width, canvas.height);
          URL.revokeObjectURL(url);
          const blob = await new Promise<Blob | null>((r) =>
            canvas.toBlob(r, "image/png"),
          );
          if (blob)
            download(blob, `${imageName(i, sheets.length)}.png`, "image/png");
        }
      }
    } catch (e) {
      setActionError((e as Error).message);
    }
  }
  async function openSaved() {
    try {
      setSaved(await listPuzzles());
      setDialog("saved");
    } catch {
      setActionError(copy.storageUnavailable);
    }
  }
  async function importFile(file?: File) {
    if (!file) return;
    try {
      if (file.size > 300000) throw new Error(copy.importTooBig);
      load(readPuzzle(JSON.parse(await file.text())));
    } catch (e) {
      setActionError(copy.importFailed + (e as Error).message);
    }
  }
  const link = puzzle
    ? `${typeof location === "undefined" ? "" : location.origin}/play/#${encode(puzzle)}`
    : "";
  const stale = !!error && !!svg;
  const downloadReason = error ? copy.downloadReasonError : "";
  const dateFormat = new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
  });
  const sheetPreview = (
    <>
      <div
        className={`paper-wrap${busy ? " is-busy" : ""}${stale ? " is-stale" : ""}${options.paper === "a4" ? " is-a4" : ""}${showKey ? " is-key" : ""}`}
        aria-busy={busy}
      >
        {svg ? (
          <button
            className="paper"
            onClick={() => setDialog("zoom")}
            aria-label={copy.enlargePreview}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : (
          <div className="paper empty-paper">{copy.makingPreview}</div>
        )}
        {stale && <p className="stale-label">{copy.previewStale}</p>}
      </div>
      <div className="preview-caption">
        <span className={showKey ? "key-caption" : undefined}>
          {showKey
            ? copy.answerKeyCaption(keyMode)
            : options.paper === "letter"
              ? copy.paperLetter
              : copy.paperA4}
        </span>
        {pages > 1 && (
          <span className="page-nav">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              aria-label={copy.previous}
            >
              ‹
            </button>
            <span>{copy.pageOf(page + 1, pages)}</span>
            <button
              disabled={page >= pages - 1}
              onClick={() => setPage((p) => p + 1)}
              aria-label={copy.next}
            >
              ›
            </button>
          </span>
        )}
      </div>
    </>
  );
  return (
    <section
      className="maker"
      aria-label={copy.puzzleMaker}
      data-ready={puzzle && current ? "true" : "false"}
    >
      <div className="maker-top">
        <div className="type-tabs" role="tablist" aria-label={copy.puzzleType}>
          {TYPES.map((t, i) => (
            <button
              role="tab"
              tabIndex={type === t ? 0 : -1}
              onKeyDown={(e) => {
                if (
                  ["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)
                ) {
                  e.preventDefault();
                  const next =
                    e.key === "Home"
                      ? 0
                      : e.key === "End"
                        ? 3
                        : (i + (e.key === "ArrowRight" ? 1 : 3)) % 4;
                  setType(TYPES[next]);
                  setInstructions("");
                  (
                    e.currentTarget.parentElement?.children[
                      next
                    ] as HTMLButtonElement
                  ).focus();
                }
              }}
              aria-selected={type === t}
              key={t}
              onClick={() => {
                setType(t);
                setInstructions("");
                setShowKey(false);
              }}
            >
              <TypeIcon type={t} />
              <span className="tab-long">{LABELS[t]}</span>
              <span className="tab-short">{copy.shortLabels[t]}</span>
            </button>
          ))}
        </div>
        <button
          className="text-button saved-button"
          onClick={openSaved}
          aria-label={copy.myPuzzles}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            aria-hidden="true"
          >
            <path d="M2 3.5h4l1.5 1.5H14v8H2z" />
          </svg>
          <span>{copy.myPuzzles}</span>
        </button>
      </div>
      <div className="workbench">
        <aside className="word-panel">
          <div className="panel-heading">
            <h2>{isCrypto ? copy.quoteHeading : copy.wordsHeading}</h2>
            <span className="count">
              {isCrypto ? `${quote.length}/600` : copy.wordCount(wordCount)}
            </span>
          </div>
          <p className="help">{isCrypto ? copy.quoteHelp : copy.wordsHelp}</p>
          {isCrypto ? (
            <>
              <label className="sr-only" htmlFor="quote">
                {copy.quoteLabel}
              </label>
              <textarea
                id="quote"
                value={quote}
                maxLength={600}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "list-error" : undefined}
                onChange={(e) => setQuote(e.target.value)}
                className="word-editor quote-editor"
              />
            </>
          ) : (
            <>
              <label className="sr-only" htmlFor="words">
                {copy.wordsLabel}
              </label>
              <div className={`editor${error ? " has-error" : ""}`}>
                <textarea
                  id="words"
                  className="word-editor"
                  spellCheck={false}
                  value={words}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? "list-error" : undefined}
                  onChange={(e) => setWords(e.target.value)}
                />
                <div className="editor-footer">
                  <button
                    className="text-button"
                    onClick={() => fileInput.current?.click()}
                  >
                    {copy.importList}
                  </button>
                </div>
              </div>
              <input
                ref={fileInput}
                type="file"
                hidden
                accept=".txt,.csv,.tsv"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 30000) {
                      setActionError(copy.listTooBig);
                      return;
                    }
                    setWords(await file.text());
                  }
                  e.target.value = "";
                }}
              />
            </>
          )}
          {error && (
            <p className="list-error" id="list-error" role="alert">
              {error}
            </p>
          )}
          {warningMessages.length > 0 && !isCrypto && (
            <div className="list-warnings" role="status">
              <strong>{copy.listChanges}</strong>
              <ul>
                {warningMessages.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          )}
          {isCrypto && (
            <label className="field">
              {copy.sampleQuotes}
              <select value="" onChange={(e) => setQuote(e.target.value)}>
                <option value="" disabled>
                  {copy.chooseAQuote}
                </option>
                {QUOTES.map((q) => (
                  <option key={q}>{q}</option>
                ))}
              </select>
            </label>
          )}
          <button
            className="reshuffle"
            onClick={() => {
              setSeed(newSeed());
            }}
            disabled={busy}
          >
            <Shuffle /> {busy ? copy.making : copy.newLayout}
          </button>
          {!isCrypto && (
            <details className="formats">
              <summary>{copy.formatsHeading}</summary>
              <ul>
                {copy.formats.map((f) => (
                  <li key={f}>
                    <code>{f}</code>
                  </li>
                ))}
              </ul>
              <p>{copy.formatsNote}</p>
              <button
                className="text-button"
                onClick={() => {
                  setWords(DEFAULT_WORDS);
                  setCustomTitle(null);
                }}
              >
                {copy.loadExample}
              </button>
            </details>
          )}
        </aside>
        <div className="preview-panel">
          <div className="preview-sticky">
            <div className="preview-toolbar">
              <h2>{copy.previewHeading}</h2>
              <div className="toolbar-actions">
                <div
                  className="preview-toggle"
                  role="group"
                  aria-label={copy.previewPage}
                >
                  <button
                    aria-pressed={!showKey}
                    onClick={() => {
                      setShowKey(false);
                      setPage(0);
                    }}
                  >
                    {copy.puzzle}
                  </button>
                  <button
                    aria-pressed={showKey}
                    onClick={() => {
                      setShowKey(true);
                      setPage(0);
                    }}
                  >
                    {copy.answerKey}
                  </button>
                </div>
                <button
                  className="enlarge-button"
                  onClick={() => setDialog("zoom")}
                  disabled={!svg}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden="true"
                  >
                    <circle cx="7" cy="7" r="4.5" />
                    <path d="M10.5 10.5 14 14M7 5v4M5 7h4" />
                  </svg>
                  {copy.enlarge}
                </button>
              </div>
            </div>
            {sheetPreview}
          </div>
        </div>
        <aside className="options-panel">
          <div className="panel-heading">
            <h2>{copy.settingsHeading}</h2>
          </div>
          <label className="field">
            {copy.puzzleTitle}
            <input
              value={title}
              maxLength={100}
              onChange={(e) => setCustomTitle(e.target.value)}
            />
          </label>
          <div className="field-pair">
            <label className="field">
              {copy.paper}
              <select
                value={options.paper}
                onChange={(e) =>
                  option("paper", e.target.value as Options["paper"])
                }
              >
                <option value="letter">{copy.usLetter}</option>
                <option value="a4">{copy.a4}</option>
              </select>
            </label>
            <label className="field">
              {copy.textSize}
              <select
                value={options.fontSize}
                onChange={(e) =>
                  option("fontSize", e.target.value as Options["fontSize"])
                }
              >
                {["S", "M", "L", "XL"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="field">
            {copy.printFont}
            <select
              aria-label={copy.printFont}
              value={options.font}
              onChange={(e) =>
                option("font", e.target.value as Options["font"])
              }
            >
              <option value="atkinson">{copy.atkinson}</option>
              <option value="opendyslexic">{copy.openDyslexic}</option>
            </select>
          </label>
          {hasGrid && (
            <div className="field grid-size">
              <div className="field-row">
                <span id="grid-size-label">{copy.gridSize}</span>
                <div
                  className="segmented"
                  role="radiogroup"
                  aria-label={copy.gridSizeMode}
                >
                  {[true, false].map((auto) => (
                    <button
                      key={String(auto)}
                      role="radio"
                      aria-checked={autoSize === auto}
                      onClick={() => {
                        if (!auto && usedSize) option("size", usedSize);
                        setAutoSize(auto);
                      }}
                    >
                      {auto ? copy.gridAuto : copy.gridCustom}
                    </button>
                  ))}
                </div>
              </div>
              {autoSize ? (
                <p className="field-note" aria-live="polite">
                  {usedSize
                    ? copy.gridAutoUsed(usedSize)
                    : copy.gridAutoPending}
                </p>
              ) : (
                <div className="range-row">
                  <input
                    type="range"
                    min="8"
                    max="30"
                    aria-labelledby="grid-size-label"
                    value={options.size}
                    onChange={(e) => option("size", +e.target.value)}
                  />
                  <output>{copy.gridValue(options.size)}</output>
                </div>
              )}
            </div>
          )}
          {type === "word-search" && (
            <label className="field">
              {copy.difficulty}
              <select
                value={options.difficulty}
                onChange={(e) =>
                  option("difficulty", e.target.value as Options["difficulty"])
                }
              >
                <option value="easy">{copy.easy}</option>
                <option value="medium">{copy.medium}</option>
                <option value="hard">{copy.hard}</option>
              </select>
            </label>
          )}
          {type === "scramble" && (
            <label className="field">
              {copy.hints}
              <select
                value={options.hint}
                onChange={(e) =>
                  option("hint", e.target.value as Options["hint"])
                }
              >
                <option value="none">{copy.noHints}</option>
                <option value="first">{copy.firstLetter}</option>
                <option value="clue">{copy.clues}</option>
              </select>
            </label>
          )}
          {isCrypto && (
            <label className="field">
              {copy.givenLetters}
              <input
                type="number"
                min="0"
                max="8"
                value={options.givenLetters}
                onChange={(e) => option("givenLetters", +e.target.value)}
              />
            </label>
          )}
          <details className="more-options">
            <summary>{copy.moreOptions}</summary>
            <h3>{copy.groupSheet}</h3>
            <label className="field">
              {copy.instructions}
              <textarea
                className="short-text"
                value={instructions}
                placeholder={puzzle?.instructions ?? copy.optionalInstructions}
                maxLength={300}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={options.nameFields}
                onChange={(e) => option("nameFields", e.target.checked)}
              />
              {copy.nameFields}
            </label>
            {type === "crossword" && (
              <label className="check">
                <input
                  type="checkbox"
                  checked={options.wordBank}
                  onChange={(e) => option("wordBank", e.target.checked)}
                />
                {copy.wordBank}
              </label>
            )}
            <h3>{copy.groupLetters}</h3>
            <label className="field">
              {copy.alphabet}
              <select
                value={options.language}
                onChange={(e) =>
                  option("language", e.target.value as Options["language"])
                }
              >
                {Object.entries(copy.languages).map(([code, label]) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={options.stripAccents}
                onChange={(e) => option("stripAccents", e.target.checked)}
              />
              {copy.stripAccents}
            </label>
            {options.language === "de" && (
              <label className="check">
                <input
                  type="checkbox"
                  checked={options.expandEszett}
                  onChange={(e) => option("expandEszett", e.target.checked)}
                />
                {copy.expandEszett}
              </label>
            )}
            <h3>{copy.groupPlay}</h3>
            <label className="check">
              <input
                type="checkbox"
                checked={options.allowReveal}
                onChange={(e) => option("allowReveal", e.target.checked)}
              />
              {copy.allowReveal}
            </label>
            <label className="field">
              {copy.seed}
              <input
                type="number"
                min="0"
                max="4294967295"
                value={seed}
                aria-describedby="seed-note"
                onChange={(e) => {
                  setSeed(+e.target.value >>> 0);
                }}
              />
              <span className="field-note" id="seed-note">
                {copy.seedNote}
              </span>
            </label>
          </details>
          <div className="export-options">
            <label className="field">
              {copy.answerKey}
              <select
                aria-label={copy.answerKey}
                value={keyMode}
                onChange={(e) => setKeyMode(e.target.value as typeof keyMode)}
              >
                <option value="appended">{copy.keyAppended}</option>
                <option value="separate">{copy.keySeparate}</option>
                <option value="none">{copy.keyNone}</option>
              </select>
            </label>
            <div className="field class-set">
              <label htmlFor="class-set">
                {copy.classSet}
                <span className="field-note" id="class-set-range">
                  {copy.classSetRange}
                </span>
              </label>
              <input
                id="class-set"
                type="number"
                min="1"
                max="40"
                value={count}
                aria-describedby="class-set-range"
                onChange={(e) =>
                  setCount(Math.max(1, Math.min(40, +e.target.value || 1)))
                }
              />
            </div>
          </div>
          <div className="export-bar">
            <div className="download-area">
              <button
                className="primary download-button"
                disabled={!canExport}
                aria-describedby={
                  downloadReason ? "download-reason" : undefined
                }
                onClick={() => pdf()}
              >
                <Download />
                {exporting ? copy.preparingPdf : copy.downloadPdf}
              </button>
              {downloadReason ? (
                <span className="download-note is-reason" id="download-reason">
                  {downloadReason}
                </span>
              ) : (
                count > 1 && (
                  <span className="download-note">
                    {copy.noteClassSet(count, keyMode)}
                  </span>
                )
              )}
            </div>
            <div className="secondary-actions">
              <button disabled={!canExport} onClick={() => pdf("print")}>
                {copy.print}
              </button>
              <button disabled={!canExport} onClick={() => setDialog("share")}>
                {copy.playLink}
              </button>
              <button
                disabled={!canExport}
                onClick={async () => {
                  try {
                    await savePuzzle(puzzle!);
                    setNotice(copy.savedLocally);
                  } catch {
                    setActionError(copy.saveFailed);
                  }
                }}
              >
                {copy.save}
              </button>
            </div>
            <div className="action-status">
              {actionError && (
                <div className="message error" role="alert">
                  <span>{actionError}</span>
                  <button
                    aria-label={copy.dismiss}
                    onClick={() => setActionError("")}
                  >
                    ×
                  </button>
                </div>
              )}
              {notice && (
                <div className="message notice" role="status">
                  <span>{notice}</span>
                  <button
                    aria-label={copy.dismiss}
                    onClick={() => setNotice("")}
                  >
                    ×
                  </button>
                </div>
              )}
              {support && (
                <div className="support-note">
                  <p>
                    {copy.supportNote}{" "}
                    <a href="/support/">
                      {copy.supportNoteLink} <ArrowRight />
                    </a>
                  </p>
                  <button
                    aria-label={copy.dismissSupportNote}
                    onClick={() => setSupport(false)}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>
          <details className="more-exports">
            <summary>{copy.moreExports}</summary>
            <div className="secondary-actions">
              <button disabled={!canExport} onClick={() => imageExport("png")}>
                {copy.png}
              </button>
              <button disabled={!canExport} onClick={() => imageExport("svg")}>
                {copy.svg}
              </button>
              <button
                disabled={!canExport}
                onClick={() =>
                  download(
                    JSON.stringify(puzzle, null, 2),
                    `${stem}.puzzleloom.json`,
                    "application/json",
                  )
                }
              >
                {copy.projectFile}
              </button>
            </div>
            <button
              className="text-button open-project"
              onClick={() => importInput.current?.click()}
            >
              {copy.openProjectFile}
            </button>
            <input
              ref={importInput}
              type="file"
              accept=".json"
              hidden
              onChange={(e) => {
                importFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </details>
        </aside>
      </div>
      <div className="mobile-download">
        <button
          className="primary"
          disabled={!canExport}
          aria-describedby={downloadReason ? "download-reason" : undefined}
          onClick={() => pdf()}
        >
          <Download />
          {exporting ? copy.preparingPdf : copy.downloadPdf}
        </button>
      </div>
      <dialog
        ref={modal}
        className={dialog === "zoom" ? "zoom-dialog" : undefined}
        onCancel={() => setDialog(null)}
        onClick={(e) => {
          if (e.target === modal.current) setDialog(null);
        }}
        aria-labelledby="dialog-title"
      >
        <div className="dialog-head">
          <h2 id="dialog-title">
            {dialog === "share"
              ? copy.shareHeading
              : dialog === "zoom"
                ? `${title} · ${showKey ? copy.answerKey : copy.puzzle}`
                : copy.savedHeading}
          </h2>
          <button onClick={() => setDialog(null)} aria-label={copy.closeDialog}>
            ×
          </button>
        </div>
        {dialog === "zoom" ? (
          <>
            <p className="zoom-hint">{copy.dragToMove}</p>
            <div className="zoom-pages">
              {currentPreviews.map((page, i) => (
                <div
                  key={i}
                  className="paper"
                  dangerouslySetInnerHTML={{ __html: page }}
                />
              ))}
            </div>
          </>
        ) : dialog === "share" ? (
          <>
            <p>{copy.shareBody}</p>
            <label className="field">
              {copy.playLink}
              <input readOnly value={link} onFocus={(e) => e.target.select()} />
            </label>
            <div className="button-row">
              <button
                className="primary"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(link);
                    setNotice(copy.linkCopied);
                  } catch {
                    setNotice(copy.copyManually);
                  }
                }}
              >
                {copy.copyLink}
              </button>
              <a className="button" href={link}>
                {copy.openPlayer} <ArrowRight />
              </a>
            </div>
            <p className="help">{copy.shareWarning}</p>
          </>
        ) : (
          <>
            <p className="help">{copy.savedNote}</p>
            {deleted && (
              <p className="message notice undo-row" role="status">
                <span>{copy.deletedNotice(deleted.puzzle.title)}</span>
                <button
                  className="text-button"
                  onClick={async () => {
                    await savePuzzle(deleted.puzzle, deleted.key);
                    setDeleted(null);
                    setSaved(await listPuzzles());
                  }}
                >
                  {copy.undo}
                </button>
              </p>
            )}
            {saved.length === 0 ? (
              <p>{copy.savedEmpty}</p>
            ) : (
              saved.map((s) => (
                <div className="saved-row" key={s.key}>
                  <button className="saved-open" onClick={() => load(s.puzzle)}>
                    <strong>{s.puzzle.title}</strong>
                    <span>
                      {copy.savedMeta(
                        s.puzzle.title
                          .toLowerCase()
                          .includes(LABELS[s.puzzle.type].toLowerCase())
                          ? ""
                          : LABELS[s.puzzle.type],
                        s.puzzle.id,
                        dateFormat.format(s.updated),
                      )}
                    </span>
                    <span className="open-label" aria-hidden="true">
                      {copy.open} <ArrowRight />
                    </span>
                  </button>
                  <button
                    onClick={async () => {
                      await savePuzzle({
                        ...s.puzzle,
                        title: s.puzzle.title + copy.copySuffix,
                      });
                      setSaved(await listPuzzles());
                    }}
                  >
                    {copy.duplicate}
                  </button>
                  <button
                    className="text-button danger"
                    onClick={async () => {
                      await deletePuzzle(s.key);
                      setDeleted(s);
                      setSaved(await listPuzzles());
                    }}
                  >
                    {copy.delete}
                  </button>
                </div>
              ))
            )}
          </>
        )}
      </dialog>
    </section>
  );
}
