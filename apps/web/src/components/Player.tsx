"use client";
import { copy } from "../content/ui";

import { useEffect, useRef, useState } from "react";
import {
  decode,
  encode,
  letters,
  LABELS,
  type Puzzle,
} from "../../../../packages/core/src/index";
export default function Player() {
  const [p, setP] = useState<Puzzle | null>(null),
    [error, setError] = useState(""),
    [answers, setAnswers] = useState<Record<string, string>>({}),
    [found, setFound] = useState<string[]>([]),
    [start, setStart] = useState<[number, number] | null>(null),
    [message, setMessage] = useState(""),
    [checked, setChecked] = useState(false),
    [active, setActive] = useState<[number, number]>([0, 0]),
    [axis, setAxis] = useState<"across" | "down">("across");
  const grid = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const open = () => {
      setAnswers({});
      setFound([]);
      setStart(null);
      setMessage("");
      setChecked(false);
      setError("");
      setAxis("across");
      try {
        const puzzle = decode(location.hash.slice(1));
        setP(puzzle);
        const first = puzzle.placements[0];
        setActive(first ? [first.x, first.y] : [0, 0]);
      } catch (error) {
        setP(null);
        setError((error as Error).message);
      }
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, []);
  if (error)
    return (
      <div className="content-page">
        <h1>{copy.thisPuzzleLinkNeedsAnotherLook}</h1>
        <p role="alert">{error}</p>
        <a className="button" href="/">
          {copy.makeAPuzzle}{" "}
        </a>
      </div>
    );
  if (!p)
    return (
      <div className="content-page">
        <p>{copy.openingYourPuzzle}</p>
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
  const correct = Object.entries(expected).filter(
      ([k, v]) => actual[k]?.toUpperCase() === v,
    ).length,
    total = Object.keys(expected).length,
    done =
      p.type === "word-search"
        ? found.length === p.entries.length
        : correct === total;
  function check(scope: "all" | "letter" | "word" = "all") {
    setChecked(true);
    if (puzzle.type === "word-search") {
      setMessage(
        done
          ? copy.everyWordFoundNicelyDone
          : `${found.length} of ${puzzle.entries.length} words found.`,
      );
      return;
    }
    let keys = Object.keys(expected);
    if (scope === "letter") keys = [active.join(",")];
    if (scope === "word") {
      const word = puzzle.placements.find(
        (q) =>
          (axis === "across" ? q.dx === 1 : q.dy === 1) &&
          letters(q.word).some(
            (_, i) =>
              q.x + q.dx * i === active[0] && q.y + q.dy * i === active[1],
          ),
      );
      keys = word
        ? letters(word.word).map(
            (_, i) => `${word.x + word.dx * i},${word.y + word.dy * i}`,
          )
        : [active.join(",")];
    }
    const right = keys.filter(
      (k) => actual[k]?.toUpperCase() === expected[k],
    ).length;
    setMessage(
      right === keys.length
        ? scope === copy.all
          ? copy.allCorrectNicelyDone
          : copy.thatLooksRight
        : `${right} of ${keys.length} ${puzzle.type === copy.scramble ? copy.words : copy.letters} correct. Keep going.`,
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
      setMessage(`${match.word} found.`);
    } else setMessage(copy.noWordThereYetSelectFromThe);
    setStart(null);
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
  const highlighted = new Set<string>();
  p.placements
    .filter((q) => found.includes(q.word))
    .forEach((q) =>
      letters(q.word).forEach((_, i) =>
        highlighted.add(`${q.x + q.dx * i},${q.y + q.dy * i}`),
      ),
    );
  return (
    <section className="player content-page">
      <div className="eyebrow">
        {copy.aLittleChallengeForYou} {LABELS[p.type]}
      </div>
      <h1>{p.title}</h1>
      <p>{p.instructions}</p>
      <div className="player-meta">
        <span>{p.id}</span>
        <span>
          {p.type === copy.wordsearch
            ? `${found.length} / ${p.entries.length} words found`
            : `${correct} / ${total} ${p.type === copy.scramble ? copy.words : copy.letters} correct`}
        </span>
      </div>
      {(p.type === copy.crossword || p.type === copy.wordsearch) && (
        <div className="player-layout">
          <div>
            <p className="help">
              {p.type === copy.crossword
                ? copy.typeALetterArrowKeysMoveSpace
                : copy.dragAcrossAWordOrChooseIts}
            </p>
            <div
              ref={grid}
              className={`play-grid ${p.type}`}
              role="group"
              aria-label={copy.puzzleGrid}
              style={{
                gridTemplateColumns: `repeat(${p.grid[0].length},minmax(0,1fr))`,
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
                        aria-label={`Row ${y + 1}, column ${x + 1}: ${c}`}
                        onPointerDown={(e) => {
                          e.preventDefault();
                          (e.target as HTMLElement).focus();
                          if (!start) setStart([x, y]);
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
                  return (
                    <label
                      className={`cross-cell ${checked && answers[k] && answers[k] !== c ? "incorrect" : ""}`}
                      key={k}
                    >
                      {number && <span>{number}</span>}
                      <input
                        data-cell={k}
                        aria-label={`Row ${y + 1}, column ${x + 1}${number ? copy.clue + number : ""}`}
                        autoComplete="off"
                        autoCapitalize="characters"
                        maxLength={4}
                        value={answers[k] ?? ""}
                        onFocus={() => setActive([x, y])}
                        onChange={(e) => {
                          const char =
                            letters(e.target.value.toUpperCase())
                              .filter((ch) => /\p{L}/u.test(ch))
                              .at(-1) ?? "";
                          setAnswers((a) => ({ ...a, [k]: char }));
                          if (char)
                            advance(
                              x,
                              y,
                              axis === "across" ? 1 : 0,
                              axis === "down" ? 1 : 0,
                            );
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
                          if (e.key === "Backspace" && !answers[k])
                            advance(
                              x,
                              y,
                              axis === "across" ? -1 : 0,
                              axis === "down" ? -1 : 0,
                            );
                        }}
                      />
                    </label>
                  );
                }),
              )}
            </div>
          </div>
          <aside className="play-clues">
            {p.type === copy.wordsearch ? (
              <>
                <h2>{copy.findTheseWords}</h2>
                <ul>
                  {p.entries.map((e) => (
                    <li
                      className={found.includes(e.word) ? "found-word" : ""}
                      key={e.word}
                    >
                      {e.word}
                      {found.includes(e.word) && (
                        <span className="sr-only">{copy.found}</span>
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
                    .map((q) => (
                      <button
                        className="clue"
                        key={q.word}
                        onClick={() => {
                          setAxis(i ? "down" : "across");
                          focus(q.x, q.y);
                        }}
                      >
                        <b>{q.number}</b>{" "}
                        {q.clue || `${letters(q.word).length} letters`}
                      </button>
                    ))}
                </section>
              ))
            )}
          </aside>
        </div>
      )}
      {p.type === copy.scramble && (
        <div className="scramble-play">
          {p.entries.map((e, i) => (
            <label className="field" key={e.word}>
              <span>
                {i + 1}. <strong>{p.scrambled[i]}</strong>
              </span>
              {p.options.hint === copy.clue2 && <small>{e.clue}</small>}
              <input
                aria-label={`Answer ${i + 1}`}
                className={
                  checked && answers[i] && answers[i] !== e.word
                    ? "incorrect"
                    : ""
                }
                value={answers[i] ?? ""}
                placeholder={
                  p.options.hint === copy.first
                    ? e.word[0] + "…"
                    : `${letters(e.word).length} letters`
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
      {p.type === copy.cryptogram && (
        <div className="crypto-play" aria-label={copy.cipherMessage}>
          {letters(p.encoded).map((c, i) =>
            /\p{L}/u.test(c) ? (
              <label key={i}>
                <span>{c}</span>
                <input
                  aria-label={`Decode ${c}, position ${i + 1}`}
                  value={actual[c] ?? ""}
                  readOnly={p.given.some((a) => p.cipher[a] === c)}
                  maxLength={2}
                  onChange={(e) =>
                    setAnswers((a) => ({
                      ...a,
                      [c]: letters(e.target.value.toUpperCase()).at(-1) ?? "",
                    }))
                  }
                />
              </label>
            ) : (
              <span
                className={c === " " ? "crypto-space" : "crypto-punctuation"}
                key={i}
              >
                {c}
              </span>
            ),
          )}
        </div>
      )}
      <div className="button-row player-actions">
        <button className="primary" onClick={() => check()}>
          {copy.checkPuzzle}{" "}
        </button>
        {p.type === copy.crossword && (
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
              setMessage(
                "Answers revealed. Try another puzzle when you’re ready.",
              );
            }}
          >
            {copy.revealAnswers}{" "}
          </button>
        )}
        <button
          onClick={() => {
            setAnswers({});
            setFound([]);
            setChecked(false);
            setMessage("A fresh start.");
          }}
        >
          {copy.startAgain}{" "}
        </button>
      </div>
      <p className={done ? "success-message" : "play-message"} role="status">
        {message || copy.takeYourTimeTheresNoTimerHere}
      </p>
      <p className="help">{copy.practiceNotASecureAssessmentThisLink} </p>
      <a href={`/#p=${encode(p)}`} className="text-button">
        {copy.openInTheMaker}{" "}
      </a>
    </section>
  );
}
