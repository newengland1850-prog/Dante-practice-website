// Subject data for the Explore page and each subject's tag page.
//
// Each subject has:
//   title  — the Wikipedia article it's based on (also used in the URL)
//   label  — display name, if different from the title
//   tags   — broad tags used to filter cards on the Explore page
//   query  — word(s) added to every tag search so results stay on topic
//   intro  — one line shown under the subject's heading
//   color  — the subject's traditional color, used for the sea-ripple background
//   groups — the sidebar tag groups; `quote: true` searches tags as exact phrases

function ordinal(n) {
  const s = n % 100 >= 11 && n % 100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" }[n % 10] || "th");
  return n + s;
}

const CENTURIES_AD = Array.from({ length: 21 }, (_, i) => `${ordinal(i + 1)} century`);
const CENTURIES = [
  ...Array.from({ length: 10 }, (_, i) => `${ordinal(10 - i)} century BC`),
  ...CENTURIES_AD,
];

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia",
  "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium",
  "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria",
  "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada", "Cape Verde", "Central African Republic", "Chad",
  "Chile", "China", "Colombia", "Comoros", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic",
  "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "East Timor",
  "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji",
  "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala",
  "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran",
  "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya",
  "Kiribati", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya",
  "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta",
  "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia",
  "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand",
  "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau",
  "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar",
  "Republic of the Congo", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia",
  "Saint Vincent and the Grenadines", "Samoa", "San Marino", "São Tomé and Príncipe", "Saudi Arabia", "Senegal",
  "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia",
  "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden",
  "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Togo", "Tonga", "Trinidad and Tobago",
  "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom",
  "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen",
  "Zambia", "Zimbabwe",
];

const REGIONS = [
  "Africa", "North Africa", "West Africa", "East Africa", "Central Africa", "Southern Africa",
  "Middle East", "Mesopotamia", "Levant", "Anatolia", "Caucasus", "Central Asia", "East Asia", "South Asia",
  "Southeast Asia", "Europe", "Western Europe", "Eastern Europe", "Northern Europe", "Southern Europe",
  "Scandinavia", "Balkans", "Mediterranean", "North America", "Central America", "Caribbean",
  "South America", "Latin America", "Oceania", "Polynesia", "Arctic", "Antarctica",
];

const CONTINENTS = ["Africa", "Asia", "Europe", "North America", "South America", "Australia", "Antarctica"];

