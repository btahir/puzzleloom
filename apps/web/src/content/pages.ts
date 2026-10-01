import type { PuzzleType } from "../../../../packages/core/src/index";

export type Topic = {
  slug: string;
  shortTitle: string;
  /** The H1, matched to the keyword. */
  title: string;
  /** The title printed on the starter sheet: the word list's topic, never the page name. */
  sheetTitle: string;
  type: PuzzleType;
  intro: string;
  /** Meta description, 140-160 characters. */
  description: string;
  /** 2-4 short paragraphs of page-specific guidance. */
  body: string[];
  /**
   * Starter content for the maker. For cryptogram pages this is the quote,
   * not a word list.
   */
  words: string;
  /** 4-6 concrete tips. */
  tips: string[];
  /** 3-4 real questions with accurate answers. */
  faq: { q: string; a: string }[];
};

const list = (...lines: string[]) => lines.join("\n");

const seasons = {
  christmas: list(
    "SLEIGH: Pulled by reindeer in the story",
    "CANDLE: Wax with a wick",
    "HOLLY: Evergreen with red berries",
    "WREATH: Ring of greenery on a door",
    "ORNAMENT: Hangs on a tree",
    "STOCKING: Hung by the fireplace",
    "SNOWMAN: Built from rolled balls of snow",
    "RIBBON: Tied around a gift",
    "CAROL: Song sung at this season",
    "TINSEL: Shiny strands for the tree",
    "REINDEER: Antlered animal that pulls a sleigh",
    "GINGERBREAD: Spiced cookie baked in shapes",
  ),
  halloween: list(
    "PUMPKIN: Carved into a jack-o'-lantern",
    "COSTUME: Worn to look like someone else",
    "LANTERN: Case that holds a candle or lamp",
    "SPIDER: Eight legs, spins a web",
    "WITCH: Rides a broomstick in stories",
    "CAULDRON: Big pot for brewing potions",
    "SKELETON: Frame of bones",
    "SCARECROW: Stuffed figure that guards a field",
    "GHOST: Spirit in a spooky story",
    "CANDY: Treat handed out at the door",
    "BROOMSTICK: Flying ride for a witch",
    "COBWEB: Spider silk in a corner",
  ),
  thanksgiving: list(
    "HARVEST: Crops gathered in the fall",
    "CORNUCOPIA: Horn-shaped basket overflowing with food",
    "TURKEY: Bird often roasted for the meal",
    "CRANBERRY: Tart red berry made into sauce",
    "STUFFING: Seasoned bread mixture served with turkey",
    "GRAVY: Sauce made from meat juices",
    "GRATITUDE: Feeling of being thankful",
    "FEAST: Large special meal",
    "AUTUMN: Season when leaves change color",
    "POTATO: Root vegetable that gets mashed",
    "PARADE: Marching show held in some cities",
    "FAMILY: Relatives who gather at the table",
  ),
  school: list(
    "PENCIL: Writes in graphite",
    "NOTEBOOK: Bound pages for notes",
    "BACKPACK: Carries books on your shoulders",
    "LOCKER: Metal cabinet in a hallway",
    "TEACHER: Leads the lesson",
    "HOMEWORK: Practice done after school",
    "RECESS: Break for outdoor play",
    "ERASER: Removes pencil marks",
    "CALENDAR: Shows the days of the month",
    "LIBRARY: Room full of books to borrow",
    "MARKER: Pen with a thick felt tip",
    "SCHEDULE: List of what happens and when",
    "FOLDER: Holds loose papers",
    "CLASSROOM: Room where lessons happen",
  ),
  party: list(
    "BALLOON: Rubber bag filled with air or helium",
    "CANDLE: Blown out after a wish",
    "CAKE: Dessert with frosting",
    "PRESENT: Wrapped gift",
    "STREAMER: Long paper ribbon for decorating",
    "CONFETTI: Tiny bits of colored paper",
    "INVITATION: Card that asks you to come",
    "GUEST: Person who is invited",
    "WISH: Silent hope before the candles go out",
    "BANNER: Long sign hung across a wall",
    "FAVORS: Small gifts guests take home",
    "SURPRISE: Something nobody expected",
  ),
  baby: list(
    "CRADLE: Small bed that rocks",
    "BLANKET: Soft cover for naps",
    "RATTLE: Toy that shakes",
    "DIAPER: Changed several times a day",
    "BOTTLE: Holds milk or formula",
    "STROLLER: Pushed on walks",
    "LULLABY: Song to help a baby sleep",
    "BOOTIES: Tiny knitted shoes",
    "PACIFIER: Soother for a fussy baby",
    "NURSERY: Room set up for the baby",
    "ONESIE: One-piece baby outfit",
    "MOBILE: Hangs over a crib and turns",
    "CRIB: Baby's bed with bars",
  ),
  wedding: list(
    "BOUQUET: Flowers carried by the bride",
    "VEIL: Sheer fabric worn over the face or hair",
    "GOWN: Formal dress",
    "RING: Exchanged during the ceremony",
    "TOAST: Short speech with raised glasses",
    "DANCE: First one is often a slow song",
    "HONEYMOON: Trip taken after the wedding",
    "REGISTRY: List of gifts the couple would like",
    "CEREMONY: The wedding itself",
    "ALTAR: Place where vows are exchanged",
    "BRIDESMAID: Friend who stands beside the bride",
    "CAKE: Tiered dessert that gets cut together",
  ),
};

