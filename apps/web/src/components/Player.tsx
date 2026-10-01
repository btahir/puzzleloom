"use client";
import { copy } from "../content/ui";
import { ArrowRight } from "./Icon";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  decode,
  encode,
  letters,
  LABELS,
  type Placement,
  type Puzzle,
} from "../../../../packages/core/src/index";

const cellsOf = (q: Placement) =>
  letters(q.word).map((_, i) => `${q.x + q.dx * i},${q.y + q.dy * i}`);

export default function Player() {
  const [p, setP] = useState<Puzzle | null>(null),
    [error, setError] = useState(""),
    [answers, setAnswers] = useState<Record<string, string>>({}),
    [found, setFound] = useState<string[]>([]),
    [start, setStart] = useState<[number, number] | null>(null),
    [message, setMessage] = useState(""),
    [checkedKeys, setCheckedKeys] = useState<Set<string>>(new Set()),
    [active, setActive] = useState<[number, number]>([0, 0]),
    [axis, setAxis] = useState<"across" | "down">("across"),
    [pending, setPending] = useState<[number, number] | null>(null),
    [empty, setEmpty] = useState(false);
  const dragging = useRef(false);
  const grid = useRef<HTMLDivElement>(null),
    clueList = useRef<HTMLElement>(null);
  useEffect(() => {
    const open = () => {
      setAnswers({});
      setFound([]);
      setStart(null);
      setMessage("");
      setCheckedKeys(new Set());
      setError("");
      setAxis("across");
      setPending(null);
      if (location.hash.length <= 1) {
        setP(null);
        setEmpty(true);
        return;
      }
      setEmpty(false);
      try {
        const puzzle = decode(location.hash.slice(1));
        setP(puzzle);
        const first = puzzle.placements[0];
        setActive(first ? [first.x, first.y] : [0, 0]);
        if (first) setAxis(first.dy ? "down" : "across");
      } catch (error) {
        // Keep technical detail out of the page; it helps when debugging a bad link.
        console.debug("Puzzleloom play link:", error);
        setP(null);
        setError(
          error instanceof Error && error.name === "PuzzleError"
            ? error.message
            : copy.playLinkBrokenBody,
        );
      }
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, []);
  // The word that holds the active cell, preferring the current direction.
  const wordAt = (x: number, y: number, prefer: "across" | "down") => {
    if (!p || p.type !== "crossword") return undefined;
    const k = `${x},${y}`;
    const matches = p.placements.filter((q) => cellsOf(q).includes(k));
    return (
      matches.find((q) => (prefer === "across" ? q.dx === 1 : q.dy === 1)) ??
      matches[0]
    );
  };
  const current = p ? wordAt(active[0], active[1], axis) : undefined;
  useEffect(() => {
    clueList.current
      ?.querySelector<HTMLElement>(".clue.is-current")
      ?.scrollIntoView({ block: "nearest" });
  }, [current?.number, current?.dx]);
  if (empty)
    return (
      <div className="content-page">
        <h1>{copy.playEmptyTitle}</h1>
        <p className="lead-plain">{copy.playEmptyBody}</p>
        <p className="button-row spaced">
          <a className="button primary" href="/">
            {copy.makeAPuzzle}
          </a>
        </p>
      </div>
    );
  if (error)
    return (
      <div className="content-page">
        <h1>{copy.playLinkBroken}</h1>
        <p role="alert" className="lead-plain">
          {error}
        </p>
        <p>{copy.playLinkBrokenNext}</p>
        <p className="button-row spaced">
          <a className="button primary" href="/">
            {copy.makeAPuzzle}
          </a>
        </p>
      </div>
    );
  if (!p)
    return (
      <div className="content-page">
        <p>{copy.openingPuzzle}</p>
      </div>
    );
  const puzzle = p;
  const expected: Record<string, string> = {};
  if (p.type === "crossword")
    p.grid.forEach((row, y) =>
      row.forEach((c, x) => {
        if (c) expected[`${x},${y}`] = c;
      }),
    );
  if (p.type === "scramble")
    p.entries.forEach((e, i) => (expected[String(i)] = e.word));
  if (p.type === "cryptogram")
    Object.entries(p.cipher).forEach(([plain, encoded]) => {
      if (p.encoded.includes(encoded)) expected[encoded] = plain;
    });
  const actual = { ...answers };
  if (p.type === "cryptogram")
    p.given.forEach((c) => (actual[p.cipher[c]] = c));
  const total = Object.keys(expected).length,
    filled = Object.keys(expected).filter((k) => actual[k]).length,
    correct = Object.entries(expected).filter(
      ([k, v]) => actual[k]?.toUpperCase() === v,
    ).length,
    done =
      p.type === "word-search"
        ? found.length === p.entries.length
        : correct === total;
  const isWrong = (k: string) =>
    checkedKeys.has(k) &&
    !!actual[k] &&
    actual[k].toUpperCase() !== expected[k];
  function check(scope: "all" | "letter" | "word" = "all") {
    if (puzzle.type === "word-search") {
      setMessage(
        done
          ? copy.everyWordFound
          : `${copy.wordsFound(found.length, puzzle.entries.length)}.`,
      );
      return;
    }
    let keys = Object.keys(expected);
    if (scope === "letter") keys = [active.join(",")];
    if (scope === "word")
      keys = current ? cellsOf(current) : [active.join(",")];
    setCheckedKeys((s) => new Set([...s, ...keys]));
    const right = keys.filter(
      (k) => actual[k]?.toUpperCase() === expected[k],
    ).length;
    const unit = puzzle.type === "scramble" ? "word" : "letter";
    setMessage(
      right === keys.length
        ? scope === "all"
          ? copy.allCorrect
          : scope === "word"
            ? copy.wordRight
            : copy.thatsRight
        : copy.checkResult(right, keys.length, unit),
    );
  }
  function select(x: number, y: number, from?: [number, number]) {
    const begin = from ?? start;
    if (!begin) {
      setStart([x, y]);
      return;
    }
    const [sx, sy] = begin;
    const match = puzzle.placements.find((q) => {
      const end = [
        q.x + q.dx * (letters(q.word).length - 1),
        q.y + q.dy * (letters(q.word).length - 1),
      ];
      return (
        (q.x === sx && q.y === sy && end[0] === x && end[1] === y) ||
        (q.x === x && q.y === y && end[0] === sx && end[1] === sy)
      );
    });
    if (match) {
      setFound((f) => [...new Set([...f, match.word])]);
      setMessage(copy.wordFound(match.word));
    } else setMessage(copy.noWordThere);
    setStart(null);
    setPending(null);
  }
  function focus(x: number, y: number) {
    const input = grid.current?.querySelector<HTMLInputElement>(
      `[data-cell="${x},${y}"]`,
    );
    if (input) {
      input.focus();
      setActive([x, y]);
    }
  }
  /** Free movement with the arrow keys: skips gaps to the next white square. */
  function advance(x: number, y: number, dx: number, dy: number) {
    let xx = x + dx,
      yy = y + dy;
    while (
      yy >= 0 &&
      xx >= 0 &&
      yy < puzzle.grid.length &&
      xx < puzzle.grid[0].length
    ) {
      if (puzzle.grid[yy][xx]) {
        focus(xx, yy);
        return;
      }
      xx += dx;
      yy += dy;
    }
  }
  /** Typing moves within the current word only and stops at its end. */
  function step(x: number, y: number, delta: 1 | -1) {
    const word = wordAt(x, y, axis);
    if (!word) return;
    const cells = cellsOf(word),
      i = cells.indexOf(`${x},${y}`),
      next = cells[i + delta];
    if (next) {
      const [nx, ny] = next.split(",").map(Number);
      focus(nx, ny);
    }
  }
  const highlighted = new Set<string>();
  p.placements
    .filter((q) => found.includes(q.word))
    .forEach((q) => cellsOf(q).forEach((k) => highlighted.add(k)));
  // While selecting, snap the pointer to the nearest straight line from the first letter.
  let pendingLine: [number, number, number, number] | null = null;
  if (p.type === "word-search" && start && pending) {
    const ddx = pending[0] - start[0],
      ddy = pending[1] - start[1];
    if (ddx || ddy) {
      const ax = Math.abs(ddx),
        ay = Math.abs(ddy);
      const [dx, dy] =
        ax >= 2 * ay
          ? [Math.sign(ddx), 0]
          : ay >= 2 * ax
            ? [0, Math.sign(ddy)]
            : [Math.sign(ddx), Math.sign(ddy)];
      let n = dx && dy ? Math.max(ax, ay) : dx ? ax : ay;
      const w = p.grid[0].length,
        h = p.grid.length;
      while (
        n > 0 &&
        (start[0] + dx * n < 0 ||
          start[0] + dx * n >= w ||
          start[1] + dy * n < 0 ||
          start[1] + dy * n >= h)
      )
        n--;
      if (n > 0)
        pendingLine = [
          start[0],
          start[1],
          start[0] + dx * n,
          start[1] + dy * n,
        ];
    }
  }
  const wordCells = new Set(current ? cellsOf(current) : []);
  const typeLabel = LABELS[p.type];
  const cols = p.grid[0]?.length ?? 0,
    rows = p.grid.length;
  const progress =
    p.type === "word-search"
      ? copy.wordsFound(found.length, p.entries.length)
      : p.type === "crossword"
        ? copy.squaresFilled(filled, total)
        : p.type === "scramble"
          ? copy.answersFilled(filled, total)
          : copy.lettersFilled(filled, total);
  // Cryptogram: group letters into words so a word never breaks across lines.
  const cryptoWords =
    p.type === "cryptogram"
      ? p.encoded.split(/(\s+)/).filter((w) => w && !/^\s+$/.test(w))
      : [];
  let cryptoIndex = 0;
  const gridType = p.type === "crossword" || p.type === "word-search";
  const actions = (
    <>
      <div className="button-row player-actions">
        <button className="primary" onClick={() => check()}>
          {copy.checkPuzzle}
        </button>
        {p.type === "crossword" && (
          <>
            <button onClick={() => check("letter")}>{copy.checkLetter}</button>
            <button onClick={() => check("word")}>{copy.checkWord}</button>
          </>
        )}
        {p.options.allowReveal && (
          <button
            onClick={() => {
              if (p.type === "word-search")
                setFound(p.entries.map((e) => e.word));
              else setAnswers(expected);
              setMessage(copy.answersRevealed);
            }}
          >
            {copy.revealAnswers}
          </button>
        )}
        <button
          onClick={() => {
            setAnswers({});
            setFound([]);
            setCheckedKeys(new Set());
            setMessage(copy.answersCleared);
          }}
        >
          {copy.startAgain}
        </button>
      </div>
      {!gridType && (
        <p className={done ? "success-message" : "play-message"} role="status">
          {message || copy.playIdle}
        </p>
      )}
    </>
  );
  return (
    <section className="player content-page">
      <h1>{p.title}</h1>
      {p.instructions && (
        <p className="player-instructions">{p.instructions}</p>
      )}
      <div className="player-meta">
        <span>
          {p.title.includes(typeLabel) ? p.id : `${typeLabel} · ${p.id}`}
        </span>
        {gridType ? (
          // Grid players report results here, next to the grid, so they stay in view.
          <span className="meta-status">
            <span
              role="status"
              className={done ? "success-message" : undefined}
            >
              {message}
            </span>
            <span>{progress}</span>
          </span>
        ) : (
          <span>{progress}</span>
        )}
      </div>
      {(p.type === "crossword" || p.type === "word-search") && (
        <div className={`player-layout ${p.type}`}>
          <div>
            <p className="help">
              {p.type === "crossword"
                ? copy.crosswordHelp
                : copy.wordSearchHelp}
            </p>
            {p.type === "crossword" && current && (
              <p className="current-clue" aria-live="polite">
                <b>
                  {current.number} {current.dx ? copy.across : copy.down}
                </b>{" "}
                {current.clue || copy.letterCount(letters(current.word).length)}
              </p>
            )}
            <div
              className="play-grid-wrap"
              style={
                {
                  "--rows": rows,
                  "--cols": cols,
                } as CSSProperties
              }
            >
              {p.type === "word-search" && (
                <svg
                  className="found-strokes"
                  viewBox={`0 0 ${cols} ${rows}`}
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  {p.placements
                    .filter((q) => found.includes(q.word))
                    .map((q) => {
                      const n = letters(q.word).length - 1;
                      return (
                        <line
                          key={q.word}
                          x1={q.x + 0.5}
                          y1={q.y + 0.5}
                          x2={q.x + q.dx * n + 0.5}
                          y2={q.y + q.dy * n + 0.5}
                          pathLength={1}
                        />
                      );
                    })}
                  {pendingLine && (
                    <line
                      className="pending"
                      x1={pendingLine[0] + 0.5}
                      y1={pendingLine[1] + 0.5}
                      x2={pendingLine[2] + 0.5}
                      y2={pendingLine[3] + 0.5}
                    />
                  )}
                </svg>
              )}
              <div
                ref={grid}
                className={`play-grid ${p.type}`}
                role="group"
                aria-label={copy.puzzleGrid}
                onPointerMove={(e) => {
                  if (p.type !== "word-search" || !start || !dragging.current)
                    return;
                  const cell = document
                    .elementFromPoint(e.clientX, e.clientY)
                    ?.closest("[data-xy]");
                  if (cell) {
                    const [cx, cy] = cell
                      .getAttribute("data-xy")!
                      .split(",")
                      .map(Number);
                    if (!pending || pending[0] !== cx || pending[1] !== cy)
                      setPending([cx, cy]);
                  }
                }}
                style={{
                  gridTemplateColumns: `repeat(${cols},minmax(0,1fr))`,
                }}
              >
                {p.grid.flatMap((row, y) =>
                  row.map((c, x) => {
                    const k = `${x},${y}`,
                      number = p.placements.find(
                        (q) => q.x === x && q.y === y,
                      )?.number;
                    if (!c) return <span key={k} className="blocked" />;
                    if (p.type === "word-search")
                      return (
                        <button
                          key={k}
                          className={`${highlighted.has(k) ? "found" : ""} ${start?.[0] === x && start?.[1] === y ? "selected" : ""}`}
                          aria-label={`${copy.cellLabel(y + 1, x + 1)}: ${c}`}
                          aria-pressed={
                            start?.[0] === x && start?.[1] === y
                              ? true
                              : undefined
                          }
                          onPointerDown={(e) => {
                            e.preventDefault();
                            (e.target as HTMLElement).focus();
                            dragging.current = true;
                            if (!start) setStart([x, y]);
                            const release = () => {
                              dragging.current = false;
                              window.removeEventListener("pointerup", release);
                              window.removeEventListener(
                                "pointercancel",
                                release,
                              );
                            };
                            window.addEventListener("pointerup", release);
                            window.addEventListener("pointercancel", release);
                          }}
                          onFocus={() => {
                            if (start) setPending([x, y]);
                          }}
                          onPointerUp={(e) => {
                            if (start && (start[0] !== x || start[1] !== y)) {
                              select(x, y);
                              e.preventDefault();
                            }
                          }}
                          onTouchEnd={(e) => {
                            const touch = e.changedTouches[0];
                            const target = document
                              .elementFromPoint(touch.clientX, touch.clientY)
                              ?.closest("[data-xy]");
                            if (target) {
                              const [tx, ty] = target
                                .getAttribute("data-xy")!
                                .split(",")
                                .map(Number);
                              if (start && (start[0] !== tx || start[1] !== ty))
                                select(tx, ty);
                            }
                          }}
                          data-xy={k}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              select(x, y);
                            }
                          }}
                        >
                          {c}
                        </button>
                      );
                    const isActive = active[0] === x && active[1] === y;
                    return (
                      <label
                        className={`cross-cell ${wordCells.has(k) ? "in-word" : ""} ${isActive ? "is-active" : ""} ${isWrong(k) ? "incorrect" : ""}`}
                        key={k}
                      >
                        {number && <span>{number}</span>}
                        <input
                          data-cell={k}
                          aria-label={`${copy.cellLabel(y + 1, x + 1)}${number ? copy.clueSuffix(number) : ""}`}
                          autoComplete="off"
                          autoCapitalize="characters"
                          maxLength={4}
                          value={answers[k] ?? ""}
                          onFocus={() => {
                            setActive([x, y]);
                            // Switch direction when the square only belongs to the other one.
                            const w = wordAt(x, y, axis);
                            if (w) setAxis(w.dx ? "across" : "down");
                          }}
                          onClick={() => {
                            if (isActive) {
                              const other =
                                axis === "across" ? "down" : "across";
                              const w = wordAt(x, y, other);
                              if (w && (other === "across" ? w.dx : w.dy))
                                setAxis(other);
                            }
                          }}
                          onChange={(e) => {
                            const char =
                              letters(e.target.value.toUpperCase())
                                .filter((ch) => /\p{L}/u.test(ch))
                                .at(-1) ?? "";
                            setAnswers((a) => ({ ...a, [k]: char }));
                            setCheckedKeys((s) => {
                              if (!s.has(k)) return s;
                              const n = new Set(s);
                              n.delete(k);
                              return n;
                            });
                            if (char) step(x, y, 1);
                          }}
                          onKeyDown={(e) => {
                            const moves: Record<string, [number, number]> = {
                              ArrowRight: [1, 0],
                              ArrowLeft: [-1, 0],
                              ArrowUp: [0, -1],
                              ArrowDown: [0, 1],
                            };
                            if (moves[e.key]) {
                              e.preventDefault();
                              const [dx, dy] = moves[e.key];
                              setAxis(dx ? "across" : "down");
                              advance(x, y, dx, dy);
                            }
                            if (e.key === " ") {
                              e.preventDefault();
                              setAxis((a) =>
                                a === "across" ? "down" : "across",
                              );
                            }
                            if (e.key === "Backspace" && !answers[k]) {
                              e.preventDefault();
                              step(x, y, -1);
                            }
                          }}
                        />
                      </label>
                    );
                  }),
                )}
              </div>
            </div>
            {actions}
          </div>
          <aside className={`play-clues ${p.type}`} ref={clueList}>
            {p.type === "word-search" ? (
              <>
                <h2>{copy.findTheseWords}</h2>
                <ul className="word-list">
                  {p.entries.map((e) => (
                    <li
                      className={found.includes(e.word) ? "found-word" : ""}
                      key={e.word}
                    >
                      {e.word}
                      {found.includes(e.word) && (
                        <span className="sr-only"> {copy.found}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              [copy.across, copy.down].map((heading, i) => (
                <section key={heading}>
                  <h2>{heading}</h2>
                  {p.placements
                    .filter((q) => (i ? q.dy : q.dx))
                    .map((q) => {
                      const isCurrent = current === q;
                      return (
                        <button
                          className={`clue ${isCurrent ? "is-current" : ""}`}
                          aria-current={isCurrent ? "true" : undefined}
                          key={q.word}
                          onClick={() => {
                            setAxis(i ? "down" : "across");
                            focus(q.x, q.y);
                          }}
                        >
                          <b>{q.number}</b>{" "}
                          {q.clue || copy.letterCount(letters(q.word).length)}
                        </button>
                      );
                    })}
                </section>
              ))
            )}
          </aside>
        </div>
      )}
      {p.type === "scramble" && (
        <div className="scramble-play">
          {p.entries.map((e, i) => (
            <label className="field" key={e.word}>
              <span>
                {i + 1}. <strong>{p.scrambled[i]}</strong>
              </span>
              {p.options.hint === "clue" && <small>{e.clue}</small>}
              <input
                aria-label={copy.answerLabel(i + 1)}
                className={isWrong(String(i)) ? "incorrect" : ""}
                value={answers[i] ?? ""}
                placeholder={
                  p.options.hint === "first"
                    ? e.word[0] + "…"
                    : copy.letterCount(letters(e.word).length)
                }
                onChange={(event) =>
                  setAnswers((a) => ({
                    ...a,
                    [i]: event.target.value.toUpperCase(),
                  }))
                }
              />
            </label>
          ))}
        </div>
      )}
      {p.type === "cryptogram" && (
        <div
          className="crypto-play"
          aria-label={copy.cipherMessage}
          role="group"
        >
          {cryptoWords.map((word, wi) => {
            const chars = letters(word);
            return (
              <span className="crypto-word" key={wi}>
                {chars.map((c, ci) => {
                  const i = ++cryptoIndex;
                  return /\p{L}/u.test(c) ? (
                    <label key={ci} className={isWrong(c) ? "incorrect" : ""}>
                      <span>{c}</span>
                      <input
                        aria-label={copy.decodeLabel(c, i)}
                        value={actual[c] ?? ""}
                        readOnly={p.given.some((a) => p.cipher[a] === c)}
                        maxLength={2}
                        onChange={(e) =>
                          setAnswers((a) => ({
                            ...a,
                            [c]:
                              letters(e.target.value.toUpperCase()).at(-1) ??
                              "",
                          }))
                        }
                      />
                    </label>
                  ) : (
                    <span className="crypto-punctuation" key={ci}>
                      {c}
                    </span>
                  );
                })}
              </span>
            );
          })}
        </div>
      )}
      {!gridType && actions}
      <p className="help">{copy.playPracticeNote}</p>
      <a href={`/#p=${encode(p)}`} className="text-button with-arrow">
        {copy.openInMaker} <ArrowRight />
      </a>
    </section>
  );
}
