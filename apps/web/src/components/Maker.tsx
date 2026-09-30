"use client";
import { copy } from "../content/ui";

import { Arrow, Shuffle } from "./Icon";
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
} from "../../../../packages/core/src/index";
import {
  listPuzzles,
  savePuzzle,
  deletePuzzle,
  type Saved,
} from "../lib/storage";

const newSeed = () => crypto.getRandomValues(new Uint32Array(1))[0];
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
  bytes?: Uint8Array;
  previews?: { puzzle: string[]; answer: string[] };
  layoutError?: string;
  images?: { svg: string; width: number; height: number }[];
};
export default function Maker({
  initialType = "crossword",
  initialWords = DEFAULT_WORDS,
  initialTitle = "In the garden",
  initialPuzzle,
  initialPreviews,
}: {
  initialType?: PuzzleType;
  initialWords?: string;
  initialTitle?: string;
  initialPuzzle?: Puzzle;
  initialPreviews?: { puzzle: string[]; answer: string[] };
}) {
  const [type, setType] = useState<PuzzleType>(initialType),
    [words, setWords] = useState(initialWords),
    [quote, setQuote] = useState(QUOTES[0]),
    [title, setTitle] = useState(initialTitle),
    [instructions, setInstructions] = useState(""),
    [options, setOptions] = useState<Options>(optionsSchema.parse({})),
    [seed, setSeed] = useState(4317),
    [puzzle, setPuzzle] = useState<Puzzle | null>(initialPuzzle ?? null),
    [previews, setPreviews] = useState(
      initialPreviews ?? { puzzle: [] as string[], answer: [] as string[] },
    ),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(true),
    [exporting, setExporting] = useState(false),
    [showKey, setShowKey] = useState(false),
    [page, setPage] = useState(0),
    [count, setCount] = useState(1),
    [keyMode, setKeyMode] = useState<"appended" | "separate" | "none">(
      "appended",
    ),
    [dialog, setDialog] = useState<"saved" | "share" | null>(null),
    [saved, setSaved] = useState<Saved[]>([]),
    [support, setSupport] = useState(false);
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
    setTitle(p.title);
    setInstructions(p.instructions);
    setOptions(p.options);
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
      pending.current.forEach((t) =>
        t.reject(
          new Error("The puzzle worker could not start. Reload the page."),
        ),
      );
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
          setError((error as Error).message);
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
  useEffect(() => {
    const ticket = ++generation.current;
    setBusy(true);
    setError("");
    const timer = setTimeout(() => {
      const input: Input = {
        type,
        words,
        quote,
        title,
        seed,
        options,
        ...(instructions ? { instructions } : {}),
      };
      request({ action: "generate", input })
        .then(({ puzzle, previews, layoutError }) => {
          if (ticket === generation.current) {
            setPuzzle(puzzle!);
            setPreviews(previews!);
            setError(layoutError ?? "");
            setPage(0);
            setBusy(false);
          }
        })
        .catch((e) => {
          if (ticket === generation.current) {
            setError(e.message);
            setBusy(false);
          }
        });
    }, 180);
    return () => clearTimeout(timer);
  }, [type, words, quote, title, seed, options, instructions, request]);
  useEffect(() => {
    if (dialog) modal.current?.showModal();
    else modal.current?.close();
  }, [dialog]);
  const option = <K extends keyof Options>(key: K, value: Options[K]) =>
    setOptions((o) => ({ ...o, [key]: value }));
  const currentPreviews = showKey ? previews.answer : previews.puzzle;
  const pages = currentPreviews.length,
    svg = currentPreviews[Math.min(page, pages - 1)] ?? "";
  let wordCount = 0,
    warnings: string[] = [];
  try {
    const parsed = parseWords(words, options);
    wordCount = parsed.entries.length;
    warnings = parsed.warnings;
  } catch {
    /* generation displays parser errors */
  }
  const canExport = !!puzzle && !busy && !error && !exporting;
  async function pdf(mode: "download" | "print" = "download") {
    if (!canExport) return;
    setExporting(true);
    setError("");
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
          `puzzleloom-${puzzle!.id}.pdf`,
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
            `puzzleloom-${puzzle!.id}-answers.pdf`,
            "application/pdf",
          );
        }
        setNotice(copy.yourPdfIsReadyHappyPuzzling);
        if (!sessionStorage.getItem("puzzleloom-donated-note")) {
          setSupport(true);
          sessionStorage.setItem("puzzleloom-donated-note", "shown");
        }
      }
    } catch (e) {
      setError((e as Error).message);
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
          download(source, `${puzzle!.id}-${i + 1}.svg`, "image/svg+xml");
        else {
          const url = URL.createObjectURL(
            new Blob([source], { type: "image/svg+xml" }),
          );
          const image = new Image();
          await new Promise<void>((resolve, reject) => {
            image.onload = () => resolve();
            image.onerror = () =>
              reject(new Error("Could not render the PNG. Try SVG instead."));
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
          if (blob) download(blob, `${puzzle!.id}-${i + 1}.png`, "image/png");
        }
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function openSaved() {
    try {
      setSaved(await listPuzzles());
      setDialog("saved");
    } catch {
      setError(copy.localStorageIsUnavailableExportAProject);
    }
  }
  async function importFile(file?: File) {
    if (!file) return;
    try {
      if (file.size > 300000)
        throw new Error("Use a project file smaller than 300 KB.");
      load(readPuzzle(JSON.parse(await file.text())));
    } catch (e) {
      setError(copy.couldNotImportThePuzzle + (e as Error).message);
    }
  }
  const link = puzzle
    ? `${typeof location === "undefined" ? "" : location.origin}/play/#${encode(puzzle)}`
    : "";
  return (
    <section
      className="maker"
      aria-label={copy.puzzleMaker}
      data-ready={puzzle && !busy ? "true" : "false"}
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
              <span className="type-symbol" aria-hidden="true">
                {["▦", "▤", copy.aa, "a=z"][i]}
              </span>
              {LABELS[t]}
            </button>
          ))}
        </div>
        <button className="text-button saved-button" onClick={openSaved}>
          {copy.myPuzzles} <Arrow />
        </button>
      </div>
      <div className="workbench">
        <aside className="word-panel">
          <div className="panel-heading">
            <span className="step">01</span>
            <h2>
              {type === copy.cryptogram ? copy.yourMessage : copy.yourWords}
            </h2>
            <span className="count">
              {type === copy.cryptogram
                ? `${quote.length}/600`
                : `${wordCount} words`}
            </span>
          </div>
          <p className="help">
            {type === copy.cryptogram
              ? copy.aLittleMysteryOneLetterAtA
              : copy.oneWordPerLineAddAClue}
          </p>
          {type === copy.cryptogram ? (
            <>
              <label className="sr-only" htmlFor="quote">
                {copy.yourQuote}{" "}
              </label>
              <textarea
                id="quote"
                value={quote}
                maxLength={600}
                onChange={(e) => setQuote(e.target.value)}
                className="word-editor"
              />
              <label className="field">
                {copy.tryAnOriginalQuote}{" "}
                <select value="" onChange={(e) => setQuote(e.target.value)}>
                  <option value="" disabled>
                    {copy.chooseAQuote}{" "}
                  </option>
                  {QUOTES.map((q) => (
                    <option key={q}>{q}</option>
                  ))}
                </select>
              </label>
            </>
          ) : (
            <>
              <label className="sr-only" htmlFor="words">
                {copy.wordsAndClues}{" "}
              </label>
              <textarea
                id="words"
                className="word-editor"
                spellCheck={false}
                value={words}
                onChange={(e) => setWords(e.target.value)}
              />
              <div className="editor-footer">
                <span>{copy.wordClue}</span>
                <button
                  className="text-button"
                  onClick={() => fileInput.current?.click()}
                >
                  {copy.importTxtCsv}{" "}
                </button>
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
                      setError("Use a word list smaller than 30 KB.");
                      return;
                    }
                    setWords(await file.text());
                  }
                  e.target.value = "";
                }}
              />
            </>
          )}
          {warnings.length > 0 && (
            <p className="help" role="status">
              {warnings.join(" ")}
            </p>
          )}
          <button
            className="reshuffle"
            onClick={() => setSeed(newSeed())}
            disabled={busy}
          >
            {" "}
            <Shuffle /> {busy ? copy.makingYourPuzzle : copy.reshuffleThePuzzle}
          </button>
          <p className="local-note">
            <span className="local-dot" />
            {copy.yourWordsStayInThisBrowser}{" "}
          </p>
          <div className="small-tip">
            <strong>{copy.aLittleInspiration}</strong>
            <p>{copy.spellingListsABirthdaySurpriseOrFive} </p>
            <button
              className="text-button"
              onClick={() => {
                setWords(DEFAULT_WORDS);
                setQuote(QUOTES[0]);
                setTitle("In the garden");
              }}
            >
              {copy.useTheGardenExample}{" "}
            </button>
          </div>
        </aside>
        <div className="preview-panel">
          <div className="preview-toolbar">
            <div>
              <span className="step">02</span>
              <span>{copy.paperPreview}</span>
            </div>
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
                {copy.puzzle}{" "}
              </button>
              <button
                aria-pressed={showKey}
                onClick={() => {
                  setShowKey(true);
                  setPage(0);
                }}
              >
                {copy.answerKey}{" "}
              </button>
            </div>
          </div>
          <div
            className={`paper-wrap ${busy ? "is-busy" : ""}`}
            aria-busy={busy}
          >
            {svg ? (
              <div
                className="paper"
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            ) : (
              <div className="paper empty-paper">
                {copy.yourNextLittleChallengeIsTakingShape}{" "}
              </div>
            )}
          </div>
          {pages > 1 && (
            <div className="page-nav">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                {copy.previous}{" "}
              </button>
              <span>
                {copy.page} {page + 1}
                {copy.of} {pages}
              </span>
              <button
                disabled={page >= pages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                {copy.next}{" "}
              </button>
            </div>
          )}
          <div className="preview-caption">
            <span>
              {options.paper === copy.letter
                ? copy.usLetter8511In
                : copy.a4210297Mm}
            </span>
            <span>{puzzle?.id ?? copy.yourPrintablePage}</span>
          </div>
        </div>
        <aside className="options-panel">
          <div className="panel-heading">
            <span className="step">03</span>
            <h2>{copy.makeItYours}</h2>
          </div>
          <label className="field">
            {copy.puzzleTitle}{" "}
            <input
              value={title}
              maxLength={100}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="field">
            {copy.instructions}{" "}
            <textarea
              className="short-text"
              value={instructions}
              placeholder={puzzle?.instructions ?? copy.optionalInstructions}
              maxLength={300}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </label>
          <div className="field-pair">
            <label className="field">
              {copy.paper}{" "}
              <select
                value={options.paper}
                onChange={(e) =>
                  option("paper", e.target.value as Options["paper"])
                }
              >
                <option value="letter">{copy.usLetter}</option>
                <option value="a4">A4</option>
              </select>
            </label>
            <label className="field">
              {copy.textSize}{" "}
              <select
                value={options.fontSize}
                onChange={(e) =>
                  option("fontSize", e.target.value as Options["fontSize"])
                }
              >
                {["S", "M", "L", copy.xl].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="field">
            {copy.printFont}{" "}
            <select
              aria-label={copy.printFont}
              value={options.font}
              onChange={(e) =>
                option("font", e.target.value as Options["font"])
              }
            >
              <option value="atkinson">{copy.atkinsonHyperlegible}</option>
              <option value="opendyslexic">{copy.opendyslexicFont}</option>
            </select>
          </label>
          {(type === copy.crossword || type === copy.wordsearch) && (
            <label className="field">
              {copy.gridSize}{" "}
              <span className="field-value">
                {options.size} × {options.size}
              </span>
              <input
                type="range"
                min="8"
                max="30"
                value={options.size}
                onChange={(e) => option("size", +e.target.value)}
              />
            </label>
          )}
          {type === copy.wordsearch && (
            <label className="field">
              {copy.difficulty}{" "}
              <select
                value={options.difficulty}
                onChange={(e) =>
                  option("difficulty", e.target.value as Options["difficulty"])
                }
              >
                <option value="easy">{copy.easyAcrossAndDown}</option>
                <option value="medium">{copy.mediumAddDiagonals}</option>
                <option value="hard">{copy.hardAllDirections}</option>
              </select>
            </label>
          )}
          {type === copy.scramble && (
            <label className="field">
              {copy.hints}{" "}
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
          {type === copy.cryptogram && (
            <label className="field">
              {copy.givenLetters}{" "}
              <input
                type="number"
                min="0"
                max="8"
                value={options.givenLetters}
                onChange={(e) => option("givenLetters", +e.target.value)}
              />
            </label>
          )}
          <details>
            <summary>{copy.languageMore}</summary>
            <label className="field">
              {copy.alphabet}{" "}
              <select
                value={options.language}
                onChange={(e) =>
                  option("language", e.target.value as Options["language"])
                }
              >
                {Object.entries({
                  en: copy.english,
                  es: copy.spanish,
                  fr: copy.french,
                  de: copy.german,
                  pt: copy.portuguese,
                  it: copy.italian,
                  nl: copy.dutch,
                }).map(([code, label]) => (
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
              />{" "}
              {copy.stripAccents}{" "}
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={options.expandEszett}
                onChange={(e) => option("expandEszett", e.target.checked)}
              />{" "}
              {copy.expandToSs}{" "}
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={options.nameFields}
                onChange={(e) => option("nameFields", e.target.checked)}
              />{" "}
              {copy.nameDateClassFields}{" "}
            </label>
            {type === copy.crossword && (
              <label className="check">
                <input
                  type="checkbox"
                  checked={options.wordBank}
                  onChange={(e) => option("wordBank", e.target.checked)}
                />{" "}
                {copy.includeWordBank}{" "}
              </label>
            )}
            <label className="check">
              <input
                type="checkbox"
                checked={options.allowReveal}
                onChange={(e) => option("allowReveal", e.target.checked)}
              />{" "}
              {copy.allowAnswerRevealInPlayer}{" "}
            </label>
            <label className="field">
              {copy.seed}{" "}
              <input
                type="number"
                min="0"
                max="4294967295"
                value={seed}
                onChange={(e) => setSeed(+e.target.value >>> 0)}
              />
            </label>
          </details>
          <div className="export-options">
            <label className="field">
              {copy.answerKey}{" "}
              <select
                aria-label={copy.answerKey}
                value={keyMode}
                onChange={(e) => setKeyMode(e.target.value as typeof keyMode)}
              >
                <option value="appended">{copy.atTheBackOfThePdf}</option>
                <option value="separate">{copy.separatePdf}</option>
                <option value="none">{copy.puzzleOnly}</option>
              </select>
            </label>
            <label className="field">
              {copy.classSet}{" "}
              <span className="optional">{copy.text140Versions}</span>
              <input
                type="number"
                min="1"
                max="40"
                value={count}
                onChange={(e) =>
                  setCount(Math.max(1, Math.min(40, +e.target.value)))
                }
              />
            </label>
            <div className="download-area">
              <button
                className="primary download-button"
                disabled={!canExport}
                onClick={() => pdf()}
              >
                <span aria-hidden="true">↓</span>{" "}
                {exporting ? copy.preparingYourPdf : copy.downloadPdf}
              </button>
              <span className="download-note">
                {keyMode === copy.none
                  ? copy.printreadyPuzzlePagesOnly
                  : keyMode === copy.separate
                    ? copy.printreadyAnswerKeyInASeparateFile
                    : copy.printreadyAnswerKeysAtTheBack}
              </span>
            </div>
            <div className="secondary-actions">
              <button disabled={!canExport} onClick={() => pdf("print")}>
                {copy.print}{" "}
              </button>
              <button disabled={!canExport} onClick={() => setDialog("share")}>
                {copy.playLink}{" "}
              </button>
              <button
                disabled={!canExport}
                onClick={async () => {
                  try {
                    await savePuzzle(puzzle!);
                    setNotice("Saved in My puzzles on this browser.");
                  } catch {
                    setError(
                      "Could not save locally. Export a project file instead.",
                    );
                  }
                }}
              >
                {copy.save}{" "}
              </button>
            </div>
            <details>
              <summary>{copy.moreExportsImport}</summary>
              <div className="secondary-actions">
                <button
                  disabled={!canExport}
                  onClick={() => imageExport("png")}
                >
                  {copy.png}{" "}
                </button>
                <button
                  disabled={!canExport}
                  onClick={() => imageExport("svg")}
                >
                  {copy.svg}{" "}
                </button>
                <button
                  disabled={!canExport}
                  onClick={() =>
                    download(
                      JSON.stringify(puzzle, null, 2),
                      `${puzzle!.id}.puzzleloom.json`,
                      "application/json",
                    )
                  }
                >
                  {copy.projectFile}{" "}
                </button>
              </div>
              <button
                className="text-button"
                onClick={() => importInput.current?.click()}
              >
                {copy.openAProjectFile}{" "}
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
          </div>
        </aside>
      </div>
      {error && (
        <div className="message error" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="message notice" role="status">
          {notice}
          <button
            aria-label={copy.dismissNotification}
            onClick={() => setNotice("")}
          >
            ×
          </button>
        </div>
      )}
      {support && (
        <div className="support-note">
          <p>
            {copy.yourPuzzleIsYoursIfThisSaved}{" "}
            <a href="/support/">{copy.helpKeepPuzzleloomFree}</a>.
          </p>
          <button
            aria-label={copy.dismissSupportNote}
            onClick={() => setSupport(false)}
          >
            ×
          </button>
        </div>
      )}
      <div className="mobile-download">
        <button className="primary" disabled={!canExport} onClick={() => pdf()}>
          {exporting ? copy.preparingYourPdf : copy.downloadPdf}
        </button>
      </div>
      <dialog
        ref={modal}
        onCancel={() => setDialog(null)}
        onClick={(e) => {
          if (e.target === modal.current) setDialog(null);
        }}
        aria-labelledby="dialog-title"
      >
        <div className="dialog-head">
          <h2 id="dialog-title">
            {dialog === copy.share
              ? copy.aLittleChallengeToShare
              : copy.myPuzzles}
          </h2>
          <button onClick={() => setDialog(null)} aria-label={copy.closeDialog}>
            ×
          </button>
        </div>
        {dialog === copy.share ? (
          <>
            <p>{copy.anyoneWithThisLinkCanPlayEverything} </p>
            <label className="field">
              {copy.playLink}{" "}
              <input readOnly value={link} onFocus={(e) => e.target.select()} />
            </label>
            <div className="button-row">
              <button
                className="primary"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(link);
                    setNotice("Play link copied.");
                  } catch {
                    setNotice("Select the link and copy it manually.");
                  }
                }}
              >
                {copy.copyLink}{" "}
              </button>
              <a className="button" href={link}>
                {copy.openPlayer}{" "}
              </a>
            </div>
            <p className="help">
              {copy.theLinkIncludesTheAnswersObfuscatedRather}{" "}
            </p>
          </>
        ) : (
          <>
            <p className="help">{copy.storedOnThisDeviceInThisBrowser} </p>
            {saved.length === 0 ? (
              <p>{copy.noPuzzlesSavedYetMakeOneThen}</p>
            ) : (
              saved.map((s) => (
                <div className="saved-row" key={s.key}>
                  <button onClick={() => load(s.puzzle)}>
                    <strong>{s.puzzle.title}</strong>
                    <span>
                      {LABELS[s.puzzle.type]} · {s.puzzle.id}
                    </span>
                  </button>
                  <button
                    onClick={async () => {
                      await savePuzzle({
                        ...s.puzzle,
                        title: s.puzzle.title + " (copy)",
                      });
                      setSaved(await listPuzzles());
                    }}
                  >
                    {copy.duplicate}{" "}
                  </button>
                  <button
                    onClick={async () => {
                      await deletePuzzle(s.key);
                      setSaved(await listPuzzles());
                    }}
                  >
                    {copy.delete}{" "}
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