const SUBJECTS = [
  {
    title: "History", tags: ["Humanities", "Society", "Ancient"], query: "history",
    color: "#9a6a3a", // sepia, the brown of old documents
    intro: "Choose a century, era, country, region, or religion to find articles.",
    groups: [
      { key: "century", name: "Century", tags: CENTURIES, quote: true },
      { key: "era", name: "Era", tags: [
        "Prehistory", "Stone Age", "Bronze Age", "Iron Age", "Ancient history", "Classical antiquity",
        "Late antiquity", "Early Middle Ages", "High Middle Ages", "Late Middle Ages", "Renaissance",
        "Age of Discovery", "Reformation", "Early modern period", "Age of Enlightenment",
        "Age of Revolution", "Industrial Revolution", "Victorian era", "Age of Imperialism",
        "World War I", "Interwar period", "World War II", "Cold War", "Decolonization", "Information Age",
      ] },
      { key: "country", name: "Country", tags: COUNTRIES },
      { key: "region", name: "Region", tags: REGIONS },
      { key: "religion", name: "Religion", tags: [
        "Christianity", "Catholicism", "Eastern Orthodoxy", "Protestantism", "Islam", "Sunni Islam", "Shia Islam",
        "Sufism", "Judaism", "Hinduism", "Buddhism", "Sikhism", "Jainism", "Zoroastrianism", "Confucianism",
        "Taoism", "Shinto", "Baháʼí Faith", "Ancient Egyptian religion", "Ancient Greek religion",
        "Ancient Roman religion", "Norse paganism", "Traditional African religions",
        "Native American religions", "Mesoamerican religion", "Secularism",
      ] },
    ],
  },
  {
    title: "Science", tags: ["Sciences", "Ideas"], query: "science",
    color: "#e6a800", // golden yellow, the academic color for science
    intro: "Browse by field, era, topic, or famous scientist.",
    groups: [
      { key: "field", name: "Field", tags: [
        "Physics", "Chemistry", "Biology", "Earth science", "Astronomy", "Computer science", "Medicine",
        "Engineering", "Environmental science", "Materials science", "Genetics", "Quantum mechanics",
      ] },
      { key: "era", name: "Era", tags: [
        "Ancient Greece", "Islamic Golden Age", "Medieval", "Scientific Revolution", "Age of Enlightenment",
        "19th century", "20th century", "21st century",
      ] },
      { key: "topic", name: "Topic", tags: [
        "Scientific method", "Experiment", "Theory", "Discovery", "Invention", "Nobel Prize", "Laboratory",
        "Peer review", "Ethics", "Women in science", "Space exploration", "Artificial intelligence",
      ] },
      { key: "person", name: "Scientist", tags: [
        "Isaac Newton", "Galileo Galilei", "Marie Curie", "Albert Einstein", "Charles Darwin", "Ibn al-Haytham",
        "Nikola Tesla", "Rosalind Franklin", "Louis Pasteur", "Michael Faraday", "Niels Bohr", "Stephen Hawking",
      ] },
    ],
  },
  {
    title: "Art", label: "Art & Art History", tags: ["Arts", "Humanities"], query: "art",
    color: "#6b3b1f", // brown, the academic color for fine arts
    intro: "Browse by movement, medium, genre, tradition, or century.",
    groups: [
      { key: "movement", name: "Movement", tags: [
        "Gothic art", "Renaissance", "Mannerism", "Baroque", "Rococo", "Neoclassicism", "Romanticism", "Realism",
        "Impressionism", "Post-Impressionism", "Art Nouveau", "Expressionism", "Cubism", "Futurism", "Dada",
        "Surrealism", "Abstract expressionism", "Pop art", "Minimalism", "Contemporary art",
      ] },
      { key: "medium", name: "Medium", tags: [
        "Painting", "Oil painting", "Watercolor", "Sculpture", "Drawing", "Printmaking", "Photography", "Fresco",
        "Mosaic", "Ceramics", "Stained glass", "Textile art", "Installation art", "Digital art",
      ] },
      { key: "genre", name: "Genre", tags: [
        "Portrait", "Self-portrait", "Landscape", "Still life", "Religious art", "History painting",
        "Mythological art", "Nude", "Genre painting", "Abstract art",
      ] },
      { key: "tradition", name: "Tradition", tags: [
        "Western art", "Ancient Egyptian art", "Ancient Greek art", "Chinese art", "Japanese art", "Islamic art",
        "Indian art", "African art", "Pre-Columbian art", "Aboriginal Australian art", "Byzantine art",
      ] },
      { key: "century", name: "Century", tags: CENTURIES_AD, quote: true },
    ],
  },
  {
    title: "Literature", tags: ["Arts", "Humanities", "Writing"], query: "literature",
    color: "#7c1c2a", // oxblood, like leather-bound books
    intro: "Browse by genre, movement, language, or century.",
    groups: [
      { key: "genre", name: "Genre", tags: [
        "Poetry", "Novel", "Short story", "Drama", "Epic poetry", "Tragedy", "Comedy", "Satire",
        "Science fiction", "Fantasy", "Mystery fiction", "Gothic fiction", "Romance novel", "Autobiography",
        "Essay", "Children's literature", "Young adult fiction", "Fairy tale",
      ] },
      { key: "movement", name: "Movement", tags: [
        "Classical", "Medieval", "Renaissance", "Romanticism", "Transcendentalism", "Realism", "Naturalism",
        "Modernism", "Harlem Renaissance", "Lost Generation", "Beat Generation", "Magical realism",
        "Postmodernism", "Postcolonial literature",
      ] },
      { key: "language", name: "Language", tags: [
        "English", "American", "French", "Spanish", "German", "Italian", "Russian", "Latin", "Ancient Greek",
        "Arabic", "Persian", "Chinese", "Japanese", "Sanskrit", "Portuguese", "Irish",
      ] },
      { key: "century", name: "Century", tags: CENTURIES_AD, quote: true },
    ],
  },
  {
    title: "Philosophy", tags: ["Humanities", "Ideas", "Ancient"], query: "philosophy",
    color: "#1f2f7a", // dark blue, the academic color for philosophy
    intro: "Browse by branch, school of thought, tradition, or philosopher.",
    groups: [
      { key: "branch", name: "Branch", tags: [
        "Ethics", "Metaphysics", "Epistemology", "Logic", "Aesthetics", "Political philosophy",
        "Philosophy of mind", "Philosophy of science", "Philosophy of religion", "Philosophy of language",
      ] },
      { key: "school", name: "School of thought", tags: [
        "Platonism", "Aristotelianism", "Stoicism", "Epicureanism", "Scholasticism", "Rationalism", "Empiricism",
        "Idealism", "Utilitarianism", "Existentialism", "Phenomenology", "Pragmatism", "Analytic philosophy",
        "Continental philosophy", "Nihilism",
      ] },
      { key: "tradition", name: "Tradition", tags: [
        "Ancient Greek", "Indian", "Chinese", "Islamic", "Jewish", "Medieval", "Western", "African", "Japanese",
      ] },
      { key: "person", name: "Philosopher", tags: [
        "Socrates", "Plato", "Aristotle", "Confucius", "Laozi", "Augustine of Hippo", "Thomas Aquinas", "Avicenna",
        "René Descartes", "John Locke", "David Hume", "Immanuel Kant", "Hegel", "Friedrich Nietzsche",
        "Ludwig Wittgenstein", "Simone de Beauvoir", "Jean-Paul Sartre",
      ] },
    ],
  },
  {
    title: "Mathematics", tags: ["Sciences", "Ideas", "Numbers"], query: "mathematics",
    color: "#2f5d50", // chalkboard green
    intro: "Browse by field, concept, era, or mathematician.",
    groups: [
      { key: "field", name: "Field", tags: [
        "Arithmetic", "Algebra", "Geometry", "Trigonometry", "Calculus", "Number theory", "Statistics",
        "Probability", "Linear algebra", "Topology", "Combinatorics", "Set theory", "Game theory",
        "Mathematical logic",
      ] },
      { key: "concept", name: "Concept", tags: [
        "Prime number", "Infinity", "Pi", "Zero", "Mathematical proof", "Function", "Fractal", "Equation",
        "Theorem", "Golden ratio", "Fibonacci sequence", "Imaginary number",
      ] },
      { key: "era", name: "Era", tags: [
        "Babylonian", "Ancient Egyptian", "Ancient Greek", "Indian", "Chinese", "Islamic Golden Age",
        "Renaissance", "17th century", "19th century", "20th century",
      ] },
      { key: "person", name: "Mathematician", tags: [
        "Euclid", "Pythagoras", "Archimedes", "Al-Khwarizmi", "Fibonacci", "Isaac Newton", "Leonhard Euler",
        "Carl Friedrich Gauss", "Ada Lovelace", "Emmy Noether", "Alan Turing", "Srinivasa Ramanujan",
      ] },
    ],
  },
  {
    title: "Music", tags: ["Arts", "Society"], query: "music",
    color: "#d9708f", // pink, the academic color for music
    intro: "Browse by genre, period, instrument, or country.",
    groups: [
      { key: "genre", name: "Genre", tags: [
        "Classical music", "Opera", "Jazz", "Blues", "Gospel", "Rock", "Pop", "Hip hop", "Country", "Folk",
        "Soul", "Reggae", "Punk", "Heavy metal", "Electronic", "Latin", "K-pop", "R&B",
      ] },
      { key: "period", name: "Period", tags: [
        "Medieval", "Renaissance", "Baroque", "Classical period", "Romantic", "20th century", "Contemporary",
      ] },
      { key: "instrument", name: "Instrument", tags: [
        "Piano", "Violin", "Cello", "Guitar", "Drums", "Flute", "Trumpet", "Saxophone", "Organ", "Harp",
        "Singing", "Orchestra", "Choir",
      ] },
      { key: "country", name: "Country", tags: [
        "United States", "United Kingdom", "Germany", "Austria", "Italy", "France", "Russia", "Brazil", "Cuba",
        "Jamaica", "Mexico", "India", "Japan", "South Korea", "Nigeria", "Ireland",
      ] },
    ],
  },
  {
    title: "Economics", tags: ["Society", "Numbers"], query: "economics",
    color: "#b87333", // copper, the academic color for economics
    intro: "Browse by field, school of thought, topic, event, or economist.",
    groups: [
      { key: "field", name: "Field", tags: [
        "Microeconomics", "Macroeconomics", "Behavioral economics", "Development economics",
        "International trade", "Labour economics", "Public finance", "Econometrics", "Environmental economics",
      ] },
      { key: "school", name: "School of thought", tags: [
        "Classical economics", "Keynesian economics", "Marxian economics", "Austrian School", "Monetarism",
        "Neoclassical economics", "Mercantilism",
      ] },
      { key: "topic", name: "Topic", tags: [
        "Inflation", "Recession", "Unemployment", "Supply and demand", "Money", "Banking", "Taxation",
        "Globalization", "Economic inequality", "Stock market", "Interest rate", "Trade",
      ] },
      { key: "event", name: "Event", tags: [
        "Great Depression", "2008 financial crisis", "Industrial Revolution", "Bretton Woods", "1973 oil crisis",
        "Dot-com bubble", "Tulip mania",
      ] },
      { key: "person", name: "Economist", tags: [
        "Adam Smith", "Karl Marx", "John Maynard Keynes", "Milton Friedman", "Friedrich Hayek", "Amartya Sen",
        "David Ricardo",
      ] },
    ],
  },
  {
    title: "Biology", tags: ["Sciences", "Nature", "Life"], query: "biology",
    color: "#3f8f3a", // leaf green
    intro: "Browse by field, type of organism, concept, or habitat.",
    groups: [
      { key: "field", name: "Field", tags: [
        "Genetics", "Evolution", "Ecology", "Botany", "Zoology", "Microbiology", "Cell biology",
        "Molecular biology", "Anatomy", "Physiology", "Marine biology", "Immunology",
      ] },
      { key: "organism", name: "Organism", tags: [
        "Mammals", "Birds", "Reptiles", "Amphibians", "Fish", "Insects", "Plants", "Fungi", "Bacteria",
        "Viruses", "Dinosaurs",
      ] },
      { key: "concept", name: "Concept", tags: [
        "DNA", "Natural selection", "Photosynthesis", "Cell", "Protein", "Species", "Extinction",
        "Biodiversity", "Heredity", "Metabolism",
      ] },
      { key: "habitat", name: "Habitat", tags: [
        "Rainforest", "Ocean", "Desert", "Grassland", "Tundra", "Coral reef", "Wetland", "Forest",
      ] },
    ],
  },
  {
    title: "Political science", label: "Political Science", tags: ["Society", "Ideas"], query: "politics",
    color: "#1f7f9a", // peacock blue, the academic color for public administration
    intro: "Browse by system of government, ideology, topic, or country.",
    groups: [
      { key: "system", name: "System of government", tags: [
        "Democracy", "Monarchy", "Republic", "Authoritarianism", "Totalitarianism", "Federalism",
        "Parliamentary system", "Presidential system", "Theocracy",
      ] },
      { key: "ideology", name: "Ideology", tags: [
        "Liberalism", "Conservatism", "Socialism", "Communism", "Fascism", "Anarchism", "Nationalism",
        "Libertarianism", "Environmentalism", "Feminism",
      ] },
      { key: "topic", name: "Topic", tags: [
        "Elections", "Constitution", "Human rights", "International relations", "Diplomacy", "War",
        "Revolution", "Public policy", "Law", "Civil rights", "United Nations",
      ] },
      { key: "country", name: "Country", tags: COUNTRIES },
    ],
  },
  {
    title: "Linguistics", tags: ["Humanities", "Language"], query: "language",
    color: "#3b3f8f", // indigo ink
    intro: "Browse by branch, language family, language, or topic.",
    groups: [
      { key: "branch", name: "Branch", tags: [
        "Phonetics", "Phonology", "Morphology", "Syntax", "Semantics", "Pragmatics", "Sociolinguistics",
        "Historical linguistics", "Psycholinguistics", "Language acquisition",
      ] },
      { key: "family", name: "Language family", tags: [
        "Indo-European", "Sino-Tibetan", "Afroasiatic", "Niger–Congo", "Austronesian", "Dravidian", "Turkic",
        "Uralic", "Japonic", "Mayan",
      ] },
      { key: "language", name: "Language", tags: [
        "English", "Spanish", "Mandarin Chinese", "Arabic", "Hindi", "French", "Russian", "Portuguese",
        "German", "Japanese", "Latin", "Ancient Greek", "Sanskrit", "Swahili", "Hebrew", "Italian",
      ] },
      { key: "topic", name: "Topic", tags: [
        "Writing system", "Alphabet", "Grammar", "Dialect", "Etymology", "Sign language", "Translation",
        "Endangered language", "Pidgin", "Bilingualism",
      ] },
    ],
  },
  {
    title: "Divine Comedy", label: "Dante's Divine Comedy", tags: ["Arts", "Writing", "Medieval"], query: "Dante",
    color: "#b22222", // red, the robe Dante wears in traditional portraits
    intro: "Browse by part of the poem, circle of Hell, character, context, or legacy.",
    groups: [
      { key: "part", name: "Part", tags: ["Inferno", "Purgatorio", "Paradiso"] },
      { key: "circle", name: "Circles of Hell", tags: [
        "Limbo", "Lust", "Gluttony", "Greed", "Wrath", "Heresy", "Violence", "Fraud", "Treachery", "Malebolge",
        "Cocytus",
      ] },
      { key: "character", name: "Character", tags: [
        "Virgil", "Beatrice", "Francesca da Rimini", "Ulysses", "Count Ugolino", "Brunetto Latini", "Farinata",
        "Lucifer", "Cato the Younger", "Statius", "Bernard of Clairvaux", "Charon", "Minos",
      ] },
      { key: "context", name: "Context", tags: [
        "Florence", "Guelphs and Ghibellines", "Medieval Christianity", "Thomas Aquinas", "Scholasticism",
        "Italian language", "Terza rima", "Allegory", "Papacy",
      ] },
      { key: "legacy", name: "Legacy", tags: [
        "Translation", "Gustave Doré", "Sandro Botticelli", "William Blake", "Commentary", "Film", "Music",
      ] },
    ],
  },
  {
    title: "Astronomy", tags: ["Sciences", "Nature", "Space"], query: "astronomy",
    color: "#191970", // midnight blue
    intro: "Browse by object, field, mission, or astronomer.",
    groups: [
      { key: "object", name: "Object", tags: [
        "Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto",
        "Exoplanet", "Star", "Galaxy", "Nebula", "Black hole", "Comet", "Asteroid", "Supernova", "Pulsar",
      ] },
      { key: "field", name: "Field", tags: [
        "Astrophysics", "Cosmology", "Planetary science", "Astrobiology", "Radio astronomy", "Stellar evolution",
        "Dark matter", "Big Bang",
      ] },
      { key: "mission", name: "Mission & telescope", tags: [
        "Hubble Space Telescope", "James Webb Space Telescope", "Apollo program", "Voyager program",
        "Mars rover", "International Space Station", "Kepler space telescope", "Cassini",
      ] },
      { key: "person", name: "Astronomer", tags: [
        "Ptolemy", "Nicolaus Copernicus", "Galileo Galilei", "Johannes Kepler", "Edwin Hubble", "Carl Sagan",
        "Vera Rubin", "Henrietta Swan Leavitt",
      ] },
    ],
  },
  {
    title: "Ecology", tags: ["Sciences", "Nature", "Life"], query: "ecology",
    color: "#228b22", // forest green
    intro: "Browse by ecosystem, topic, or continent.",
    groups: [
      { key: "ecosystem", name: "Ecosystem", tags: [
        "Forest", "Rainforest", "Grassland", "Savanna", "Desert", "Tundra", "Wetland", "Coral reef", "Ocean",
        "River", "Lake", "Mountain",
      ] },
      { key: "topic", name: "Topic", tags: [
        "Food chain", "Biodiversity", "Climate change", "Conservation", "Extinction", "Invasive species",
        "Pollution", "Deforestation", "Keystone species", "Pollination", "Predation", "Symbiosis",
      ] },
      { key: "continent", name: "Continent", tags: CONTINENTS },
    ],
  },
  {
    title: "Geology", tags: ["Sciences", "Nature", "Earth"], query: "geology",
    color: "#b8741a", // ochre, an earth pigment
    intro: "Browse by topic, rock type, landform, or geologic time.",
    groups: [
      { key: "topic", name: "Topic", tags: [
        "Plate tectonics", "Earthquake", "Volcano", "Erosion", "Fossil", "Mineral", "Rock cycle", "Glacier",
        "Gemstone", "Groundwater",
      ] },
      { key: "rock", name: "Rock type", tags: [
        "Igneous rock", "Sedimentary rock", "Metamorphic rock", "Granite", "Basalt", "Limestone", "Marble",
        "Sandstone", "Obsidian",
      ] },
      { key: "landform", name: "Landform", tags: [
        "Mountain", "Canyon", "Cave", "Valley", "Plateau", "Island", "Delta", "Geyser",
      ] },
      { key: "time", name: "Geologic time", tags: [
        "Precambrian", "Cambrian", "Ordovician", "Devonian", "Carboniferous", "Permian", "Triassic", "Jurassic",
        "Cretaceous", "Paleogene", "Neogene", "Quaternary", "Ice age",
      ] },
    ],
  },
  {
    title: "Oceanography", tags: ["Sciences", "Nature", "Earth"], query: "ocean",
    color: "#0f5e9c", // sea blue
    intro: "Browse by ocean or sea, topic, sea life, or exploration.",
    groups: [
      { key: "ocean", name: "Ocean & sea", tags: [
        "Pacific Ocean", "Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Southern Ocean", "Mediterranean Sea",
        "Caribbean Sea", "Red Sea", "Black Sea", "Baltic Sea", "North Sea",
      ] },
      { key: "topic", name: "Topic", tags: [
        "Ocean current", "Tide", "Wave", "El Niño", "Sea level rise", "Ocean acidification", "Deep sea",
        "Hydrothermal vent", "Salinity", "Tsunami",
      ] },
      { key: "life", name: "Sea life", tags: [
        "Coral reef", "Plankton", "Whale", "Shark", "Dolphin", "Octopus", "Jellyfish", "Kelp forest", "Sea turtle",
      ] },
      { key: "exploration", name: "Exploration", tags: [
        "Challenger expedition", "Mariana Trench", "Submarine", "Jacques Cousteau", "Titanic", "Scuba diving",
      ] },
    ],
  },
  {
    title: "Botany", tags: ["Sciences", "Nature", "Life"], query: "plant",
    color: "#6b8e3a", // sage green
    intro: "Browse by plant group, plant part, use, or habitat.",
    groups: [
      { key: "group", name: "Plant group", tags: [
        "Flowering plants", "Trees", "Conifers", "Ferns", "Mosses", "Algae", "Cacti", "Grasses", "Orchids",
        "Succulents", "Carnivorous plants",
      ] },
      { key: "part", name: "Plant part & process", tags: [
        "Photosynthesis", "Pollination", "Seed", "Root", "Leaf", "Flower", "Fruit", "Germination",
        "Plant hormone",
      ] },
      { key: "use", name: "Use", tags: [
        "Agriculture", "Medicinal plants", "Herbs", "Crops", "Horticulture", "Forestry", "Gardening", "Spices",
      ] },
      { key: "habitat", name: "Habitat", tags: [
        "Rainforest", "Desert", "Grassland", "Wetland", "Alpine", "Tundra", "Temperate forest",
      ] },
    ],
  },
  {
    title: "Architecture", tags: ["Arts", "Society"], query: "architecture",
    color: "#6a3fb5", // blue violet, the academic color for architecture
    intro: "Browse by style, building type, architect, or country.",
    groups: [
      { key: "style", name: "Style", tags: [
        "Ancient Egyptian", "Ancient Greek", "Ancient Roman", "Byzantine", "Romanesque", "Gothic", "Islamic",
        "Renaissance", "Baroque", "Neoclassical", "Victorian", "Art Nouveau", "Art Deco", "Modernism",
        "Brutalism", "Postmodern", "Deconstructivism",
      ] },
      { key: "type", name: "Building type", tags: [
        "Cathedral", "Church", "Mosque", "Temple", "Castle", "Palace", "Skyscraper", "Bridge", "House",
        "Museum", "Stadium", "Pyramid", "Monument",
      ] },
      { key: "person", name: "Architect", tags: [
        "Vitruvius", "Filippo Brunelleschi", "Andrea Palladio", "Christopher Wren", "Antoni Gaudí",
        "Frank Lloyd Wright", "Le Corbusier", "Ludwig Mies van der Rohe", "Zaha Hadid", "I. M. Pei",
        "Mimar Sinan",
      ] },
      { key: "country", name: "Country", tags: COUNTRIES },
    ],
  },
  {
    title: "Psychology", tags: ["Sciences", "Society", "Mind"], query: "psychology",
    color: "#7e5aa8", // lavender purple
    intro: "Browse by branch, topic, mental health condition, or psychologist.",
    groups: [
      { key: "branch", name: "Branch", tags: [
        "Clinical psychology", "Cognitive psychology", "Developmental psychology", "Social psychology",
        "Behaviorism", "Evolutionary psychology", "Positive psychology", "Neuropsychology",
        "Educational psychology", "Psychoanalysis",
      ] },
      { key: "topic", name: "Topic", tags: [
        "Memory", "Emotion", "Personality", "Intelligence", "Learning", "Motivation", "Perception", "Sleep",
        "Consciousness", "Stress", "Dreams", "Habit",
      ] },
      { key: "condition", name: "Mental health", tags: [
        "Anxiety", "Depression", "ADHD", "Autism", "PTSD", "OCD", "Schizophrenia", "Bipolar disorder",
        "Eating disorder", "Addiction",
      ] },
      { key: "person", name: "Psychologist", tags: [
        "Sigmund Freud", "Carl Jung", "B. F. Skinner", "Jean Piaget", "William James", "Ivan Pavlov",
        "Abraham Maslow", "Carl Rogers", "Daniel Kahneman",
      ] },
    ],
  },
  {
    title: "Classical antiquity", label: "Classical Antiquity", tags: ["Humanities", "Ancient"], query: "ancient",
    color: "#a33b2b", // Pompeian red, from Roman wall paintings
    intro: "Browse by civilization, period, topic, person, or city.",
    groups: [
      { key: "civ", name: "Civilization", tags: [
        "Ancient Greece", "Ancient Rome", "Hellenistic", "Achaemenid Empire", "Carthage", "Ptolemaic Egypt",
        "Etruscan",
      ] },
      { key: "period", name: "Period", tags: [
        "Archaic Greece", "Classical Greece", "Hellenistic period", "Roman Kingdom", "Roman Republic",
        "Roman Empire", "Late antiquity",
      ] },
      { key: "topic", name: "Topic", tags: [
        "Mythology", "Philosophy", "Warfare", "Architecture", "Theatre", "Olympic Games", "Democracy", "Slavery",
        "Religion", "Latin", "Ancient Greek language", "Trade",
      ] },
      { key: "person", name: "Person", tags: [
        "Homer", "Pericles", "Alexander the Great", "Socrates", "Julius Caesar", "Augustus", "Cicero",
        "Cleopatra", "Virgil", "Hannibal", "Marcus Aurelius", "Sappho",
      ] },
      { key: "city", name: "City", tags: [
        "Athens", "Sparta", "Rome", "Alexandria", "Corinth", "Pompeii", "Troy", "Syracuse", "Constantinople",
      ] },
    ],
  },
  {
    title: "Middle Ages", tags: ["Humanities", "Medieval"], query: "medieval",
    color: "#b8901f", // gold leaf, from illuminated manuscripts
    intro: "Browse by period, century, region, topic, or person.",
    groups: [
      { key: "period", name: "Period", tags: ["Early Middle Ages", "High Middle Ages", "Late Middle Ages"] },
      { key: "century", name: "Century", tags: CENTURIES_AD.slice(4, 15), quote: true },
      { key: "region", name: "Region", tags: [
        "England", "France", "Holy Roman Empire", "Byzantine Empire", "Islamic world", "Iberia", "Italy",
        "Scandinavia", "Kievan Rus'", "Mongol Empire", "Mali Empire",
      ] },
      { key: "topic", name: "Topic", tags: [
        "Feudalism", "Crusades", "Knights", "Castles", "Monasticism", "Black Death", "Chivalry", "Guilds",
        "Cathedrals", "Illuminated manuscripts", "Vikings", "Heraldry",
      ] },
      { key: "person", name: "Person", tags: [
        "Charlemagne", "William the Conqueror", "Joan of Arc", "Saladin", "Eleanor of Aquitaine",
        "Genghis Khan", "Richard the Lionheart", "Hildegard of Bingen", "Mansa Musa", "Geoffrey Chaucer",
      ] },
    ],
  },
  {
    title: "Renaissance", tags: ["Humanities", "Arts", "Ideas"], query: "Renaissance",
    color: "#1f3fa8", // ultramarine, the prized pigment of Renaissance painting
    intro: "Browse by region, topic, person, or city.",
    groups: [
      { key: "region", name: "Region", tags: [
        "Italian Renaissance", "Northern Renaissance", "English Renaissance", "French Renaissance",
        "Spanish Golden Age", "Polish Renaissance",
      ] },
      { key: "topic", name: "Topic", tags: [
        "Humanism", "Painting", "Sculpture", "Architecture", "Printing press", "Science", "Exploration",
        "Patronage", "Literature", "Music", "Reformation",
      ] },
      { key: "person", name: "Person", tags: [
        "Leonardo da Vinci", "Michelangelo", "Raphael", "Donatello", "Sandro Botticelli", "Petrarch", "Erasmus",
        "Niccolò Machiavelli", "William Shakespeare", "Nicolaus Copernicus", "Albrecht Dürer", "Medici",
      ] },
      { key: "city", name: "City", tags: [
        "Florence", "Venice", "Rome", "Milan", "Antwerp", "Nuremberg", "Paris", "London",
      ] },
    ],
  },
  {
    title: "Mythology", tags: ["Humanities", "Writing", "Ancient"], query: "mythology",
    color: "#66023c", // Tyrian purple
    intro: "Browse by tradition, type of figure, theme, or famous figure.",
    groups: [
      { key: "tradition", name: "Tradition", tags: [
        "Greek", "Roman", "Norse", "Egyptian", "Mesopotamian", "Hindu", "Chinese", "Japanese", "Celtic", "Aztec",
        "Maya", "Yoruba", "Slavic", "Polynesian", "Native American", "Arthurian",
      ] },
      { key: "type", name: "Type of figure", tags: [
        "God", "Goddess", "Hero", "Monster", "Trickster", "Dragon", "Giant", "Spirit", "Demigod",
      ] },
      { key: "theme", name: "Theme", tags: [
        "Creation myth", "Flood myth", "Underworld", "Afterlife", "Hero's journey", "Prophecy", "Apocalypse",
        "Transformation",
      ] },
      { key: "figure", name: "Famous figure", tags: [
        "Zeus", "Athena", "Odin", "Thor", "Loki", "Ra", "Osiris", "Hercules", "Achilles", "Gilgamesh", "Medusa",
        "Krishna", "Quetzalcoatl", "Anansi", "King Arthur",
      ] },
    ],
  },
  {
    title: "Neuroscience", tags: ["Sciences", "Life", "Mind"], query: "brain",
    color: "#3a9a2a", // kelly green, the academic color for medicine
    intro: "Browse by part of the nervous system, topic, disorder, or method.",
    groups: [
      { key: "part", name: "Nervous system", tags: [
        "Neuron", "Synapse", "Cerebral cortex", "Hippocampus", "Amygdala", "Cerebellum", "Brainstem",
        "Spinal cord", "Neurotransmitter", "Dopamine",
      ] },
      { key: "topic", name: "Topic", tags: [
        "Memory", "Learning", "Sleep", "Emotion", "Vision", "Language", "Consciousness", "Neuroplasticity",
        "Pain", "Attention",
      ] },
      { key: "disorder", name: "Disorder", tags: [
        "Alzheimer's disease", "Parkinson's disease", "Epilepsy", "Stroke", "Multiple sclerosis", "Concussion",
        "Migraine", "ALS",
      ] },
      { key: "method", name: "Method", tags: [
        "MRI", "fMRI", "EEG", "Neuroimaging", "Optogenetics", "Brain–computer interface",
      ] },
    ],
  },
];
