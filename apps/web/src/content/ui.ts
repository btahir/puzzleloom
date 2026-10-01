// English interface copy. Every visible UI string lives here so a locale can be added later.
// Voice: plain, short and specific. No hype words, no emoji, no exclamation marks.
export const copy = {
  // Site chrome
  skipToContent: "Skip to content",
  siteName: "Puzzleloom",
  homeLabel: "Puzzleloom home",
  mainNavigation: "Main navigation",
  navMaker: "Maker",
  navAbout: "About",
  navAgents: "For agents",
  navSupport: "Support",
  menu: "Menu",
  closeMenu: "Close menu",
  switchToLightTheme: "Switch to light theme",
  switchToDarkTheme: "Switch to dark theme",
  footerNote: "Free and open source (MIT). No ads, no account, no tracking.",
  footerAbout: "About & privacy",
  footerAgents: "CLI & MCP",
  footerSource: "Source code",
  footerSupport: "Support Puzzleloom",
  footerNavigation: "Footer",

  // Homepage
  homeTitle:
    "Make a crossword, word search, scramble or cryptogram from your word list",
  homeSubtitle:
    "Free printable PDF with the answer key. No account, and your words never leave this browser.",
  pitchHeading: "What you get",
  pitchIntro:
    "Puzzleloom is a free puzzle maker for teachers, parents and anyone with a word list. Here is what it does that most free makers don’t.",
  pitch: [
    {
      title: "Every word placed, or a reason why",
      body: "The crossword engine tries many layouts and keeps the most compact connected grid. If a word can’t join it, you see which word and why. Nothing is dropped silently.",
      example:
        "SPHINX didn’t fit: it shares no letters with the other words. Add a word with S, P, H, I, N or X.",
    },
    {
      title: "One list, four puzzles",
      body: "Type the list once. The crossword, word search, word scramble and cryptogram tabs all read it, so switching type never means retyping.",
    },
    {
      title: "Class sets up to 40 versions",
      body: "One PDF with up to 40 different layouts of the same words. Each version has its own printed ID and its own answer key at the back.",
    },
    {
      title: "Print-ready PDF, Letter or A4",
      body: "Vector PDF in black on white with the fonts embedded. Put the answer key at the back, in a separate file, or leave it out. Large print and an OpenDyslexic font option.",
    },
    {
      title: "Nothing uploaded, nothing to sign up for",
      body: "Puzzles are made in your browser. No account, no ads, no watermark, no tracking. Save to this browser or download a project file.",
    },
    {
      title: "Your AI assistant can drive it",
      body: "A command-line tool and a local MCP server run the same engine. Your assistant writes the clues; Puzzleloom lays out the grid and checks the key.",
      link: { href: "/agents/", label: "Read the agent docs" },
    },
  ],
  readyListsHeading: "Start from a ready-made list",
  readyListsIntro:
    "Each page opens the maker with a word list we wrote. Use it as is or edit it.",

  // Maker: tabs and panels
  puzzleMaker: "Puzzle maker",
  puzzleType: "Puzzle type",
  myPuzzles: "My puzzles",
  defaultTitles: {
    crossword: "Crossword",
    "word-search": "Word search",
    scramble: "Word scramble",
    cryptogram: "Secret message",
  },
  shortLabels: {
    crossword: "Crossword",
    "word-search": "Word search",
    scramble: "Scramble",
    cryptogram: "Cryptogram",
  },
  wordsHeading: "Words",
  quoteHeading: "Quote",
  wordsHelp: "One word per line. Add a clue after a colon.",
  quoteHelp:
    "Type a quote or sentence. Each letter is swapped for another; spaces and punctuation stay.",
  wordsLabel: "Words and clues",
  quoteLabel: "Quote to encode",
  sampleQuotes: "Sample quotes",
  chooseAQuote: "Choose a quote",
  importList: "Import .txt or .csv",
  wordCount: (n: number) => `${n} ${n === 1 ? "word" : "words"}`,
  newLayout: "Reshuffle",
  making: "Making…",
  formatsHeading: "List formats",
  formats: [
    "GARDEN: A place to grow",
    "GARDEN - A place to grow",
    "GARDEN,A place to grow",
  ],
  formatsNote: "Tab-separated rows work too. Up to 40 words.",
  loadExample: "Load the example list",
  listChanges: "Changes to your list",
  previewHeading: "Preview",
  previewPage: "Preview page",
  puzzle: "Puzzle",
  answerKey: "Answer key",
  makingPreview: "Making the preview…",
  previewStale: "Preview not updated. Fix the word list to see the new layout.",
  enlarge: "Enlarge",
  enlargePreview: "Enlarge the preview to proofread it",
  answerKeyCaption: (mode: "appended" | "separate" | "none") =>
    mode === "appended"
      ? "Answer key · printed after the puzzle"
      : mode === "separate"
        ? "Answer key · its own PDF"
        : "Answer key · not included in the download",
  previous: "Previous",
  next: "Next",
  pageOf: (n: number, total: number) => `Page ${n} of ${total}`,
  paperLetter: "US Letter · 8.5 × 11 in",
  paperA4: "A4 · 210 × 297 mm",
  settingsHeading: "Settings",

  // Maker: fields
  puzzleTitle: "Puzzle title",
  instructions: "Instructions",
  optionalInstructions: "Optional instructions",
  paper: "Paper",
  usLetter: "US Letter",
  a4: "A4",
  textSize: "Text size",
  printFont: "Print font",
  atkinson: "Atkinson Hyperlegible",
  openDyslexic: "OpenDyslexic font",
  gridSize: "Grid size",
  gridAuto: "Auto",
  gridCustom: "Custom",
  gridSizeMode: "Grid size mode",
  gridAutoUsed: (n: number) => `${n} × ${n}, chosen to fit`,
  gridAutoPending: "Chosen to fit your words",
  gridValue: (n: number) => `${n} × ${n}`,
  difficulty: "Difficulty",
  easy: "Easy: across and down",
  medium: "Medium: adds diagonals",
  hard: "Hard: all directions, backwards",
  hints: "Hints",
  noHints: "No hints",
  firstLetter: "First letter",
  clues: "Clues",
  givenLetters: "Given letters",
  moreOptions: "More options",
  groupSheet: "On the sheet",
  groupLetters: "Letters",
  groupPlay: "Play link and layout",
  alphabet: "Alphabet for fill letters",
  languages: {
    en: "English",
    es: "Spanish",
    fr: "French",
    de: "German",
    pt: "Portuguese",
    it: "Italian",
    nl: "Dutch",
  },
  stripAccents: "Strip accents",
  expandEszett: "Expand ß to SS",
  nameFields: "Name, date and class fields",
  wordBank: "Word bank under the grid",
  allowReveal: "Allow Reveal in the play link",
  seed: "Layout number",
  seedNote: "The same words and number always give the same layout.",
  keyAppended: "At the back of the PDF",
  keySeparate: "Separate PDF",
  keyNone: "Leave it out",
  classSet: "Class set",
  classSetRange: "1 to 40 versions",
  downloadPdf: "Download PDF",
  preparingPdf: "Preparing PDF…",
  noteClassSet: (n: number, mode: "appended" | "separate" | "none") =>
    `${n} versions, each with its own ID${mode === "appended" ? "; keys at the back" : mode === "separate" ? "; keys in a second file" : ""}.`,
  downloadReasonError: "Fix the word list first.",
  print: "Print",
  playLink: "Play link",
  save: "Save",
  moreExports: "More exports & import",
  png: "PNG",
  svg: "SVG",
  projectFile: "Project file",
  openProjectFile: "Open a project file",

  // Maker: messages
  puzzleOpened: "Puzzle opened.",
  pdfDownloaded: "PDF downloaded.",
  pdfDownloadedKeySeparate:
    "Two PDFs downloaded: the puzzle and the answer key.",
  savedLocally: "Saved to My puzzles in this browser.",
  saveFailed: "Couldn’t save in this browser. Download a project file instead.",
  storageUnavailable:
    "This browser’s storage is unavailable. Download a project file to keep your puzzle.",
  importFailed: "Couldn’t open that project file. ",
  importTooBig: "Use a project file smaller than 300 KB.",
  listTooBig: "Use a word list smaller than 30 KB.",
  pngFailed: "Couldn’t make the PNG. Try SVG instead.",
  workerFailed: "The puzzle maker couldn’t start. Reload the page.",
  dismiss: "Dismiss",
  supportNote:
    "WordMint charges $5.99 a month for PDF downloads. This one was free.",
  supportNoteLink: "Help keep it that way",
  open: "Open",
  undo: "Undo",
  deletedNotice: (title: string) => `Deleted “${title}”.`,
  savedMeta: (type: string, id: string, date: string) =>
    `${type} · ${id} · saved ${date}`,
  dismissSupportNote: "Dismiss support note",

  // Dialogs
  closeDialog: "Close",
  shareHeading: "Share a play link",
  shareBody:
    "Anyone with this link can play the puzzle in a browser. The whole puzzle is stored in the link, so nothing is uploaded.",
  copyLink: "Copy link",
  openPlayer: "Open the player",
  linkCopied: "Play link copied.",
  copyManually: "Select the link and copy it.",
  shareWarning:
    "The link contains the answers in a scrambled form. Use it for practice, not for a graded test.",
  savedHeading: "My puzzles",
  savedNote:
    "Saved in this browser on this device. Download a project file for a backup.",
  savedEmpty: "Nothing saved yet. Make a puzzle, then choose Save.",
  duplicate: "Duplicate",
  delete: "Delete",
  copySuffix: " (copy)",

  // Player
  playLinkBroken: "This play link doesn’t work",
  playLinkBrokenBody:
    "This link is incomplete. It may have been cut off when it was copied.",
  playLinkBrokenNext: "Ask for the link again, or make your own puzzle.",
  makeAPuzzle: "Make a puzzle",
  openingPuzzle: "Opening the puzzle…",
  everyWordFound: "Every word found.",
  allCorrect: "All correct.",
  thatsRight: "That’s right.",
  wordRight: "That word is right.",
  wordsFound: (n: number, total: number) => `${n} of ${total} words found`,
  squaresFilled: (n: number, total: number) =>
    `${n} of ${total} squares filled`,
  answersFilled: (n: number, total: number) =>
    `${n} of ${total} answers filled in`,
  lettersFilled: (n: number, total: number) =>
    `${n} of ${total} letters decoded`,
  checkResult: (right: number, total: number, unit: "letter" | "word") =>
    `${right} of ${total} ${unit}${total === 1 ? "" : "s"} right. Wrong ones are marked in red.`,
  wordFound: (word: string) => `${word} found.`,
  noWordThere: "No word there. Select its first letter, then its last.",
  crosswordHelp:
    "Type a letter. Arrow keys move; Space or a second click switches across and down.",
  wordSearchHelp:
    "Drag across a word, or select its first and last letters. Keyboard: Tab to a letter, then Enter.",
  puzzleGrid: "Puzzle grid",
  cellLabel: (row: number, col: number) => `Row ${row}, column ${col}`,
  clueSuffix: (n: number) => `, clue ${n}`,
  findTheseWords: "Find these words",
  found: "found",
  across: "Across",
  down: "Down",
  letterCount: (n: number) => `${n} ${n === 1 ? "letter" : "letters"}`,
  answerLabel: (n: number) => `Answer ${n}`,
  decodeLabel: (c: string, i: number) => `Decode ${c}, position ${i}`,
  cipherMessage: "Encoded message",
  checkPuzzle: "Check puzzle",
  checkLetter: "Check letter",
  checkWord: "Check word",
  revealAnswers: "Reveal answers",
  startAgain: "Start again",
  answersRevealed: "Answers revealed.",
  answersCleared: "Answers cleared.",
  playIdle: "Check your answers whenever you’re ready.",
  playPracticeNote:
    "This link contains the answers, so it’s for practice, not a graded test. Your answers stay on this page.",
  openInMaker: "Open in the maker",

  // Landing pages
  landingHowTo: (type: string) => `How to make a ${type.toLowerCase()}`,
  landingTipsHeading: "Tips",
  landingFaqHeading: "Questions",
  landingMoreHeading: "Other puzzle pages",
  landingSampleLabel: (title: string) => `Sample sheet: ${title}`,

  // 404
  notFoundTitle: "Page not found",
  notFoundBody: "There’s no page at this address.",
  backToMaker: "Go to the maker",

  // About
  aboutTitle: "About Puzzleloom",
  aboutLead:
    "A free, open-source maker for crosswords, word searches, word scrambles and cryptograms. It runs in your browser and prints clean PDFs with answer keys.",
  aboutSampleAlt: "A crossword and its answer key as Puzzleloom prints them",
  aboutPrivacyHeading: "Privacy",
  aboutPrivacy: [
    "There’s no account, database, analytics or upload. Puzzles, PDFs and saved projects are made in your browser. My puzzles uses this browser’s IndexedDB; clearing site data removes those saves, so download a project file if you need a backup.",
    "A play link stores the puzzle and its answers in the part of the URL after #. Browsers don’t send that part to the server, but anyone who has the link can read it. Support links take you to the payment provider’s site.",
  ],
  aboutChecksHeading: "What the engine checks",
  aboutChecks: [
    "Crosswords are one connected grid with no stray adjacent letters. Word searches contain each word exactly once and never spell a blocked word in the fill. Scrambles keep the same letters in a different order. Cryptograms never map a letter to itself.",
    "Some word lists can’t form a connected crossword, for example when a word shares no letters with the others. The engine tries many arrangements and names the words it couldn’t place. Running out of arrangements isn’t a proof that no layout exists, so try adding a linking word.",
  ],
  aboutPrintHeading: "Printing",
  aboutPrint:
    "The preview and the PDF come from the same page layout, so what you see is what prints. Letter and A4, answer keys, class sets and large print are all free. Large grids in XL text may need fewer words to fit the page.",
  aboutCreditsHeading: "Credits and licences",
  aboutCredits: [
    "Puzzleloom is MIT licensed. Young Serif, Atkinson Hyperlegible Next and OpenDyslexic are used under the SIL Open Font License. OpenDyslexic is offered as a font choice; we don’t claim it improves reading.",
    "Example word lists and quotes are our own and released under CC0. The logo, icons and social image are drawn in code. Full credits are in CREDITS.md in the repository.",
  ],
  readTheSource: "Read the source",
  supportLink: "Support Puzzleloom",

  // Agents
  agentsTitle: "Puzzleloom for agents",
  agentsLead:
    "The command-line tool, the local MCP server and this web app run the same deterministic engine. Your assistant brings the words and clues; Puzzleloom lays out the grid, prints the PDF and checks the key. No service, no API key, no built-in LLM.",
  agentsCliHeading: "Make a printable puzzle",
  agentsCli:
    "node packages/cli/bin.mjs make crossword --words words.txt \\\n  --seed 42 --out lesson.puzzleloom.json --pdf lesson.pdf --json\nnode packages/cli/bin.mjs check lesson.puzzleloom.json --json\nnode packages/cli/bin.mjs render lesson.puzzleloom.json --variants 30 --pdf class.pdf\nnode packages/cli/bin.mjs link lesson.puzzleloom.json --json",
  agentsCliNote:
    "Run these from a checkout of the repository. Word files take one word per line, with an optional clue after a colon, a tab or a spaced dash; CSV with word and clue columns works too. Leave out --size and the engine picks the grid size; the result lists any changes it made to your words.",
  agentsMcpHeading: "Connect through MCP",
  agentsMcpBefore: "Run the local stdio server with",
  agentsMcpCommand: "pnpm mcp",
  agentsMcpAfter:
    " from the repository. Tools: create_puzzle, validate_puzzle, render_pdf, render_image, make_play_link, make_book and list_options.",
  agentsHandoffHeading: "Hand a puzzle to a person",
  agentsHandoffBefore: "Project files follow the",
  agentsSchemaLink: "puzzleloom.puzzle/v1 JSON schema",
  agentsHandoffAfter:
    ". Open one in the maker to tweak it, or send a play link; the player has an Open in the maker button. Play links carry the answers and are meant for practice.",
  agentsDeterminismHeading: "Same input, same output",
  agentsDeterminism:
    "The same words, options and seed give the same layout and the same PDF bytes. Errors name the invalid input or the words that couldn’t be placed, and every puzzle can be re-checked before printing.",
  agentsLlmsLink: "Compact reference for agents (llms.txt)",

  // Support
  supportTitle: "Support Puzzleloom",
  supportLead:
    "Every feature is free: answer keys, class sets, large print, all four puzzle types. There’s no paid tier and nothing is locked.",
  supportBody:
    "If Puzzleloom saves you time or money, a contribution pays for upkeep and new puzzle types.",
  supportOnce: "Give once, any amount",
  supportMonthlyHeading: "Or give monthly",
  perMonth: "/ month",
  supportFinePrint:
    "Contributions are optional and don’t unlock anything. Payment happens on Stripe’s site.",
  supportOtherWays:
    "Telling another teacher about it, or reporting a bug on GitHub, helps too.",
  backToMaking: "Back to the maker",
} as const;
