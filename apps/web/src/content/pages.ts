import type { PuzzleType } from "../../../../packages/core/src/index";
import { DEFAULT_WORDS } from "../../../../packages/core/src/index";
type Topic = {
  slug: string;
  shortTitle: string;
  title: string;
  type: PuzzleType;
  intro: string;
  words: string;
  tips: string[];
};
const seasons = {
  christmas:
    "CANDLE: A small light\nRIBBON: Wraps a gift\nWINTER: The cold season\nHOLLY: A plant with red berries\nFROST: Ice on a window\nBELLS: Ringing decorations\nSLEIGH: A snowy ride\nCOOKIE: A sweet treat",
  halloween:
    "PUMPKIN: An orange autumn squash\nCOSTUME: A playful disguise\nLANTERN: A light in the dark\nSPIDER: An eight-legged visitor\nMOON: A light in the night sky\nCANDY: A little sweet\nBROOM: A sweeping tool\nGHOST: A spooky story character",
  thanksgiving:
    "HARVEST: Gathering crops\nFAMILY: People we call home\nTHANKS: A word of gratitude\nAUTUMN: The season of falling leaves\nDINNER: An evening meal\nSHARE: Give some to another\nPIE: A baked dessert\nTABLE: A place to gather",
  school:
    "PENCIL: A writing tool\nLESSON: Something to learn\nFRIEND: Someone to share with\nTEACHER: A guide to learning\nBOOK: A story to open\nCLASS: A learning group\nLUNCH: A midday meal\nRECESS: Time to play",
  party:
    "BALLOON: Floats above the table\nCANDLE: A birthday light\nFRIEND: Someone to celebrate with\nPRESENT: A wrapped surprise\nMUSIC: Sounds for dancing\nCAKE: A celebration dessert\nWISH: A hopeful thought\nPARTY: A happy gathering",
  baby: "CRADLE: A small rocking bed\nBLANKET: A soft warm cover\nRATTLE: A little shaking toy\nSMILE: A happy expression\nFAMILY: A circle of care\nCUDDLE: A close warm hug\nNAP: A little rest\nSTORY: Words before bedtime",
  wedding:
    "BOUQUET: A gathering of flowers\nPROMISE: Words to keep\nDANCE: Steps to music\nTOAST: A few kind words\nRING: A circle to wear\nVOW: A heartfelt promise\nSMILE: A happy expression\nPARTNER: Someone at your side",
};
function topic(
  slug: string,
  shortTitle: string,
  type: PuzzleType,
  intro: string,
  words = DEFAULT_WORDS,
  tips = [
    "Start with 8–12 familiar words, then add a few new ones.",
    "Print one copy and check the reading size before making a class set.",
  ],
): Topic {
  return { slug, shortTitle, title: shortTitle, type, intro, words, tips };
}
export const landingPages: Topic[] = [
  topic(
    "crossword-maker",
    "Crossword maker",
    "crossword",
    "Connect your words into one tidy grid. Add clues for a lesson, an event, or a challenge over a cup of tea.",
  ),
  topic(
    "word-search-maker",
    "Word search maker",
    "word-search",
    "Turn a familiar topic into a satisfying search. Every word appears once, and an answer key makes checking easy.",
  ),
  topic(
    "word-scramble-maker",
    "Word scramble maker",
    "scramble",
    "Give your spelling list a new order. Every scramble uses the original letters, with optional clues or first-letter hints.",
  ),
  topic(
    "cryptogram-maker",
    "Cryptogram maker",
    "cryptogram",
    "Hide a short message behind a letter-substitution code. Give a few letters to start and let curiosity do the rest.",
  ),
  topic(
    "vocabulary-crossword-maker",
    "Vocabulary crosswords",
    "crossword",
    "Move from recognising a word to remembering what it means. Write clues in your own classroom language.",
  ),
  topic(
    "spelling-word-search",
    "Spelling word searches",
    "word-search",
    "Practice noticing the exact order of letters. Keep the grid small for beginning readers and increase it as confidence grows.",
  ),
  topic(
    "large-print-word-search-maker",
    "Large-print puzzles",
    "word-search",
    "Give each letter room to breathe. Use a small grid and the L or XL text setting, then check the printed page.",
    "GARDEN\nFLOWER\nWATER\nEARTH\nLEAF",
    [
      "Choose an 8–12 cell grid and five short words.",
      "Select L or XL text. Dense grids may need fewer words to fit.",
    ],
  ),
  topic(
    "spanish-word-search-maker",
    "Spanish word searches",
    "word-search",
    "Practice Spanish vocabulary with accents and Ñ preserved. Choose the Spanish alphabet under Language & more.",
    "ÁRBOL: Tree\nNIÑO: Child\nPLAYA: Beach\nLUNA: Moon\nLIBRO: Book\nFUEGO: Fire\nCASA: House\nFLOR: Flower",
  ),
  topic(
    "esl-crossword-maker",
    "ESL classroom puzzles",
    "crossword",
    "Pair everyday words with clear, concrete clues. A crossword makes a quiet follow-up to a speaking lesson.",
  ),
  topic(
    "christmas-word-search",
    "Christmas word search",
    "word-search",
    "A few seasonal words for a quiet December afternoon. Make a stack for a classroom or put one at each place at the table.",
    seasons.christmas,
  ),
  topic(
    "halloween-word-search",
    "Halloween word search",
    "word-search",
    "A friendly, not-too-spooky word hunt with pumpkins, costumes, and a little moonlight.",
    seasons.halloween,
  ),
  topic(
    "thanksgiving-word-search",
    "Thanksgiving word search",
    "word-search",
    "A printable pause for gratitude, sharing, and gathering around the table.",
    seasons.thanksgiving,
  ),
  topic(
    "back-to-school-word-search",
    "Back-to-school puzzles",
    "word-search",
    "An easy first-day activity with classroom words. Invite learners to add a favourite subject or a new word.",
    seasons.school,
  ),
  topic(
    "baby-shower-crossword",
    "Baby shower crossword",
    "crossword",
    "A warm little table activity for a new chapter. Add names or family clues to make it personal.",
    seasons.baby,
  ),
  topic(
    "bridal-shower-word-search",
    "Bridal shower word search",
    "word-search",
    "A simple celebration activity with flowers, promises, and room for your own words.",
    seasons.wedding,
  ),
  topic(
    "birthday-word-search",
    "Birthday word search",
    "word-search",
    "Make a birthday puzzle with a few favourite things. Add the guest of honour’s interests to the starter list.",
    seasons.party,
  ),
  topic(
    "word-search-generator",
    "Word search generator",
    "word-search",
    "Choose a size and difficulty, then let the seeded generator arrange every word and check for accidental duplicates.",
  ),
  topic(
    "word-search-printable",
    "Printable word searches",
    "word-search",
    "A clean, black-and-white puzzle made for the printer. Download a vector PDF on Letter or A4, with an answer key if you want one.",
  ),
  topic(
    "crossword-puzzle-maker",
    "Crossword puzzle maker",
    "crossword",
    "Write a list of answers and clues. Puzzleloom searches for a connected layout and tells you if a word cannot be placed.",
  ),
  topic(
    "crossword-maker-with-answer-key",
    "Crosswords with answer keys",
    "crossword",
    "Print the challenge and its solution together, or download separate files. Class sets collect the keys at the back.",
  ),
  topic(
    "printable-crossword-maker",
    "Printable crossword maker",
    "crossword",
    "Make a crossword that looks as good on paper as it does on screen. The preview and PDF use one shared layout.",
  ),
  topic(
    "puzzlemaker",
    "A puzzle for every word list",
    "crossword",
    "One list, four ways to play. Switch between crossword, word search, and scramble without retyping; use a quote for a cryptogram.",
  ),
  topic(
    "word-scramble-generator",
    "Word scramble generator",
    "scramble",
    "Mix up your list with repeatable seeds and clear answer keys. Identical-letter words are flagged because they cannot change order.",
  ),
  topic(
    "puzzle-book-maker",
    "Puzzle book maker",
    "word-search",
    "Collect original puzzles into a printable book using the local CLI. Make a small sample first, then combine puzzles with their keys at the back.",
    DEFAULT_WORDS,
    [
      "Use the CLI book command with a list of project files.",
      "Inspect every page and margin before preparing a commercial book.",
    ],
  ),
  topic(
    "word-search-book-generator",
    "Word search books for makers",
    "word-search",
    "Start a collection with original word lists you have permission to use. Export vectors and class sets without watermarks.",
    DEFAULT_WORDS,
    [
      "Write original word lists and review all clues.",
      "Letter and A4 are supported; custom publishing trim sizes require a separate page-layout step.",
    ],
  ),
];