export const landingPages: Topic[] = [
  {
    slug: "crossword-maker",
    shortTitle: "Crossword maker",
    title: "Crossword maker",
    sheetTitle: "Space and the planets",
    type: "crossword",
    intro:
      "Paste your words and clues and Puzzleloom builds one connected crossword with numbered Across and Down clues. Print it as a Letter or A4 PDF with an answer key.",
    description:
      "Free crossword maker: paste words and clues, get one connected grid with numbered clues, an answer key and a printable Letter or A4 PDF. No account needed.",
    body: [
      "Type one answer per line followed by its clue, for example SATELLITE: Object that circles a planet. A colon, a spaced dash, a tab or a comma all work, and you can paste two columns straight from a spreadsheet. Spaces, hyphens and digits are removed from answers, so ICE CREAM becomes ICECREAM.",
      "Puzzleloom places every word in a single connected grid, or it tells you exactly which words did not fit and why. A word that shares no letters with the rest, such as ZEBRA in a list of ocean words, is named in the message. Add a word that overlaps and try again, or press Reshuffle for a new layout.",
      "A puzzle holds up to 40 entries, and 10 to 20 is a good size for a worksheet. When the preview looks right, download a vector PDF, export PNG or SVG, or copy a play link. Your list stays in your browser until you save it, and saved puzzles can be exported as .puzzleloom.json files.",
    ],
    words: list(
      "PLANET: Body that orbits a star",
      "ORBIT: Curved path around another object",
      "GRAVITY: Force that pulls objects together",
      "COMET: Icy body with a glowing tail",
      "TELESCOPE: Instrument for viewing distant objects",
      "GALAXY: Huge system of stars, such as the Milky Way",
      "ECLIPSE: When one body blocks light from another",
      "ASTRONAUT: Person trained to travel in space",
      "ROCKET: Vehicle launched into space",
      "METEOR: Streak of light as a space rock burns up",
      "SATELLITE: Object that circles Earth or another body",
      "CRATER: Bowl-shaped dent left by an impact",
    ),
    tips: [
      "Write each clue so it points to one answer. For ORBIT, 'Curved path around a planet' works and 'Path' does not.",
      "Mix long and short answers. Words of 7 to 10 letters form the backbone of the grid, and short words fill the gaps between them.",
      "Words with common letters (E, A, R, S, T) cross more easily than words built on Q, X or Z.",
      "Keep clues under about ten words. Very long clues are not clipped, but they push the clue list onto another page.",
      "Turn on the word bank for younger solvers so they can see the answers they are choosing from.",
      "Switch off the Name, Date and Class fields if the crossword is going into a book or newsletter.",
    ],
    faq: [
      {
        q: "Is this crossword maker really free?",
        a: "Yes. There is no account, no watermark and no paid tier. PDF, PNG, SVG and class-set exports are all included, and your word list is not uploaded anywhere.",
      },
      {
        q: "Will every word fit in the grid?",
        a: "Every word is placed in one connected grid, or Puzzleloom lists the words that did not fit and says why. It never drops a word without telling you.",
      },
      {
        q: "How many words can I use?",
        a: "Up to 40 entries per puzzle. Most worksheets work well with 10 to 20 answers.",
      },
      {
        q: "Can I print an answer key?",
        a: "Yes. Choose to append the key after the puzzle, download it as a separate PDF, or leave it out.",
      },
    ],
  },
  {
    slug: "word-search-maker",
    shortTitle: "Word search maker",
    title: "Word search maker",
    sheetTitle: "Under the sea",
    type: "word-search",
    intro:
      "Enter a word list and get a word search with every word hidden exactly once. Choose the grid size and difficulty, then print it with an answer key.",
    description:
      "Free word search maker: type a word list, pick the grid size and difficulty, and print a puzzle with an answer key on Letter or A4. No account, no watermark.",
    body: [
      "Paste your words one per line. Easy hides words left to right and top to bottom. Medium adds diagonals. Hard uses all eight directions, including backwards. Grids run from 8 by 8 up to 30 by 30, and a word bank can be printed under the grid.",
      "Every word appears exactly once. If a word sits inside another word in your list (CAT inside CATALOG), Puzzleloom stops and asks you to remove one, because the shorter word would otherwise show up twice. The filler letters follow the letter mix of your own words, so the grid has no giveaway letters.",
      "Each puzzle gets a short printed ID that encodes its seed. Press Reshuffle for a new arrangement of the same list, or make a class set of up to 40 versions, each with its own answer key.",
    ],
    words: list(
      "DOLPHIN: Smart, playful sea mammal",
      "OCTOPUS: Eight arms and no bones",
      "SEAHORSE: Fish that swims upright",
      "TURTLE: Reptile with a shell",
      "JELLYFISH: Soft, stinging drifter",
      "CORAL: Reefs are built from it",
      "WHALE: Largest animal on Earth",
      "SHARK: Fish with rows of teeth",
      "LOBSTER: Shellfish with two big claws",
      "STARFISH: Sea animal with five arms",
      "CRAB: Walks sideways",
      "SQUID: Ten arms and a pointed body",
    ),
    tips: [
      "Use 8 to 12 words on an 8 by 8 to 12 by 12 grid for early readers, and 20 or more words on a 20 by 20 grid for adults.",
      "Pick Hard for older students. Backwards words are the main difference between Hard and Medium.",
      "Avoid words that contain each other, such as CAT and CATALOG or SEA and SEAHORSE. Puzzleloom will not accept the pair.",
      "Short words (3 or 4 letters) are the hardest to spot in a large grid. Leave them out when you want a quick puzzle.",
      "For a harder sheet, choose Hard so words also run backwards and diagonally, and use a larger grid.",
      "Put a theme or a unit name in the title so the sheet is easy to file later.",
    ],
    faq: [
      {
        q: "Is the word search maker free?",
        a: "Yes. It is free with no account, no ads and no watermark, and every difficulty and export option is available.",
      },
      {
        q: "How many words fit in a word search?",
        a: "Up to 40 words. How many fit comfortably depends on the grid: an 8 by 8 grid suits a handful of short words, and a 30 by 30 grid holds a full list of longer words.",
      },
      {
        q: "Can I make a different version for each student?",
        a: "Yes. A class set makes up to 40 versions of the same list with different arrangements. Each version has its own answer key and printed ID.",
      },
      {
        q: "Are words ever hidden twice by accident?",
        a: "No. Puzzleloom checks that every word appears exactly once, and it rejects word lists where one entry is contained inside another.",
      },
    ],
  },
  {
    slug: "word-scramble-maker",
    shortTitle: "Word scramble maker",
    title: "Word scramble maker",
    sheetTitle: "Spelling words",
    type: "scramble",
    intro:
      "Turn a spelling or vocabulary list into scrambled words with blanks for the answers. Add first-letter hints or your own clues.",
    description:
      "Free word scramble maker: scramble your own spelling or vocabulary list, add first-letter hints or clues, and print the worksheet with an answer key.",
    body: [
      "Each word on your list is scrambled using exactly its own letters, and the scramble is never the same as the original word. A word that cannot be rearranged, such as one repeated letter, is flagged so you can replace it.",
      "Choose a hint style in the options. None gives only the scrambled letters. First letter prints the opening letter of each word. Clue prints the clue you wrote next to each scramble, which turns the sheet into a vocabulary review.",
      "Spelling lists work well because students see the same letters in a new order and have to write the word out. For young students, 6 to 8 words with first-letter hints is a manageable sheet. For older students, use clues and 12 to 15 words.",
    ],
    words: list(
      "BECAUSE: Word that introduces a reason",
      "FRIEND: Someone you know and trust",
      "FAMILY: Parents, children and relatives",
      "ANIMAL: Living thing that is not a plant",
      "JOURNEY: A long trip",
      "MACHINE: Device with moving parts",
      "MINUTE: Sixty seconds",
      "PLANET: Earth is one",
      "WEATHER: Rain, wind and sunshine",
      "BRIGHT: Giving off a lot of light",
      "CAPTAIN: Leader of a ship or team",
      "THOUGHT: An idea in your mind",
    ),
    tips: [
      "Choose words of 5 to 8 letters. Three-letter words have too few arrangements to be a puzzle.",
      "Use first-letter hints for beginners. The first letter removes most of the guessing.",
      "Use the Clue hint when the list is vocabulary, so students connect the word to its meaning.",
      "Print the answer key separately so you can mark a stack of sheets quickly.",
      "Check the preview for scrambles that accidentally look like another real word, and reshuffle if you want a different set.",
    ],
    faq: [
      {
        q: "Can I add hints to the scrambled words?",
        a: "Yes. The hint option can show nothing, the first letter of each word, or the clue you wrote for it.",
      },
      {
        q: "Will a scramble ever match the original word?",
        a: "No. A scramble always uses the same letters but never equals the original. If a word cannot be rearranged, Puzzleloom tells you.",
      },
      {
        q: "Can I print an answer key?",
        a: "Yes. The key can be added after the worksheet, saved as a separate PDF, or left out.",
      },
      {
        q: "Is it free to use in my classroom?",
        a: "Yes. There is no account and no watermark, and your word list never leaves your browser.",
      },
    ],
  },
  {
    slug: "cryptogram-maker",
    shortTitle: "Cryptogram maker",
    title: "Cryptogram maker",
    sheetTitle: "Secret message",
    type: "cryptogram",
    intro:
      "Type a quote or sentence and Puzzleloom encodes it with a letter-substitution cipher. Reveal a few starting letters, then print the puzzle with its solution.",
    description:
      "Free cryptogram maker: encode your own quote or sentence with a substitution cipher, give 0 to 8 starter letters, and print the puzzle with an answer key.",
    body: [
      "A cryptogram replaces every letter in a sentence with a different letter. The same letter always maps to the same substitute, and no letter maps to itself. Spaces and punctuation stay where they are, which is the main clue for the solver.",
      "Cryptograms use the quote box instead of the word list. Type any sentence up to 600 characters. Sentences of 8 to 15 words work well, because they contain enough repeated letters and short words (A, I, THE) for a solver to find patterns.",
      "Use the given-letters option to reveal between 0 and 8 letters of the cipher. Two or three given letters make a classroom puzzle fair, and zero is for experienced solvers. Press Reshuffle for a new cipher on the same sentence.",
    ],
    words:
      "Every good plan starts with one clear first step, and a second step follows.",
    tips: [
      "Write your own sentence or use a proverb that is in the public domain. Do not paste a copyrighted quotation into a book you plan to sell.",
      "Short words such as A, I and THE are the way into most cryptograms. Make sure the sentence has a few.",
      "Avoid sentences with only a handful of different letters. They have too few patterns to solve by reasoning.",
      "Start with 3 given letters for students new to cryptograms and drop to 0 as they improve.",
      "Include the author or source in the instructions if the sentence is a quotation, so students can check it.",
    ],
    faq: [
      {
        q: "What is a cryptogram?",
        a: "A cryptogram is a sentence encoded with a substitution cipher. The solver works out which letter stands for which, using word length, spacing and common letter patterns.",
      },
      {
        q: "Can I give the solver some letters?",
        a: "Yes. The given-letters option reveals between 0 and 8 letters of the cipher before the solver starts.",
      },
      {
        q: "Can I print the solution?",
        a: "Yes. Append the key after the puzzle, save it as a separate PDF, or leave it out.",
      },
      {
        q: "Does it keep punctuation?",
        a: "Yes. Spaces and punctuation are unchanged, and only the letters are substituted.",
      },
    ],
  },
  {
    slug: "vocabulary-crossword-maker",
    shortTitle: "Vocabulary crosswords",
    title: "Vocabulary crossword maker",
    sheetTitle: "Vocabulary review",
    type: "crossword",
    intro:
      "Use your unit's vocabulary as answers and its definitions as clues. Puzzleloom builds the grid and prints a class set where every student gets a different arrangement.",
    description:
      "Free vocabulary crossword maker: use definitions as clues, build the grid in seconds, and print an answer key or a class set with a different grid per student.",
    body: [
      "The clue is the learning. A definition clue asks students to recall meaning, and a sentence clue with a blank (The ___ student finished every page) asks them to use the word in context. Mix both kinds in one puzzle.",
      "Write the clue without using the answer or its root. For DILIGENT, 'Showing steady, careful effort' works, and 'Having diligence' gives the answer away. Keep each clue short enough to read at a glance.",
      "A class set makes up to 40 versions of the same crossword, each with a different grid, its own answer key and a printed ID. Students sitting next to each other cannot copy squares, and you can match any sheet to its key by ID. The play link is a good option for Chromebooks, but it contains the answers, so use it for practice and not for tests.",
    ],
    words: list(
      "ABUNDANT: Present in large amounts",
      "CAUTIOUS: Careful to avoid danger or mistakes",
      "DILIGENT: Showing steady, careful effort",
      "RELUCTANT: Unwilling and hesitant",
      "INFER: Reach a conclusion from evidence",
      "EVIDENCE: Facts that support a claim",
      "CONTRAST: Show how two things differ",
      "HYPOTHESIS: Testable explanation for a result",
      "PERSUADE: Convince someone with reasons",
      "SUMMARIZE: Tell the main points briefly",
      "ADAPT: Change to fit new conditions",
      "CONCLUDE: Bring to an end, or decide",
    ),
    tips: [
      "Use 10 to 15 words per puzzle. A shorter list leaves a sparse grid and a longer one needs more than a page for clues.",
      "Put a word and its definition in one line, WORD: definition, so you can paste straight from your unit list.",
      "Include a few words that share letters. Puzzleloom reports any word it cannot connect to the rest.",
      "Do not use the word, or a form of it, in its own clue.",
      "Save the puzzle in the browser or export a .puzzleloom.json file, so you can reuse it next year.",
    ],
    faq: [
      {
        q: "Can I use definitions as clues?",
        a: "Yes. Write each line as WORD: definition and the definition becomes the clue.",
      },
      {
        q: "Can I make a different version for each student?",
        a: "Yes. A class set makes 1 to 40 versions. Each has a different grid, its own answer key and a printed ID.",
      },
      {
        q: "Can students solve it on a Chromebook?",
        a: "Yes, through a play link. The link holds the puzzle and its answers, so it suits practice, not assessment.",
      },
      {
        q: "Does it cost anything?",
        a: "No. It is free with no account and no watermark, and your word list stays in your browser.",
      },
    ],
  },
  {
    slug: "spelling-word-search",
    shortTitle: "Spelling word searches",
    title: "Spelling word search maker",
    sheetTitle: "Long A spelling words",
    type: "word-search",
    intro:
      "Turn this week's spelling list into a word search. Choose Easy for early readers or Hard for backwards words, then print the sheet with a word bank.",
    description:
      "Free spelling word search maker: type this week's spelling list, choose a grid size and difficulty, and print a worksheet with a word bank and answer key.",
    body: [
      "A word search gives students a second look at a spelling list. They scan for the exact letter order of each word, so it works best for recognition, and a scramble or crossword is better for recall.",
      "Match difficulty to the class. Easy hides words left to right and top to bottom only, which suits kindergarten through second grade. Medium adds diagonals. Hard adds all eight directions, including backwards, and suits upper elementary and above. A grid of 8 by 8 to 10 by 10 holds 6 to 10 short words.",
      "Group words by pattern and say so in the title. The word list on this page uses long-a spellings (TRAIN, PLATE, SPRAY). Avoid pairs where one word is inside another, such as RAIN and TRAIN, because Puzzleloom will not accept them in the same puzzle.",
    ],
    words: list(
      "TRAIN: Runs on tracks",
      "PLATE: Dish for food",
      "BRAID: Three strands woven together",
      "SNAIL: Slow animal with a shell",
      "GRAPE: Small fruit that grows in bunches",
      "SKATE: Glide on ice or pavement",
      "PAINT: Color put on with a brush",
      "TRAY: Flat carrier for dishes",
      "CHAIN: Row of linked rings",
      "STAIR: One step in a staircase",
      "SPRAY: Fine mist of water",
      "CRATE: Wooden box for shipping",
    ),
    tips: [
      "Use the whole weekly list so the search doubles as a review, but cap it at 10 words for grades K to 2.",
      "Turn on the word bank for beginners so they can check spelling against the list.",
      "Use Easy for early readers. Backwards words are frustrating before students read fluently.",
      "Make a class set so each student has a different arrangement of the same list.",
      "Choose OpenDyslexic font in the options for students who prefer it, and check with each student.",
      "Put the spelling pattern in the title, for example Long A: ai, a_e and ay, so the sheet doubles as a reference.",
    ],
    faq: [
      {
        q: "How many spelling words should I use?",
        a: "For grades K to 2, 6 to 10 words on an 8 by 8 to 10 by 10 grid. For older students, up to 15 or 20 words on a larger grid.",
      },
      {
        q: "Can I print an answer key?",
        a: "Yes. The key shows where each word is hidden. Append it, save it separately, or leave it out.",
      },
      {
        q: "Can each student get a different version?",
        a: "Yes. A class set makes up to 40 versions, each with its own answer key and printed ID.",
      },
      {
        q: "Is it free?",
        a: "Yes. There is no account and no watermark, and your list is not uploaded.",
      },
    ],
  },
  {
    slug: "large-print-word-search-maker",
    shortTitle: "Large-print puzzles",
    title: "Large print word search maker",
    sheetTitle: "In the garden",
    type: "word-search",
    intro:
      "Make a word search with big letters and a small grid. Choose the L or XL text size and print the vector PDF on Letter or A4.",
    description:
      "Free large print word search maker: pick a small grid, L or XL text, and print a clear black-and-white PDF on Letter or A4. No account, no watermark.",
    body: [
      "Large print starts with the grid. A 10 by 10 grid on one page leaves room for big letters, and a 20 by 20 grid does not. Choose a grid of 8 by 8 to 12 by 12 and 5 to 10 words, then set the text size to L or XL.",
      "Large-print guidelines commonly call for 16 to 18 point type or larger. Puzzleloom offers S, M, L and XL, so print one page at XL and check it against your reader. The PDF is vector, so letters stay sharp at any size, and the sheet is pure black on white.",
      "Use Easy difficulty, where words run left to right and top to bottom, so there are fewer directions to scan. Choose the OpenDyslexic font option if your reader prefers it. In the print dialog, set scale to 100 percent so the type is not shrunk to fit.",
    ],
    words: list(
      "GARDEN: A place to grow plants",
      "FLOWER: Bloom with petals",
      "WATER: Plants need it to grow",
      "EARTH: Soil beneath our feet",
      "LEAF: Green part of a plant",
      "SEED: Grows into a plant",
      "ROOT: Holds a plant in the soil",
      "STEM: Holds up a flower",
      "GRASS: Green lawn cover",
      "RAIN: Falls from the clouds",
    ),
    tips: [
      "Use a grid of 8 by 8 to 12 by 12. Bigger grids force the letters to be smaller on a single page.",
      "Choose words of 4 to 7 letters. Long words stretch across the grid and are harder to track with low vision.",
      "Print the first copy at 100 percent scale and check it against your reader. Adjust the text size if needed.",
      "Use Easy difficulty. Words run only left to right and top to bottom, so there are fewer directions to scan.",
      "Print on plain white paper. The sheet is black on white, and colored paper lowers the contrast.",
      "Check the answer key at the same text size, because the key uses the same grid.",
    ],
    faq: [
      {
        q: "What text size should I use for large print?",
        a: "Start with XL on a 10 by 10 grid, print one page, and check it with your reader. Use L if you need more words on the page.",
      },
      {
        q: "Why do fewer words fit at large sizes?",
        a: "Big letters take more room, so the grid has to be smaller. Use a smaller grid and a shorter word list.",
      },
      {
        q: "Does it have a dyslexia-friendly font?",
        a: "There is an OpenDyslexic font option. Some readers prefer it, so ask the person who will use the sheet.",
      },
      {
        q: "Is it free to print?",
        a: "Yes. It is free with no account and no watermark. The PDF is vector, on Letter or A4.",
      },
    ],
  },
  {
    slug: "spanish-word-search-maker",
    shortTitle: "Spanish word searches",
    title: "Spanish word search maker",
    sheetTitle: "Palabras en español",
    type: "word-search",
    intro:
      "Make a word search for Spanish vocabulary with accents and the letter Ñ kept. Pick Spanish under Language & more, or strip accents if your students do not use them.",
    description:
      "Free Spanish word search maker: keep accents and Ñ, or strip accents for easier searching. Add English clues, then print an answer key on Letter or A4.",
    body: [
      "Choose Spanish under Language & more so the alphabet is set correctly. Accented letters (Á, É, Í, Ó, Ú, Ü) and Ñ are kept as they are typed, so ÁRBOL and NIÑO print as written. French, German, Portuguese, Italian and Dutch are available in the same menu.",
      "Strip accents is an option for puzzles where students are not expected to look for marks. It turns ÁRBOL into ARBOL and NIÑO into NINO. Check the list afterward, because two words that differ only by an accent or a tilde become the same word (AÑO and ANO) and one of them is removed as a duplicate.",
      "Type accents with your keyboard layout. On a Mac, hold the vowel key and choose the accent, or press Option-E then the vowel; for Ñ press Option-N then N. On Windows, add the US-International layout or the Spanish keyboard. Clues can be in English for learners or in Spanish for advanced students.",
    ],
    words: list(
      "ÁRBOL: Tree",
      "NIÑO: Child",
      "PLAYA: Beach",
      "LUNA: Moon",
      "LIBRO: Book",
      "FUEGO: Fire",
      "CASA: House",
      "FLOR: Flower",
      "MONTAÑA: Mountain",
      "CORAZÓN: Heart",
      "CANCIÓN: Song",
      "JARDÍN: Garden",
    ),
    tips: [
      "Keep accents on for spelling practice. Strip them when the goal is vocabulary recognition.",
      "After stripping accents, scan the list for pairs such as AÑO and ANO that collapse into one word.",
      "Write clues in English for beginners and in Spanish for intermediate students.",
      "Use Medium difficulty for Spanish classes with new readers. Diagonals add challenge without backwards reading.",
      "Make a class set of up to 40 versions so each student has a different grid and answer key.",
    ],
    faq: [
      {
        q: "Does it keep accents and the letter Ñ?",
        a: "Yes. Accented letters and Ñ are preserved by default. The bundled print fonts cover the Spanish alphabet.",
      },
      {
        q: "Can I remove accents?",
        a: "Yes. Turn on Strip accents and ÁRBOL becomes ARBOL. Check for words that collapse into the same spelling.",
      },
      {
        q: "Can I make word searches in other languages?",
        a: "Yes. Alphabets for English, Spanish, French, German, Portuguese, Italian and Dutch are available. Other scripts are not supported.",
      },
      {
        q: "Is it free?",
        a: "Yes. There is no account and no watermark, and your word list stays in your browser.",
      },
    ],
  },
  {
    slug: "esl-crossword-maker",
    shortTitle: "ESL classroom puzzles",
    title: "ESL crossword maker",
    sheetTitle: "Everyday English",
    type: "crossword",
    intro:
      "Build a crossword from your lesson vocabulary with short, concrete clues. Print it for a class and give each student a different version.",
    description:
      "Free ESL crossword maker: write simple, concrete clues for your lesson vocabulary, build the grid, and print a class set with answer keys. No account needed.",
    body: [
      "Clue writing is the whole job in an ESL crossword. Use words your students already know to define the new word. For UMBRELLA, 'Keeps you dry in the rain' is better than a dictionary definition, because every word in the clue is already familiar.",
      "Use three clue types. Definitions ('Room where food is cooked'). Gap-fill sentences ('I brush my teeth after ___.'). Examples ('Bus, train, car: types of ___'). Avoid idioms, passive voice and clues that need cultural knowledge.",
      "For lower levels, turn on the word bank so students can choose from the answers. For higher levels, leave it off. A class set gives each student a different arrangement of the same words, so they work on their own grids, and the keys can be a separate PDF. For solo practice, send a play link, which suits practice but contains the answers.",
    ],
    words: list(
      "BREAKFAST: First meal of the day",
      "UMBRELLA: Keeps you dry in the rain",
      "KITCHEN: Room where food is cooked",
      "PASSPORT: Document you show at the airport",
      "PHARMACY: Store that sells medicine",
      "TICKET: Paper that lets you enter or ride",
      "SCHEDULE: List of times and plans",
      "NEIGHBOR: Person who lives next door",
      "LUGGAGE: Bags you take on a trip",
      "RECEIPT: Paper that shows what you paid",
      "ELEVATOR: Lifts people between floors",
      "SANDWICH: Filling between two slices of bread",
    ),
    tips: [
      "Use words from the clue that students already know. A clue they cannot read teaches nothing.",
      "Prefer concrete nouns that students can picture over abstract words.",
      "Do not use the answer or a form of it in the clue.",
      "Use 8 to 12 words for beginners and up to 20 for intermediate students.",
      "Include a mix of clue types: definition, gap-fill and example.",
      "Check that the words share letters. Puzzleloom names any word it cannot connect to the grid.",
    ],
    faq: [
      {
        q: "What makes a good ESL crossword clue?",
        a: "Short, concrete and written with vocabulary the students already know. Definitions, gap-fill sentences and examples all work.",
      },
      {
        q: "Can I make one for another language?",
        a: "Yes, for Latin-alphabet languages: English, Spanish, French, German, Portuguese, Italian and Dutch. Other scripts are not supported.",
      },
      {
        q: "Can each student get a different version?",
        a: "Yes. A class set makes up to 40 versions with different grids. Each has its own key and printed ID.",
      },
      {
        q: "Is it free?",
        a: "Yes. There is no account and no watermark, and nothing you type is uploaded.",
      },
    ],
  },
  {
    slug: "christmas-word-search",
    shortTitle: "Christmas word search",
    title: "Christmas word search",
    sheetTitle: "Christmas word search",
    type: "word-search",
    intro:
      "A ready Christmas word list you can print as-is or change. Add your own words, choose a difficulty and make a class set.",
    description:
      "Free printable Christmas word search maker: start with 12 seasonal words, add your own, choose the difficulty and print with an answer key on Letter or A4.",
    body: [
      "The starter list has 12 seasonal words, from SLEIGH and WREATH to GINGERBREAD. Use it as it is, or replace words with your own: family names, a class theme or a winter-break reading list.",
      "For young children, choose Easy and an 8 by 8 to 10 by 10 grid with 8 words. For older children and adults, choose Hard so words also run diagonally and backwards, and increase the grid to 15 by 15 or larger.",
      "A class set makes up to 40 versions of the same list, each with a different arrangement, its own answer key and a printed ID. The sheet prints in plain black and white, which is easy on classroom toner. You can add a word bank so younger children know what to look for.",
    ],
    words: seasons.christmas,
    tips: [
      "Use 8 words on a 10 by 10 grid for children under 8. Use all 12 on a 15 by 15 grid for older children.",
      "Add the names of your class or family. Names of 4 or more letters make good words.",
      "Do not include a word that sits inside another word. Puzzleloom will not accept the pair.",
      "Print the word bank for a party game so guests can cross words off.",
      "Set a short title such as Winter Word Hunt, and keep the Name and Date fields for classroom use.",
    ],
    faq: [
      {
        q: "Can I add my own words?",
        a: "Yes. Change, remove or add to the starter list. A puzzle can hold up to 40 words.",
      },
      {
        q: "Can I print it in black and white?",
        a: "Yes. The sheet is pure black on white with nothing that relies on color.",
      },
      {
        q: "Can I print many versions?",
        a: "Yes. A class set of up to 40 versions with different arrangements, each with its own key.",
      },
      {
        q: "Is it free?",
        a: "Yes. No account, no ads and no watermark.",
      },
    ],
  },
  {
    slug: "halloween-word-search",
    shortTitle: "Halloween word search",
    title: "Halloween word search",
    sheetTitle: "Halloween word search",
    type: "word-search",
    intro:
      "A Halloween word list that is spooky but suitable for the classroom. Edit the words, choose a difficulty and print one for each guest or student.",
    description:
      "Free printable Halloween word search maker: 12 classroom-friendly words, your own additions, three difficulty levels and an answer key on Letter or A4.",
    body: [
      "The starter list has 12 words, from PUMPKIN and COSTUME to COBWEB and SCARECROW. It stays away from anything gory, so it suits an elementary classroom party.",
      "Easy places words left to right and top to bottom, which works for early readers. Hard includes diagonals and backwards words, and suits a party game where guests race to finish. A 12 by 12 grid is a good starting size for all 12 words.",
      "Print one per child or make a class set with a different arrangement for each. Each sheet has a printed ID, and each version has its own answer key. If you need to send puzzles home, copy a play link instead of a PDF; it contains the answers, so it is meant for fun, not tests.",
    ],
    words: seasons.halloween,
    tips: [
      "Use 8 words on a 10 by 10 grid for first and second graders.",
      "Add a few words from your own class: a book character, a school mascot or a student's favorite costume.",
      "Avoid pairs where one word is inside another, such as WEB and COBWEB.",
      "Use Hard and a 15 by 15 grid for a party game with a prize for the first finisher.",
      "Turn off the Name and Date fields if you are printing for a party.",
    ],
    faq: [
      {
        q: "Is this suitable for young children?",
        a: "The starter list is mild. You can edit any word you do not want.",
      },
      {
        q: "Can I change the words?",
        a: "Yes. Replace any of the 12 words or add up to 40.",
      },
      {
        q: "Can I print an answer key?",
        a: "Yes. The key can be appended, saved as a separate PDF or left out.",
      },
      {
        q: "Is it free?",
        a: "Yes. There is no account, no ads and no watermark.",
      },
    ],
  },
  {
    slug: "thanksgiving-word-search",
    shortTitle: "Thanksgiving word search",
    title: "Thanksgiving word search",
    sheetTitle: "Thanksgiving word search",
    type: "word-search",
    intro:
      "A Thanksgiving word list you can print as it is, or edit with your own table words. Pick the grid size and difficulty and print for a class or a family dinner.",
    description:
      "Free printable Thanksgiving word search maker: start with 12 holiday words, add your own, choose the difficulty and print with an answer key on Letter or A4.",
    body: [
      "The starter list has 12 words, from HARVEST and CORNUCOPIA to CRANBERRY and GRATITUDE. Replace any word with a dish your family makes, a name, or a word from your class.",
      "For children who are just learning to read, choose Easy with 8 words on a 10 by 10 grid. For a family table with mixed ages, choose Medium and a 15 by 15 grid. For adults, choose Hard.",
      "Make a different version for each person at the table with a class set of up to 40 versions, so nobody can copy a neighbor. Each version has its own answer key and printed ID. The sheet prints in black and white, and the PDF works on Letter or A4.",
    ],
    words: seasons.thanksgiving,
    tips: [
      "Write the family's own dishes into the list: a specific pie or a relative's recipe makes it personal.",
      "Use 8 words on a 10 by 10 grid for kindergarten through second grade.",
      "Include GRATITUDE and FAMILY if you plan a discussion afterward.",
      "Use a class set for a classroom, so each student has a different grid.",
      "Print a few extra for guests who arrive late.",
    ],
    faq: [
      {
        q: "Can I use my own words?",
        a: "Yes. Replace any of the starter words, or add your own. Up to 40 words per puzzle.",
      },
      {
        q: "Does it come with an answer key?",
        a: "Yes. The key is optional. Append it, save it separately or leave it out.",
      },
      {
        q: "Which paper sizes are supported?",
        a: "US Letter and A4, as a vector PDF.",
      },
      {
        q: "Is it free?",
        a: "Yes. No account, no ads and no watermark.",
      },
    ],
  },
  {
    slug: "back-to-school-word-search",
    shortTitle: "Back-to-school puzzles",
    title: "Back-to-school word search",
    sheetTitle: "Back to school",
    type: "word-search",
    intro:
      "A first-week word search with classroom words you can edit. Add your school's mascot and your own routines, and print a class set.",
    description:
      "Free back-to-school word search maker: 14 classroom words, your own additions, a class set with different grids and an answer key. Letter or A4 PDF, no account.",
    body: [
      "The starter list has 14 school words, from PENCIL and LOCKER to SCHEDULE and CLASSROOM. Replace any word with your teacher's name, the mascot or a classroom rule, so the first-day sheet is specific to your school.",
      "Use it as an early-finisher or a sub plan. Choose Easy for primary grades and Hard for middle school. A 12 by 12 grid is a good starting size for all 14 words. Print a word bank for younger students.",
      "A class set makes up to 40 versions, so each student has a different arrangement. Each has its own answer key and a printed ID, so you can check sheets quickly. The Name, Date and Class fields are on by default, and you can switch them off.",
    ],
    words: seasons.school,
    tips: [
      "Add the names of your class rules or specials teachers to make it relevant for the first week.",
      "Use 8 words on a 10 by 10 grid for kindergarten and first grade.",
      "Use Hard for middle school, where backwards words keep students busy.",
      "Leave the Name, Date and Class fields on so each sheet can be handed back.",
      "Save the puzzle in your browser so you can edit it next August.",
    ],
    faq: [
      {
        q: "Can I use it as a sub plan?",
        a: "Yes. Print a class set with the answer keys kept separate, and leave the stack for the sub.",
      },
      {
        q: "Can I add my own words?",
        a: "Yes. Edit any word or add up to 40.",
      },
      {
        q: "Can each student get a different puzzle?",
        a: "Yes. Make a class set of up to 40 versions with different arrangements.",
      },
      {
        q: "Is it free?",
        a: "Yes. There is no account and no watermark, and nothing is uploaded.",
      },
    ],
  },
  {
    slug: "baby-shower-crossword",
    shortTitle: "Baby shower crossword",
    title: "Baby shower crossword",
    sheetTitle: "Baby shower crossword",
    type: "crossword",
    intro:
      "A baby shower crossword you can personalize with clues about the parents. Print one for each guest, with an answer key for the host.",
    description:
      "Free baby shower crossword maker: start with 13 baby words, add clues about the parents, print one per guest with an answer key on Letter or A4. No account.",
    body: [
      "The starter list has 13 baby words, from CRADLE and RATTLE to LULLABY and PACIFIER. The easiest way to make it personal is to change the clues. 'Where the parents met' or 'The mom-to-be's favorite snack' makes guests think, and the answers can be names, places or foods.",
      "A crossword needs words that share letters, so keep a mix of longer words (7 to 9 letters) and shorter ones. If a word cannot connect, Puzzleloom tells you which one and why, so you can swap it. Press Reshuffle until the grid looks balanced.",
      "Make a class set to print a different version for each guest, so nobody at the table can compare grids. Keep the answer key as a separate PDF for the host. Use the title and instructions fields to add the parents' names and the date.",
    ],
    words: seasons.baby,
    tips: [
      "Include 2 or 3 personal clues, such as a family name or a place. Everything else can be a plain baby word.",
      "Keep the grid to 10 to 15 words. A longer crossword is hard to finish at a party.",
      "Add a title such as Baby Shower Crossword for Priya and Sam.",
      "Print an extra copy or two for guests who spill something.",
      "Use the separate answer key PDF as the host's reference, and use it to check winners.",
    ],
    faq: [
      {
        q: "Can I add personal clues?",
        a: "Yes. Write any clue you like. Names and places work as answers.",
      },
      {
        q: "Can I make a different version for each guest?",
        a: "Yes. Make a class set of up to 40 versions, each with its own grid, key and ID.",
      },
      {
        q: "Can guests do it on their phones?",
        a: "Yes, with a play link. It contains the answers, so use paper if there is a prize.",
      },
      {
        q: "Is it free?",
        a: "Yes. There is no account and no watermark.",
      },
    ],
  },
  {
    slug: "bridal-shower-word-search",
    shortTitle: "Bridal shower word search",
    title: "Bridal shower word search",
    sheetTitle: "Bridal shower word search",
    type: "word-search",
    intro:
      "A bridal shower word search with wedding words and room for the couple's own. Print one per guest with a different arrangement and an answer key for the host.",
    description:
      "Free bridal shower word search maker: 12 wedding words, add the couple's names and places, and print one per guest with an answer key. Letter or A4, no account.",
    body: [
      "The starter list has 12 wedding words, from BOUQUET and VEIL to HONEYMOON and REGISTRY. Add the couple's first names, the venue town, or the honeymoon destination to make it personal. Spaces are removed from words, so write NEW ORLEANS and the puzzle hides NEWORLEANS.",
      "For a game with prizes, choose Hard with a 15 by 15 or larger grid so words also run backwards. For a relaxed table activity, choose Easy and a 10 by 10 grid. Print a word bank so guests can cross words off.",
      "A class set makes a different version for each guest, up to 40, and each has its own answer key and printed ID. The host can check a winner by ID. Print on cardstock if you want a keepsake.",
    ],
    words: seasons.wedding,
    tips: [
      "Add the couple's names (4 or more letters) and the venue city.",
      "Use Hard and a timer for a game. Use Easy for a relaxed table activity.",
      "Avoid pairs where one word is inside another, such as RING and SPRING.",
      "Keep the host's answer key as a separate PDF.",
      "Turn off the Name and Date fields. Guests do not need them.",
    ],
    faq: [
      {
        q: "Can I add the couple's names?",
        a: "Yes. Any name of 2 or more letters works. Spaces and punctuation are removed.",
      },
      {
        q: "Can I use it as a game with prizes?",
        a: "Yes. Use Hard difficulty, a larger grid and a printed ID so the host can check the key.",
      },
      {
        q: "Can I print an answer key?",
        a: "Yes. Append it, save it separately or leave it out.",
      },
      {
        q: "Is it free?",
        a: "Yes. No account, no ads and no watermark.",
      },
    ],
  },
  {
    slug: "birthday-word-search",
    shortTitle: "Birthday word search",
    title: "Birthday word search",
    sheetTitle: "Birthday word search",
    type: "word-search",
    intro:
      "A birthday word search with party words and room for the guest of honor's own. Pick a difficulty for the age group and print one per guest.",
    description:
      "Free birthday word search maker: 12 party words, add the guest of honor's name and interests, and print one per guest with an answer key on Letter or A4.",
    body: [
      "The starter list has 12 party words, from BALLOON and CONFETTI to INVITATION and SURPRISE. Add the guest of honor's name, age spelled out, hobbies, pets and favorite foods. A puzzle with 4 or 5 personal words feels made for the person.",
      "Match difficulty to the age. For young children, choose Easy, 6 to 8 words and a 10 by 10 grid. For teens and adults, choose Hard and a larger grid. The word bank prints under the grid, so younger children can cross words off as they find them.",
      "A class set makes up to 40 versions, each with a different arrangement and its own answer key. At a party, give each guest a different version and a pencil. The sheet is plain black and white, so it prints cleanly on an ordinary printer.",
    ],
    words: seasons.party,
    tips: [
      "Add the guest of honor's name if it has 4 or more letters, and write the age as a word (SEVEN).",
      "Use 8 words and Easy for children under 8.",
      "Keep personal words short so they fit on small grids.",
      "Avoid pairs where one word is inside another, such as GAME and GAMES.",
      "Print a few extras for guests who lose a pencil or a sheet.",
    ],
    faq: [
      {
        q: "Can I add the birthday child's name?",
        a: "Yes. Names of 2 or more letters work. Spaces and punctuation are removed.",
      },
      {
        q: "What difficulty should I choose?",
        a: "Easy for young children, Medium for older children and Hard for teens and adults.",
      },
      {
        q: "Can each guest get a different version?",
        a: "Yes. A class set of up to 40 versions, each with its own key and ID.",
      },
      {
        q: "Is it free?",
        a: "Yes. No account, no ads and no watermark.",
      },
    ],
  },
  {
    slug: "word-search-generator",
    shortTitle: "Word search generator",
    title: "Word search generator",
    sheetTitle: "Weather words",
    type: "word-search",
    intro:
      "Generate a word search from any list in seconds. Set the grid size, difficulty and seed, and get the same puzzle again whenever you need it.",
    description:
      "Free word search generator: paste a word list, set grid size (8 to 30) and difficulty, and generate a repeatable puzzle with an answer key. No account needed.",
    body: [
      "Paste or type your words, then set the size from 8 by 8 to 30 by 30. Difficulty controls direction: Easy is right and down, Medium adds diagonals, and Hard allows all eight directions, including backwards.",
      "Every puzzle is built from a seed. The seed is encoded in the short ID printed on the sheet, so the same list, options and seed always give the same grid. Press Reshuffle for a new seed. Save the puzzle in your browser or export a .puzzleloom.json file to reopen it later.",
      "The generator checks its own work. Each word appears exactly once, no second copy appears by accident, and the filler letters are drawn from the letters in your list. A small blocklist stops the filler from spelling offensive words. Leave the size on automatic to let Puzzleloom pick a grid that fits your list.",
    ],
    words: list(
      "THUNDER: Rumble that follows lightning",
      "LIGHTNING: Flash of electricity in the sky",
      "BREEZE: Light, gentle wind",
      "HURRICANE: Huge tropical storm",
      "DRIZZLE: Very light rain",
      "BLIZZARD: Heavy snowstorm with strong wind",
      "FORECAST: Prediction of tomorrow's weather",
      "HUMID: Damp and sticky air",
      "CLOUD: Mass of water droplets in the sky",
      "RAINBOW: Arc of colors after rain",
      "TORNADO: Spinning funnel of wind",
      "FROST: Ice crystals on a cold morning",
    ),
    tips: [
      "Use a larger grid than you think you need if the list has long words. A 12-letter word needs at least a 12 by 12 grid.",
      "Use a fixed seed or save the puzzle when you want to print the same grid again later.",
      "Press Reshuffle several times and keep the layout with the best spread of words.",
      "Switch to Hard for puzzles that are meant to be a challenge.",
      "Download PNG or SVG when you want to place the puzzle in a slide or a document.",
    ],
    faq: [
      {
        q: "Will the same list always give the same puzzle?",
        a: "Yes, with the same options and seed. The seed is encoded in the printed puzzle ID.",
      },
      {
        q: "What is the largest grid?",
        a: "30 by 30. The smallest is 8 by 8.",
      },
      {
        q: "Can I export the puzzle as an image?",
        a: "Yes. Export PNG or SVG, or download a vector PDF on Letter or A4.",
      },
      {
        q: "Can an AI assistant generate puzzles?",
        a: "Yes. A command-line tool and a local MCP server run the same engine, so an assistant can write the clues and Puzzleloom builds the valid grid.",
      },
    ],
  },
  {
    slug: "word-search-printable",
    shortTitle: "Printable word searches",
    title: "Printable word search maker",
    sheetTitle: "Sports",
    type: "word-search",
    intro:
      "Make a word search that prints cleanly on a home or school printer. Download a black-and-white vector PDF on Letter or A4 with an optional answer key.",
    description:
      "Make a printable word search: download a crisp black-and-white vector PDF on US Letter or A4, with an optional answer key. Free, with no account or watermark.",
    body: [
      "The PDF is vector, so letters stay sharp at any print size. It is pure black on white, which copies cleanly on a school photocopier. Choose Letter for the US and Canada or A4 for the rest of the world.",
      "The preview is the page. It is drawn by the same layout engine as the PDF, so what you see is what prints. Text sizes S, M, L and XL change the type on the sheet. Choose L or XL for young children and for large print.",
      "When you print, set the scale to 100 percent or Actual size, because Fit to page can shrink the grid. Print one page first and check the margins. For a stack of sheets, choose a class set and append the answer keys at the back, or save the keys as a separate PDF.",
    ],
    words: list(
      "SOCCER: Played with a round ball and no hands",
      "TENNIS: Played with rackets and a net",
      "SWIMMING: Racing in a pool",
      "BASEBALL: Bat, ball and four bases",
      "HOCKEY: Played with sticks and a puck",
      "VOLLEYBALL: Hit a ball over a high net",
      "GYMNASTICS: Floor routines, rings and the beam",
      "ARCHERY: Shooting arrows at a target",
      "ROWING: Pulling oars to move a boat",
      "CYCLING: Racing on two wheels",
      "BOWLING: Rolling a ball at ten pins",
      "SKATING: Gliding on blades",
    ),
    tips: [
      "Print one page first. Check that the grid fits the page and the letters are easy to read.",
      "In the print dialog, choose Actual size or 100 percent scale.",
      "Use Letter in the US and Canada and A4 elsewhere. The PDF is laid out for each size.",
      "Choose L text for children and XL for large print.",
      "Print the answer key as a separate PDF so it stays with the teacher or host.",
    ],
    faq: [
      {
        q: "What paper sizes are supported?",
        a: "US Letter and A4. Other sizes, including book trim sizes, are not supported.",
      },
      {
        q: "Will it print in black and white?",
        a: "Yes. It is pure black on white, with nothing that relies on color.",
      },
      {
        q: "Does the PDF have a watermark?",
        a: "No. There is no watermark and no account.",
      },
      {
        q: "Can I print an answer key?",
        a: "Yes. Append it after the puzzle, save it as a separate PDF or leave it out.",
      },
    ],
  },
  {
    slug: "crossword-puzzle-maker",
    shortTitle: "Crossword puzzle maker",
    title: "Crossword puzzle maker",
    sheetTitle: "Landforms and water",
    type: "crossword",
    intro:
      "Write a list of answers and clues. Puzzleloom searches for a connected layout and tells you exactly which words did not fit.",
    description:
      "Free crossword puzzle maker: write answers and clues, get a connected layout or a clear note on words that did not fit. Print with an answer key. No account.",
    body: [
      "A crossword is a list of answers and clues. Puzzleloom does the layout. It tries many arrangements and keeps the best one, and every word is placed in a single connected grid with standard numbering.",
      "When a word cannot be placed, you get a specific message, not a silent drop. A word that shares no letters with the others, such as VOLCANO next to a list of rivers, is named so you can add a connecting word. Adding words that share common letters is the quickest fix.",
      "Press Reshuffle for a new layout from a new seed, and choose the one you like. Every puzzle has a printed ID that encodes its seed. Save it in the browser or export a .puzzleloom.json file. Download a vector PDF or export PNG or SVG when you are done.",
    ],
    words: list(
      "RIVER: Flows to a sea or lake",
      "MOUNTAIN: Very high landform",
      "DESERT: Dry land with little rain",
      "ISLAND: Land surrounded by water",
      "VOLCANO: Mountain that can erupt",
      "GLACIER: Slow river of ice",
      "CANYON: Deep valley with steep sides",
      "PENINSULA: Land surrounded by water on three sides",
      "EQUATOR: Line that circles Earth halfway between the poles",
      "CONTINENT: One of Earth's seven large landmasses",
      "HARBOR: Sheltered place for ships",
      "VALLEY: Low land between hills",
    ),
    tips: [
      "Include several words with the same common letters. Words that share E, A, R, S, T or N connect easily.",
      "If Puzzleloom reports a word that did not fit, add a word that contains one of its letters.",
      "Press Reshuffle a few times. Different seeds give different shapes, and some are more compact.",
      "Write clues in the same style: all definitions, or all sentences with a blank.",
      "Check that no clue contains its own answer.",
    ],
    faq: [
      {
        q: "What happens if a word cannot be placed?",
        a: "Puzzleloom lists the words that did not fit and explains why, for example that a word shares no letters with the rest. It does not drop words silently.",
      },
      {
        q: "Does it number the clues?",
        a: "Yes. Clues are numbered in standard crossword order, with separate Across and Down lists.",
      },
      {
        q: "Can I get a different layout?",
        a: "Yes. Press Reshuffle for a new seed and a new layout.",
      },
      {
        q: "Is it free?",
        a: "Yes. There is no account and no watermark, and your words are not uploaded.",
      },
    ],
  },
  {
    slug: "crossword-maker-with-answer-key",
    shortTitle: "Crosswords with answer keys",
    title: "Crossword maker with answer key",
    sheetTitle: "Geometry review",
    type: "crossword",
    intro:
      "Make a crossword and print the solution with it. Append the key, download it as a separate PDF, or leave it out.",
    description:
      "Crossword maker with answer key: append the solution to the puzzle, save it as a separate PDF, or skip it. Class sets give each version its own key and ID.",
    body: [
      "You have three answer-key options. Appended puts the filled-in grid after the puzzle in the same PDF. Separate saves the keys as their own PDF, so you can keep the keys and hand out the puzzles. None leaves the key out. Use the Puzzle and Answer key buttons in the preview to check the key on screen before printing.",
      "A class set makes 1 to 40 versions of the same word list, each with a different grid. Each version has its own answer key and a printed ID. To mark a sheet, find the ID in the corner and open the key with the same ID. Appended keys sit after the puzzle pages in the same PDF.",
      "For self-checking, turn on the answer reveal option for play links. A play link contains the puzzle and its answers in the link, so it suits practice and not tests. For a test, print on paper.",
    ],
    words: list(
      "ANGLE: Shape made where two lines meet",
      "RADIUS: Distance from the center of a circle to its edge",
      "DIAMETER: Distance across a circle through its center",
      "PERIMETER: Distance around a shape",
      "AREA: Amount of surface inside a shape",
      "VOLUME: Amount of space inside a solid",
      "FRACTION: Part of a whole, such as one half",
      "DECIMAL: Number with a point, such as 0.5",
      "PRODUCT: Answer to a multiplication",
      "QUOTIENT: Answer to a division",
      "DENOMINATOR: Bottom number of a fraction",
      "SYMMETRY: Matching halves on each side of a line",
    ),
    tips: [
      "Choose Separate for a class set so you can keep the keys and hand out the puzzles.",
      "Use Appended for a one-off puzzle in a newsletter or handout.",
      "Check the key on screen before printing. Use the Answer key button in the preview.",
      "Match each student's sheet to its key by the printed ID.",
      "Choose None when the puzzle goes into a book that has its own answers section.",
    ],
    faq: [
      {
        q: "What answer key options are there?",
        a: "Appended after the puzzle, a separate PDF, or none.",
      },
      {
        q: "How do I match a sheet to its key?",
        a: "Each version has a short printed ID, and its key shows the same ID.",
      },
      {
        q: "Can each student get a different crossword?",
        a: "Yes. A class set makes 1 to 40 versions, each with a different grid and its own key.",
      },
      {
        q: "Is the answer key free?",
        a: "Yes. There is no account, no watermark and no paid tier.",
      },
    ],
  },
  {
    slug: "printable-crossword-maker",
    shortTitle: "Printable crossword maker",
    title: "Printable crossword maker",
    sheetTitle: "In the kitchen",
    type: "crossword",
    intro:
      "Make a crossword that prints cleanly in black and white. The preview and the PDF come from one layout, on Letter or A4.",
    description:
      "Printable crossword maker: a crisp black-and-white vector PDF on US Letter or A4 with numbered clues and an optional answer key. Free, with no watermark.",
    body: [
      "The preview is the page. It is drawn by the same layout engine as the PDF, so the clue lists, numbering and margins you see are what prints. The PDF is vector with embedded fonts, and it is pure black on white.",
      "Choose Letter or A4, then pick a text size. S, M, L and XL change the type on the sheet. Long clues paginate rather than being clipped, so check the preview and shorten any that run to several lines.",
      "Print one page before you print a stack. In the print dialog, choose 100 percent or Actual size. For a class, make a class set and append the keys at the back, or save them as a separate PDF.",
    ],
    words: list(
      "RECIPE: Instructions for making a dish",
      "WHISK: Wire tool for beating eggs",
      "SIMMER: Cook gently just below boiling",
      "SKILLET: Frying pan, often cast iron",
      "KNEAD: Press and fold dough",
      "GARNISH: Small decoration added to a dish",
      "MARINATE: Soak food in a seasoned liquid",
      "DICE: Cut into small cubes",
      "LADLE: Deep spoon for serving soup",
      "COLANDER: Bowl with holes for draining pasta",
      "OVEN: Closed box for baking",
      "PINCH: Amount you hold between two fingers",
    ),
    tips: [
      "Print one page first and check the margins and clue sizes.",
      "Use Actual size or 100 percent scale in the print dialog.",
      "Keep clues short. Long clues take extra lines and may push the list onto another page.",
      "Use L text for younger solvers.",
      "Use the Name, Date and Class fields on a handout, and switch them off for a book page.",
    ],
    faq: [
      {
        q: "Is the PDF black and white?",
        a: "Yes. It is pure black on white, with nothing that relies on color.",
      },
      {
        q: "What paper sizes can I print?",
        a: "US Letter and A4.",
      },
      {
        q: "Will the print match the preview?",
        a: "Yes. The preview and the PDF come from the same layout engine.",
      },
      {
        q: "Is there a watermark?",
        a: "No. It is free, with no account and no watermark.",
      },
    ],
  },
  {
    slug: "puzzlemaker",
    shortTitle: "Puzzlemaker",
    title: "Puzzlemaker for word lists",
    sheetTitle: "The human body",
    type: "crossword",
    intro:
      "One word list, four puzzle types. Switch between crossword, word search and scramble without retyping, and use the quote box for a cryptogram.",
    description:
      "Puzzlemaker for teachers and parents: one word list makes a crossword, word search or word scramble, plus cryptograms. Print with answer keys. Free, no account.",
    body: [
      "Type your list once. The Crossword, Word search and Scramble tabs all read the same words, so you can switch types without retyping. The cryptogram has its own quote box, because it encodes a sentence and not a list.",
      "Each type does a different job. A crossword tests meaning, because the clue is a definition. A word search tests recognition of spelling. A scramble tests recall of spelling. A cryptogram is a logic puzzle. Choose the type that matches what you want students to do.",
      "Every type prints on Letter or A4 with an optional answer key, a printed ID and Name, Date and Class fields. Make a class set of up to 40 versions, save a project in your browser or export it as a .puzzleloom.json file. Nothing is uploaded and there is no account.",
    ],
    words: list(
      "HEART: Pumps blood around the body",
      "LUNGS: Fill with air when you breathe",
      "BRAIN: Controls thoughts and movement",
      "MUSCLE: Tissue that moves your body",
      "SKELETON: Frame of bones",
      "SPINE: Column of bones down your back",
      "STOMACH: Digests food",
      "ARTERY: Carries blood away from the heart",
      "NERVE: Carries signals to the brain",
      "SKULL: Bone that protects the brain",
      "KIDNEY: Filters waste from the blood",
      "PULSE: Beat you can feel at your wrist",
    ),
    tips: [
      "Write a clue for every word. Crosswords and scramble clues use it, and word searches ignore it.",
      "Use the same list for a crossword and a word search, then hand out both as a two-page review.",
      "Choose a scramble with first-letter hints for younger students.",
      "Use the cryptogram for a quote, a proverb or a fact from the unit.",
      "Save the project so you can switch type later without losing your list.",
    ],
    faq: [
      {
        q: "Which puzzle types can I make?",
        a: "Crossword, word search, word scramble and cryptogram.",
      },
      {
        q: "Do I have to retype my words for each type?",
        a: "No. The crossword, word search and scramble tabs share one list. The cryptogram uses a quote box.",
      },
      {
        q: "Is it free?",
        a: "Yes. There is no account, no ads and no watermark.",
      },
      {
        q: "Is my word list uploaded?",
        a: "No. Everything runs in your browser, and projects are saved on your device.",
      },
    ],
  },
  {
    slug: "word-scramble-generator",
    shortTitle: "Word scramble generator",
    title: "Word scramble generator",
    sheetTitle: "Animals",
    type: "scramble",
    intro:
      "Generate scrambled words from any list. Scrambles use the original letters, are repeatable from a seed, and come with an answer key.",
    description:
      "Free word scramble generator: scramble any word list, add first-letter hints or clues, reshuffle for new arrangements and print with an answer key. No account.",
    body: [
      "Paste your words and Puzzleloom scrambles each one. A scramble always uses the same letters as the word and never equals the original. If a word cannot be rearranged, such as one that is a single repeated letter, you get a message so you can replace it.",
      "Every puzzle is built from a seed, and the seed is encoded in the printed ID. Press Reshuffle for a new set of scrambles from the same list. Class sets make up to 40 versions, each with its own answer key.",
      "Choose a hint style: none, first letter, or the clue from your list. Use first letters for younger students and clues for vocabulary review. The answer key lists each word next to its scramble.",
    ],
    words: list(
      "ELEPHANT: Has a long trunk",
      "GIRAFFE: Tallest animal on land",
      "PENGUIN: Bird that swims but cannot fly",
      "KANGAROO: Hops and carries young in a pouch",
      "CROCODILE: Large reptile with powerful jaws",
      "BUTTERFLY: Insect with colorful wings",
      "SQUIRREL: Climbs trees and stores nuts",
      "HEDGEHOG: Small animal covered in spines",
      "PORCUPINE: Rodent with sharp quills",
      "CHEETAH: Fastest land animal",
      "OSTRICH: Largest bird",
      "PLATYPUS: Egg-laying mammal with a bill",
    ),
    tips: [
      "Use words of 5 to 9 letters. Shorter words have too few arrangements, and longer words are very hard to unscramble.",
      "Include the clue and choose the Clue hint to make it a vocabulary exercise.",
      "Press Reshuffle to get a new set of scrambles.",
      "Print the answer key separately so students cannot see it.",
      "Mix scrambles with other types. Use the same list for a word search.",
    ],
    faq: [
      {
        q: "Are scrambles repeatable?",
        a: "Yes. A puzzle is built from a seed, and the seed is encoded in the printed ID.",
      },
      {
        q: "Can a scramble be the same as the word?",
        a: "No. Puzzleloom checks that the scramble differs from the original and uses the same letters.",
      },
      {
        q: "What hints can I add?",
        a: "None, the first letter of each word, or your clue.",
      },
      {
        q: "Is it free?",
        a: "Yes. There is no account and no watermark.",
      },
    ],
  },
  {
    slug: "puzzle-book-maker",
    shortTitle: "Puzzle book maker",
    title: "Puzzle book maker",
    sheetTitle: "Camping trip",
    type: "word-search",
    intro:
      "Combine puzzles into one printable PDF book with the command-line book command. Make a small sample first, then add the answer keys at the back.",
    description:
      "Puzzle book maker: build a PDF book from word search, crossword and scramble puzzles with the book command. Letter or A4 only. Free, and MIT licensed.",
    body: [
      "Make each puzzle first. Run node packages/cli/bin.mjs make word-search --words words.txt --seed 7 --out one.puzzleloom.json for every puzzle in the book. Then write a small JSON spec with a files list (paths relative to the spec), an optional title, and key set to appended, none or only. Build the book with node packages/cli/bin.mjs book book.json --pdf book.pdf.",
      "Puzzleloom supports two page sizes, Letter and A4. Letter is the same as the 8.5 by 11 inch trim size that Amazon KDP offers. Other trim sizes, such as 6 by 9 or 8 by 10, are not supported, and there are no bleed or gutter settings. Print a proof copy and check margins before you order a stack.",
      "Puzzleloom is MIT licensed, so commercial use is fine. You are responsible for your own word lists and clues, so write them yourself. An AI assistant can do the same work through the local MCP server: it writes the clues, and Puzzleloom guarantees a valid grid and answer key.",
    ],
    words: list(
      "CAMPFIRE: Warm place to gather at night",
      "COMPASS: Needle that points north",
      "BACKPACK: Carries gear on a hike",
      "TRAIL: Marked path through the woods",
      "CANOE: Narrow boat paddled by hand",
      "FLASHLIGHT: Battery-powered light",
      "MARSHMALLOW: Soft treat toasted on a stick",
      "BINOCULARS: Make distant birds look close",
      "HIKING: Walking in the countryside",
      "LAKE: Large body of fresh water",
      "FOREST: Land covered with trees",
      "TENT: Portable shelter made of fabric",
    ),
    tips: [
      "Make a 5 to 10 puzzle sample first and check every page before you build a full book.",
      "Fix the seed for each puzzle so you can rebuild the same book later.",
      "Use key: appended for a typical activity book, with all the answers at the back.",
      "Vary the difficulty and the grid size across the book so it does not feel repetitive.",
      "Write your own word lists and clues. Do not copy lists from other puzzle books.",
    ],
    faq: [
      {
        q: "Can I sell the books I make?",
        a: "Puzzleloom is MIT licensed, so commercial use is allowed. You are responsible for the rights to your own word lists and clues.",
      },
      {
        q: "Can I make a KDP interior?",
        a: "Letter (8.5 by 11 inches) is a KDP trim size, and Puzzleloom produces it. Other trim sizes are not supported, and there are no bleed or gutter settings.",
      },
      {
        q: "Does the book command have a web interface?",
        a: "No. It is a command in the local CLI, and the web app makes single puzzles and class sets.",
      },
      {
        q: "Can an AI assistant make the book?",
        a: "Yes. The local MCP server has make_book, create_puzzle and render_pdf tools, so an assistant can write clues and build the book.",
      },
    ],
  },
  {
    slug: "word-search-book-generator",
    shortTitle: "Word search books for makers",
    title: "Word search book generator",
    sheetTitle: "Dinosaurs",
    type: "word-search",
    intro:
      "Generate a whole book of word searches from original word lists. Use the CLI to make each puzzle, then combine them with answer keys at the back.",
    description:
      "Word search book generator: make many puzzles with the CLI, combine them into one PDF with answer keys, on Letter or A4. Free, MIT licensed, no watermark.",
    body: [
      "Make one word list per puzzle in a text file, then generate each puzzle with the CLI, for example node packages/cli/bin.mjs make word-search --words dinosaurs.txt --difficulty hard --size 18 --seed 12 --out dinosaurs.puzzleloom.json. Give each puzzle its own seed so you can regenerate it exactly. Then pass the files to the book command.",
      "Vary the book. Mix Easy, Medium and Hard, and vary the grid between 12 by 12 and 20 by 20. For a large-print edition, add --font-size XL and keep grids small. The printed IDs on each puzzle let you match a puzzle to its key.",
      "Puzzleloom supports Letter and A4 only, with no watermark. If you plan to sell a book, write your own word lists and check that your puzzles are different from existing books. MIT means commercial use of the tool is allowed, and the lists are yours.",
    ],
    words: list(
      "TRICERATOPS: Three-horned plant eater",
      "STEGOSAURUS: Plated dinosaur with a spiked tail",
      "FOSSIL: Ancient remains preserved in rock",
      "EXTINCT: No longer alive anywhere",
      "HERBIVORE: Animal that eats only plants",
      "CARNIVORE: Animal that eats meat",
      "PTERODACTYL: Flying reptile of the dinosaur age",
      "RAPTOR: Small, fast dinosaur with sharp claws",
      "ASTEROID: Space rock that may have ended the dinosaurs",
      "MUSEUM: Place where skeletons are displayed",
      "JURASSIC: Period of giant long-necked dinosaurs",
      "AMBER: Hardened tree sap that can trap insects",
    ),
    tips: [
      "Keep a text file for each puzzle and a notes file with its seed, so every puzzle can be rebuilt.",
      "Use 15 to 25 words per puzzle for a standard adult book, and 8 to 12 for children.",
      "Mix grid sizes and difficulty so the book has a rhythm.",
      "Make a 5-puzzle sample, print it, and check every page and margin before you scale up.",
      "Use only original word lists that you have the right to use.",
    ],
    faq: [
      {
        q: "Can I generate many puzzles at once?",
        a: "Yes, with the CLI. Run the make command for each word list, then combine the files with the book command.",
      },
      {
        q: "Which page sizes are supported?",
        a: "US Letter and A4. Other trim sizes are not supported.",
      },
      {
        q: "Is commercial use allowed?",
        a: "Puzzleloom is MIT licensed, so yes. You are responsible for the rights to your word lists.",
      },
      {
        q: "Are there watermarks or limits?",
        a: "No watermarks and no paid tier. A single puzzle holds up to 40 words.",
      },
    ],
  },
];
