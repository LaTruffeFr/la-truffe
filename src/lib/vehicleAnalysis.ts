import { Vehicle, MarketStats, Carburant, Transmission, SegmentStats } from "@/types/vehicle";

// ============================================
// BRAND & MODEL EXTRACTION
// ============================================

const BRANDS = [
  // Premium Allemand
  "Audi", "BMW", "Mercedes", "Mercedes-Benz", "Volkswagen", "Porsche",
  // Français
  "Renault", "Peugeot", "Citroën", "Citroen", "DS", "Alpine", "Dacia",
  // Japonais
  "Toyota", "Honda", "Nissan", "Mazda", "Suzuki", "Mitsubishi", "Lexus", "Infiniti", "Subaru", "Isuzu",
  // Coréen
  "Hyundai", "Kia", "Genesis", "SsangYong",
  // Américain
  "Ford", "Chevrolet", "Dodge", "Chrysler", "Jeep", "Cadillac", "GMC", "Tesla", "Buick", "Lincoln", "RAM",
  // Italien
  "Fiat", "Alfa Romeo", "Lancia", "Maserati", "Ferrari", "Lamborghini", "Abarth",
  // Espagnol
  "Seat", "Cupra",
  // Tchèque
  "Skoda",
  // Suédois
  "Volvo", "Saab", "Polestar",
  // Britannique
  "Jaguar", "Land Rover", "Range Rover", "Mini", "Bentley", "Rolls-Royce", "Aston Martin", "McLaren", "Lotus", "MG",
  // Allemand compact
  "Opel", "Smart",
  // Autre
  "Bugatti", "Pagani", "Koenigsegg", "Rimac", "Wiesmann", "Gumpert", "Artega"
];

const MODEL_PATTERNS: Record<string, string[]> = {
  // AUDI - Complet
  "Audi": [
    // RS (performance)
    "rs q8", "rsq8", "rs q3", "rsq3", "rs7", "rs6", "rs5", "rs4", "rs3", "rs e-tron gt", "rs6 avant", "rs4 avant",
    // S (sport)
    "sq8", "sq7", "sq5", "sq3", "sq2", "s8", "s7", "s6", "s5", "s4", "s3", "s1",
    // TT
    "tt rs", "ttrs", "tts", "tt",
    // R8
    "r8 v10", "r8 spyder", "r8",
    // A Series
    "a8", "a7", "a6 allroad", "a6", "a5 sportback", "a5", "a4 allroad", "a4 avant", "a4", "a3 sportback", "a3", "a2", "a1 sportback", "a1",
    // Q Series (SUV)
    "q8 e-tron", "q8", "q7", "q5 sportback", "q5", "q4 e-tron", "q4", "q3 sportback", "q3", "q2",
    // E-tron
    "e-tron gt", "e-tron sportback", "e-tron",
  ],
  
  // BMW - Complet
  "BMW": [
    // M Performance
    "m8 competition", "m8", "m7", "m6", "m5 competition", "m5 cs", "m5", "m4 competition", "m4 cs", "m4 gts", "m4", 
    "m3 competition", "m3 cs", "m3", "m2 competition", "m2 cs", "m2",
    "x7 m60i", "x6 m competition", "x6 m", "x5 m competition", "x5 m", "x4 m competition", "x4 m", "x3 m competition", "x3 m",
    "m135i", "m140i", "m235i", "m240i", "m340i", "m440i", "m550i", "m760i", "m850i",
    // Série 1
    "128ti", "120i", "120d", "118i", "118d", "116i", "116d", "serie 1", "série 1",
    // Série 2
    "230i", "228i", "220i", "220d", "218i", "218d", "serie 2 active tourer", "serie 2 gran coupe", "serie 2", "série 2",
    // Série 3
    "340i", "330i", "330e", "330d", "320i", "320d", "318i", "318d", "serie 3 touring", "serie 3", "série 3",
    // Série 4
    "440i", "430i", "430d", "420i", "420d", "serie 4 gran coupe", "serie 4", "série 4",
    // Série 5
    "550i", "545e", "540i", "540d", "530i", "530e", "530d", "520i", "520d", "518d", "serie 5 touring", "serie 5", "série 5",
    // Série 6 / Série 7 / Série 8
    "640i", "640d", "630i", "serie 6 gran turismo", "serie 6", "série 6",
    "750i", "745e", "740i", "740d", "730i", "730d", "serie 7", "série 7",
    "840i", "840d", "serie 8", "série 8",
    // SUV X
    "x7 m50i", "x7 m50d", "x7 40i", "x7", "x6 m50i", "x6 40i", "x6", "x5 m50i", "x5 45e", "x5 40i", "x5 30d", "x5",
    "x4 m40i", "x4 30i", "x4 20d", "x4", "x3 m40i", "x3 30e", "x3 30i", "x3 20d", "x3 20i", "x3",
    "x2 m35i", "x2 25e", "x2 20i", "x2 20d", "x2 18i", "x2", "x1 25e", "x1 20i", "x1 20d", "x1 18i", "x1 18d", "x1",
    // Électrique i
    "ix m60", "ix xdrive50", "ix xdrive40", "ix", "i7 m70", "i7 xdrive60", "i7", "i5 m60", "i5", "i4 m50", "i4", "i3s", "i3", "i8",
    // Z
    "z4 m40i", "z4 30i", "z4 20i", "z4",
  ],
  
  // MERCEDES - Complet
  "Mercedes": [
    // AMG
    "amg gt black series", "amg gt r", "amg gt s", "amg gt 63 s", "amg gt 63", "amg gt 53", "amg gt",
    "a 45 amg", "a45 amg", "a 35 amg", "a35 amg", "cla 45 amg", "cla45 amg", "cla 35 amg",
    "c 63 amg", "c63 amg", "c 43 amg", "c43 amg", "e 63 amg", "e63 amg", "e 53 amg", "e53 amg",
    "s 63 amg", "s63 amg", "s 65 amg", "gle 63 amg", "gle63 amg", "gls 63 amg", "glc 63 amg", "glc63 amg",
    "g 63 amg", "g63 amg", "g 65 amg",
    // Classe A
    "a 250", "a 220", "a 200", "a 180", "a 160", "classe a", "class a",
    // Classe B
    "b 250", "b 220", "b 200", "b 180", "classe b", "class b",
    // Classe C
    "c 300", "c 250", "c 220", "c 200", "c 180", "classe c coupe", "classe c break", "classe c", "class c",
    // Classe E
    "e 450", "e 400", "e 350", "e 300", "e 250", "e 220", "e 200", "classe e coupe", "classe e break", "classe e", "class e",
    // Classe S
    "s 650", "s 600", "s 580", "s 560", "s 500", "s 450", "s 400", "s 350", "classe s coupe", "classe s", "class s",
    // CLA / CLS
    "cla 250", "cla 220", "cla 200", "cla 180", "cla shooting brake", "cla",
    "cls 450", "cls 400", "cls 350", "cls 300", "cls shooting brake", "cls",
    // SUV GLA / GLB / GLC / GLE / GLS / G
    "gla 250", "gla 220", "gla 200", "gla 180", "gla",
    "glb 250", "glb 220", "glb 200", "glb 180", "glb",
    "glc 300", "glc 250", "glc 220", "glc 200", "glc coupe", "glc",
    "gle 450", "gle 400", "gle 350", "gle 300", "gle coupe", "gle",
    "gls 600", "gls 580", "gls 450", "gls 400", "gls 350", "gls",
    "g 500", "g 400", "g 350", "classe g", "class g",
    // Électrique EQ
    "eqs amg", "eqs 580", "eqs 450", "eqs", "eqe amg", "eqe 350", "eqe", "eqc 400", "eqc", "eqa 350", "eqa 300", "eqa 250", "eqa", "eqb 350", "eqb 300", "eqb 250", "eqb", "eqv",
    // Maybach
    "maybach s 680", "maybach s 580", "maybach gls", "maybach",
    // SL / SLC
    "sl 63 amg", "sl 55 amg", "sl 500", "sl 450", "sl 400", "sl",
    "slc 43 amg", "slc 300", "slc 200", "slc 180", "slc",
    // Vito / Classe V
    "vito", "classe v", "class v", "marco polo",
  ],
  
  // VOLKSWAGEN - Complet
  "Volkswagen": [
    // Golf
    "golf r", "golf gti clubsport", "golf gti tcr", "golf gti", "golf gte", "golf gtd", "golf variant", "golf sportsvan", "golf alltrack", "golf plus", "golf",
    // Polo
    "polo gti", "polo r-line", "polo",
    // Arteon
    "arteon r shooting brake", "arteon r", "arteon shooting brake", "arteon",
    // Passat
    "passat gte", "passat alltrack", "passat variant", "passat",
    // T-Roc
    "t-roc r", "t-roc cabriolet", "t-roc",
    // T-Cross
    "t-cross r-line", "t-cross",
    // Tiguan
    "tiguan r", "tiguan allspace", "tiguan",
    // Touareg
    "touareg r", "touareg",
    // Touran
    "touran",
    // Up / e-Up
    "up gti", "e-up", "up",
    // ID (électrique)
    "id.7", "id.5 gtx", "id.5", "id.4 gtx", "id.4", "id.3 gtx", "id.3", "id. buzz", "id.buzz",
    // Scirocco
    "scirocco r", "scirocco",
    // Sharan
    "sharan",
    // Autres
    "taigo", "caddy", "multivan", "transporter", "caravelle", "california",
  ],
  
  // RENAULT - Complet
  "Renault": [
    // Megane
    "megane e-tech", "megane rs trophy", "megane rs", "megane gt", "megane estate", "megane coupe", "megane",
    // Clio
    "clio rs trophy", "clio rs", "clio e-tech", "clio",
    // Captur
    "captur e-tech", "captur",
    // Scenic
    "scenic e-tech", "grand scenic", "scenic",
    // Twingo
    "twingo rs", "twingo gt", "twingo",
    // Kadjar / Koleos / Austral / Arkana
    "kadjar", "koleos", "austral e-tech", "austral", "arkana e-tech", "arkana",
    // Zoe
    "zoe",
    // Talisman
    "talisman estate", "talisman",
    // Espace
    "espace", "grand espace",
    // Kangoo
    "kangoo", "kangoo van",
    // Trafic / Master
    "trafic", "master",
    // Sport
    "alpine a110", "alpine",
  ],
  
  // PEUGEOT - Complet
  "Peugeot": [
    // 208
    "e-208", "208 gti", "208",
    // 308
    "e-308", "308 gti", "308 sw", "308",
    // 408
    "408",
    // 508
    "508 pse", "508 sw", "508",
    // 2008
    "e-2008", "2008",
    // 3008
    "3008 hybrid4", "3008 hybrid", "3008",
    // 5008
    "5008 hybrid", "5008",
    // 108 / 107
    "108", "107",
    // RCZ
    "rcz r", "rcz",
    // Autres
    "rifter", "traveller", "expert", "partner", "boxer",
  ],
  
  // CITROËN - Complet
  "Citroën": [
    // C3
    "c3 aircross", "c3 picasso", "c3",
    // C4
    "e-c4 x", "e-c4", "c4 x", "c4 cactus", "c4 picasso", "grand c4 picasso", "c4 spacetourer", "grand c4 spacetourer", "c4",
    // C5
    "c5 aircross hybrid", "c5 aircross", "c5 x", "c5",
    // Ami
    "ami",
    // Berlingo
    "e-berlingo", "berlingo",
    // DS (anciens modèles Citroën)
    "ds3 crossback", "ds3", "ds4 crossback", "ds4", "ds5 hybrid4", "ds5",
    // Autres
    "c1", "c-zero", "spacetourer", "jumpy", "jumper",
  ],
  
  // DS - Complet
  "DS": [
    "ds 9 e-tense", "ds 9", "ds9",
    "ds 7 crossback e-tense", "ds 7 crossback", "ds 7", "ds7",
    "ds 4", "ds4",
    "ds 3 crossback e-tense", "ds 3 crossback", "ds 3", "ds3",
  ],
  
  // TOYOTA - Complet
  "Toyota": [
    // GR Sport
    "gr supra", "supra", "gr yaris", "gr86", "gr 86", "gr corolla",
    // Yaris
    "yaris cross hybrid", "yaris cross", "yaris hybrid", "yaris",
    // Corolla
    "corolla cross hybrid", "corolla cross", "corolla touring sports", "corolla hybrid", "corolla",
    // C-HR
    "c-hr hybrid", "c-hr",
    // RAV4
    "rav4 phev", "rav4 hybrid", "rav4 prime", "rav4",
    // Autres SUV
    "highlander hybrid", "highlander", "land cruiser", "bz4x",
    // Prius
    "prius plug-in", "prius+", "prius",
    // Camry
    "camry hybrid", "camry",
    // Aygo
    "aygo x", "aygo",
    // Autres
    "mirai", "proace city", "proace verso", "proace", "hilux",
  ],
  
  // HONDA - Complet
  "Honda": [
    // Civic
    "civic type r", "civic sport", "civic hybrid", "civic",
    // HR-V / CR-V / ZR-V
    "hr-v e:hev", "hr-v", "cr-v hybrid", "cr-v", "zr-v",
    // Jazz
    "jazz crosstar", "jazz e:hev", "jazz",
    // Accord
    "accord hybrid", "accord",
    // Autres
    "e:ny1", "e", "nsx", "s2000",
  ],
  
  // NISSAN - Complet
  "Nissan": [
    // GT-R / Z
    "gt-r nismo", "gt-r", "gtr", "370z nismo", "370z", "350z",
    // Qashqai
    "qashqai e-power", "qashqai", "qashqai+2",
    // Juke
    "juke nismo", "juke",
    // X-Trail
    "x-trail e-power", "x-trail",
    // Leaf
    "leaf e+", "leaf",
    // Ariya
    "ariya",
    // Micra
    "micra",
    // Autres
    "navara", "pathfinder", "murano", "note e-power", "note", "pulsar",
  ],
  
  // PORSCHE - Complet
  "Porsche": [
    // 911
    "911 gt3 rs", "911 gt3", "911 gt2 rs", "911 turbo s", "911 turbo", "911 carrera s", "911 carrera 4s", "911 carrera gts", "911 carrera", "911 targa 4s", "911 targa", "911",
    // 718
    "718 cayman gt4 rs", "718 cayman gt4", "718 cayman gts", "718 cayman s", "718 cayman", "718 boxster gts", "718 boxster s", "718 boxster", "718",
    // Cayenne
    "cayenne turbo gt", "cayenne turbo s e-hybrid", "cayenne turbo s", "cayenne turbo", "cayenne gts", "cayenne s", "cayenne e-hybrid", "cayenne coupe", "cayenne",
    // Macan
    "macan gts", "macan turbo", "macan s", "macan",
    // Panamera
    "panamera turbo s e-hybrid", "panamera turbo s", "panamera turbo", "panamera gts", "panamera 4s e-hybrid", "panamera 4s", "panamera sport turismo", "panamera",
    // Taycan
    "taycan turbo s", "taycan turbo", "taycan gts", "taycan 4s", "taycan cross turismo", "taycan",
    // Cayman / Boxster (legacy)
    "cayman gt4", "cayman gts", "cayman s", "cayman", "boxster gts", "boxster s", "boxster",
  ],
  
  // FORD - Complet
  "Ford": [
    // Focus
    "focus rs", "focus st", "focus active", "focus sw", "focus",
    // Fiesta
    "fiesta st", "fiesta active", "fiesta",
    // Puma
    "puma st", "puma",
    // Kuga
    "kuga phev", "kuga hybrid", "kuga st-line", "kuga",
    // Mustang
    "mustang mach-e gt", "mustang mach-e", "mustang shelby gt500", "mustang shelby gt350", "mustang gt", "mustang",
    // Explorer
    "explorer phev", "explorer",
    // Autres
    "mondeo hybrid", "mondeo", "galaxy", "s-max", "tourneo", "transit", "ranger raptor", "ranger",
    // GT
    "ford gt",
  ],
  
  // OPEL - Complet
  "Opel": [
    // Corsa
    "corsa-e", "corsa opc", "corsa gsi", "corsa",
    // Astra
    "astra opc", "astra gsi", "astra sports tourer", "astra",
    // Mokka
    "mokka-e", "mokka",
    // Crossland / Grandland
    "crossland", "grandland x hybrid4", "grandland x", "grandland",
    // Insignia
    "insignia opc", "insignia gsi", "insignia sports tourer", "insignia",
    // Autres
    "combo life", "zafira life", "vivaro", "movano",
  ],
  
  // FIAT - Complet
  "Fiat": [
    // 500
    "500e", "500 abarth", "500c", "500x", "500l", "500",
    // Panda
    "panda 4x4", "panda cross", "panda",
    // Tipo
    "tipo cross", "tipo sw", "tipo",
    // Autres
    "600e", "ducato", "doblo", "talento", "scudo",
  ],
  
  // SEAT - Complet
  "Seat": [
    "leon cupra r", "leon cupra", "leon fr", "leon sportstourer", "leon",
    "ibiza cupra", "ibiza fr", "ibiza",
    "ateca fr", "ateca cupra", "ateca",
    "arona fr", "arona",
    "tarraco fr", "tarraco",
    "mii electric", "mii",
    "alhambra",
  ],
  
  // CUPRA - Complet
  "Cupra": [
    "formentor vz5", "formentor vz", "formentor e-hybrid", "formentor",
    "leon vz", "leon e-hybrid", "leon sportstourer", "leon",
    "ateca",
    "born",
    "tavascan",
  ],
  
  // SKODA - Complet
  "Skoda": [
    "octavia rs", "octavia vrs", "octavia scout", "octavia combi", "octavia",
    "superb sportline", "superb scout", "superb combi", "superb",
    "kodiaq rs", "kodiaq sportline", "kodiaq scout", "kodiaq",
    "karoq sportline", "karoq scout", "karoq",
    "scala monte carlo", "scala",
    "fabia monte carlo", "fabia",
    "enyaq coupe iv rs", "enyaq coupe iv", "enyaq iv rs", "enyaq iv", "enyaq",
    "kamiq monte carlo", "kamiq",
    "rapid",
  ],
  
  // HYUNDAI - Complet
  "Hyundai": [
    // i Performance
    "i30 n performance", "i30 n", "i20 n", "kona n",
    // i Series
    "i30 fastback", "i30 sw", "i30", "i20 active", "i20", "i10",
    // SUV
    "kona electric", "kona hybrid", "kona",
    "tucson n line", "tucson hybrid", "tucson phev", "tucson",
    "santa fe hybrid", "santa fe",
    "bayon",
    // Électrique
    "ioniq 6", "ioniq 5 n", "ioniq 5", "ioniq hybrid", "ioniq phev", "ioniq electric", "ioniq",
    // Nexo
    "nexo",
  ],
  
  // KIA - Complet
  "Kia": [
    // Stinger
    "stinger gt", "stinger",
    // Ceed
    "proceed gt", "proceed", "ceed gt", "ceed sw", "ceed",
    "xceed",
    // Sportage
    "sportage gt-line", "sportage phev", "sportage hybrid", "sportage",
    // Sorento
    "sorento gt-line", "sorento phev", "sorento hybrid", "sorento",
    // Niro
    "niro ev", "niro phev", "niro hybrid", "niro",
    // EV
    "ev6 gt", "ev6", "ev9",
    // Autres
    "picanto gt-line", "picanto", "rio", "soul ev", "soul", "carnival",
  ],
  
  // VOLVO - Complet
  "Volvo": [
    // Polestar
    "v60 polestar", "s60 polestar",
    // S Series
    "s90 recharge", "s90", "s60 recharge", "s60",
    // V Series
    "v90 cross country", "v90 recharge", "v90", "v60 cross country", "v60 recharge", "v60", "v40 cross country", "v40",
    // XC Series
    "xc90 recharge", "xc90", "xc60 recharge", "xc60", "xc40 recharge", "xc40",
    // Électrique
    "c40 recharge", "c40", "ex30", "ex90",
  ],
  
  // MINI - Complet
  "Mini": [
    "john cooper works gp", "john cooper works", "jcw gp", "jcw",
    "cooper s", "cooper se", "cooper",
    "one",
    "countryman jcw", "countryman se", "countryman",
    "clubman jcw", "clubman",
    "cabrio", "cabriolet", "convertible",
    "paceman",
  ],
  
  // ALFA ROMEO - Complet
  "Alfa Romeo": [
    "giulia quadrifoglio", "giulia veloce", "giulia",
    "stelvio quadrifoglio", "stelvio veloce", "stelvio",
    "giulietta veloce", "giulietta",
    "4c spider", "4c",
    "tonale", "mito",
  ],
  
  // JAGUAR - Complet
  "Jaguar": [
    "f-type r", "f-type svr", "f-type",
    "xe sv project 8", "xe", "xf sportbrake", "xf", "xj",
    "e-pace p300e", "e-pace", "f-pace svr", "f-pace", "i-pace",
  ],
  
  // LAND ROVER - Complet
  "Land Rover": [
    "range rover sport svr", "range rover sport", "range rover velar", "range rover evoque", "range rover",
    "discovery sport", "discovery",
    "defender 110", "defender 90", "defender",
  ],
  
  // JEEP - Complet
  "Jeep": [
    "grand cherokee 4xe", "grand cherokee srt", "grand cherokee trackhawk", "grand cherokee",
    "wrangler rubicon", "wrangler sahara", "wrangler 4xe", "wrangler unlimited", "wrangler",
    "compass 4xe", "compass",
    "renegade 4xe", "renegade",
    "gladiator",
    "cherokee",
    "avenger",
  ],
  
  // TESLA - Complet
  "Tesla": [
    "model s plaid", "model s long range", "model s",
    "model 3 performance", "model 3 long range", "model 3",
    "model x plaid", "model x long range", "model x",
    "model y performance", "model y long range", "model y",
    "roadster", "cybertruck",
  ],
  
  // DACIA - Complet
  "Dacia": [
    "duster", "sandero stepway", "sandero", "jogger hybrid", "jogger", "spring", "lodgy", "logan",
  ],
  
  // MASERATI - Complet
  "Maserati": [
    "mc20", "ghibli trofeo", "ghibli", "quattroporte trofeo", "quattroporte", "levante trofeo", "levante", "granturismo", "grancabrio", "grecale",
  ],
  
  // FERRARI - Complet
  "Ferrari": [
    "sf90 stradale", "sf90 spider", "sf90", "f8 tributo", "f8 spider", "f8", "roma", "portofino m", "portofino",
    "296 gtb", "296 gts", "296", "812 superfast", "812 gts", "812 competizione", "812",
    "purosangue", "laferrari", "488 pista", "488 gtb", "488 spider", "488",
    "458 italia", "458 spider", "458 speciale", "458",
    "california t", "california", "ff", "gtc4lusso", "f12 berlinetta", "f12 tdf", "f12",
  ],
  
  // LAMBORGHINI - Complet
  "Lamborghini": [
    "revuelto", "urus performante", "urus", "huracan sto", "huracan tecnica", "huracan evo", "huracan performante", "huracan",
    "aventador svj", "aventador sv", "aventador s", "aventador ultimae", "aventador",
    "gallardo", "murcielago",
  ],
  
  // LEXUS - Complet
  "Lexus": [
    "lfa", "lc 500", "lc 500h", "lc",
    "ls 500h", "ls 500", "ls",
    "es 300h", "es",
    "is 300h", "is",
    "nx 450h+", "nx 350h", "nx", "rx 500h", "rx 450h", "rx", "ux 300e", "ux 250h", "ux",
    "rz 450e", "rz",
  ],
  
  // MAZDA - Complet
  "Mazda": [
    "mx-5 rf", "mx-5", "miata",
    "mazda3 skyactiv-x", "mazda3", "mazda2", "mazda6",
    "cx-60 phev", "cx-60", "cx-5", "cx-30", "cx-3",
  ],
  
  // SUZUKI - Complet
  "Suzuki": [
    "swift sport", "swift", "vitara hybrid", "vitara", "s-cross hybrid", "s-cross", "jimny", "ignis", "across",
  ],
  
  // MITSUBISHI - Complet
  "Mitsubishi": [
    "outlander phev", "outlander", "eclipse cross phev", "eclipse cross", "asx", "space star", "l200", "pajero",
  ],
  
  // SMART - Complet
  "Smart": [
    "fortwo eq", "fortwo cabrio", "fortwo", "forfour eq", "forfour", "#1", "#3",
  ],
  
  // GENESIS - Complet
  "Genesis": [
    "g80", "g70", "g90", "gv80", "gv70", "gv60",
  ],
  
  // ASTON MARTIN - Complet
  "Aston Martin": [
    "dbs superleggera", "dbs", "db11 v12", "db11", "db12",
    "vantage amr", "vantage", "dbx 707", "dbx",
    "valkyrie", "vulcan",
  ],
  
  // McLAREN - Complet
  "McLaren": [
    "p1", "senna", "speedtail", "elva",
    "720s spider", "720s", "765lt spider", "765lt", "750s",
    "gt", "artura",
    "570s spider", "570s", "570gt", "540c", "600lt spider", "600lt",
    "mp4-12c",
  ],
  
  // BENTLEY - Complet
  "Bentley": [
    "continental gt speed", "continental gt", "continental gtc", "flying spur", "bentayga speed", "bentayga hybrid", "bentayga",
  ],
  
  // ROLLS-ROYCE - Complet
  "Rolls-Royce": [
    "phantom", "ghost", "wraith", "dawn", "cullinan", "spectre",
  ],
  
  // SUBARU - Complet
  "Subaru": [
    "wrx sti", "wrx", "brz", "impreza", "levorg", "outback", "forester", "xv", "crosstrek", "solterra",
  ],
  
  // ALPINE - Complet
  "Alpine": [
    "a110 s", "a110 r", "a110 gt", "a110",
  ],
  
  // MG - Complet
  "MG": [
    "mg4 xpower", "mg4", "zs ev", "zs", "hs phev", "hs", "mg5 ev", "mg5", "marvel r", "cyberster",
  ],
  
  // POLESTAR - Complet
  "Polestar": [
    "polestar 1", "polestar 2", "polestar 3", "polestar 4",
  ],
  
  // ABARTH - Complet
  "Abarth": [
    "595 competizione", "595 esseesse", "595", "695 biposto", "695 tributo ferrari", "695", "500e",
  ],
};

export function extractBrand(titre: string): string {
  const titleLower = titre.toLowerCase();
  
  for (const [brand, models] of Object.entries(MODEL_PATTERNS)) {
    for (const model of models) {
      if (titleLower.includes(model)) {
        return brand;
      }
    }
  }
  
  for (const brand of BRANDS) {
    if (titleLower.includes(brand.toLowerCase())) {
      return brand;
    }
  }
  return "Autre";
}

export function extractModel(titre: string, marque: string): string {
  const titleLower = titre.toLowerCase();
  
  const brandModels = MODEL_PATTERNS[marque];
  if (brandModels) {
    for (const model of brandModels) {
      if (titleLower.includes(model)) {
        return model.toUpperCase();
      }
    }
  }
  
  let model = titre.replace(new RegExp(marque, 'gi'), '').trim();
  const words = model.split(/\s+/).filter(w => w.length > 1);
  return words.slice(0, 2).join(' ') || 'Inconnu';
}

// ============================================
// FUEL, TRANSMISSION & POWER EXTRACTION
// ============================================

export function extractCarburant(text: string): Carburant {
  const lower = text.toLowerCase();
  
  if (lower.includes('électrique') || lower.includes('electrique') || lower.includes('electric')) {
    return 'electrique';
  }
  if (lower.includes('hybride') || lower.includes('hybrid')) {
    return 'hybride';
  }
  if (lower.includes('diesel') || lower.includes('hdi') || lower.includes('tdi') || lower.includes('dci') || lower.includes('bluehdi') || lower.includes('cdti')) {
    return 'diesel';
  }
  if (lower.includes('essence') || lower.includes('tsi') || lower.includes('tfsi') || lower.includes('tce') || lower.includes('puretech') || lower.includes('ecoboost')) {
    return 'essence';
  }
  if (lower.includes('gpl') || lower.includes('gnv')) {
    return 'gpl';
  }
  return 'autre';
}

export function extractTransmission(text: string): Transmission {
  const lower = text.toLowerCase();
  
  if (lower.includes('automatique') || lower.includes('auto') || lower.includes('bva') || lower.includes('dsg') || lower.includes('s tronic') || lower.includes('tiptronic') || lower.includes('cvt') || lower.includes('edc') || lower.includes('eat')) {
    return 'automatique';
  }
  if (lower.includes('manuelle') || lower.includes('manuel') || lower.includes('bvm')) {
    return 'manuelle';
  }
  return 'autre';
}

// Extract power in CV/HP from title
export function extractPuissance(text: string): number {
  const lower = text.toLowerCase();
  
  // Match patterns like "150ch", "150 ch", "150cv", "150 cv", "150hp"
  const patterns = [
    /(\d{2,3})\s*(?:ch|cv|hp|bhp)/i,
    /(\d{2,3})\s*chevaux/i,
    // Match engine sizes that imply power: 1.6, 2.0, etc.
  ];
  
  for (const pattern of patterns) {
    const match = lower.match(pattern);
    if (match) {
      return parseInt(match[1]);
    }
  }
  
  // Estimate from engine displacement if available
  const displacementMatch = lower.match(/(\d)[.,](\d)\s*(?:l|hdi|tdi|tsi|tfsi|tce|dci)/i);
  if (displacementMatch) {
    const liters = parseFloat(`${displacementMatch[1]}.${displacementMatch[2]}`);
    // Rough estimation: 1.0L ≈ 75cv, 1.5L ≈ 110cv, 2.0L ≈ 150cv
    return Math.round(liters * 75);
  }
  
  return 0; // Unknown
}

// Categorize power into buckets for segmentation
export function getPowerBucket(puissance: number): string {
  if (puissance === 0) return 'unknown';
  if (puissance < 100) return 'eco';      // < 100 CV
  if (puissance < 150) return 'standard'; // 100-149 CV
  if (puissance < 200) return 'sport';    // 150-199 CV
  return 'performance';                    // 200+ CV
}

// ============================================
// CSV PARSING
// ============================================

function parseLeBonCoinCSV(csvText: string): Vehicle[] {
  const vehicles: Vehicle[] = [];
  const lines = csvText.split('\n').filter(l => l.trim());
  
  if (lines.length < 2) return vehicles;
  
  // Parse header to find column indices
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map(h => h.toLowerCase().trim());
  
  console.log('CSV Headers:', headers);
  
  // Find column indices dynamically
  const findCol = (patterns: string[]): number => {
    return headers.findIndex(h => patterns.some(p => h.includes(p)));
  };
  
  // Map common column names
  const colIndices = {
    titre: Math.max(0, findCol(['titre', 'title', 'text', 'sr-only', 'annonce'])),
    lien: findCol(['href', 'link', 'url', 'lien']),
    image: findCol(['src', 'image', 'img', 'photo']),
    prix: findCol(['prix', 'price', '€']),
    annee: findCol(['année', 'annee', 'year', 'date']),
    km: findCol(['km', 'kilom', 'mileage']),
  };
  
  console.log('Column indices:', colIndices);
  
  // Parse each data row
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    if (fields.length < 3) continue;
    
    // Debug: log first record
    if (i === 1) {
      console.log('First row fields:', fields.slice(0, 10));
    }
    
    // Extract data - search through all fields if indices not found
    let titre = '';
    let lien = '';
    let image = '';
    let prix = 0;
    let annee = 0;
    let kilometrage = 0;
    
    // Title: first non-empty text field or specific column
    if (colIndices.titre >= 0 && fields[colIndices.titre]) {
      titre = fields[colIndices.titre];
    } else {
      titre = fields.find(f => f.length > 10 && !f.startsWith('http') && !f.includes('€')) || '';
    }
    
    // Link: find URL
    if (colIndices.lien >= 0 && fields[colIndices.lien]?.startsWith('http')) {
      lien = fields[colIndices.lien];
    } else {
      lien = fields.find(f => f.startsWith('http') && f.includes('leboncoin')) || 
             fields.find(f => f.startsWith('http')) || '';
    }
    
    // Image: find image URL
    if (colIndices.image >= 0 && fields[colIndices.image]?.startsWith('http')) {
      image = fields[colIndices.image];
    } else {
      image = fields.find(f => f.startsWith('http') && (f.includes('.jpg') || f.includes('.png') || f.includes('.webp') || f.includes('img'))) || '';
    }
    
    // Price: find € pattern or numeric value in expected range
    for (const field of fields) {
      const extractedPrice = extractPrice(field);
      if (extractedPrice > 0 && extractedPrice >= 500 && extractedPrice <= 500000) {
        prix = extractedPrice;
        break;
      }
    }
    
    // Year: find 4-digit year in 1990-2026 range
    for (const field of fields) {
      const yearMatch = field.match(/\b(19[89]\d|20[0-2]\d)\b/);
      if (yearMatch) {
        const y = parseInt(yearMatch[1]);
        if (y >= 1990 && y <= 2026) {
          annee = y;
          break;
        }
      }
    }
    
    // Kilometrage: find "XXX km" pattern
    for (const field of fields) {
      const km = extractKilometrage(field);
      if (km > 0 && km <= 500000) {
        kilometrage = km;
        break;
      }
    }
    
    // Skip invalid records
    if (!titre || titre.length < 3 || prix <= 0) {
      continue;
    }
    
    const marque = extractBrand(titre);
    const fullText = fields.join(' ');
    
    const vehicle: Vehicle = {
      id: `v-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      titre,
      prix,
      annee: annee || new Date().getFullYear(),
      kilometrage,
      lien: lien || '#',
      image,
      marque,
      modele: extractModel(titre, marque),
      carburant: extractCarburant(fullText),
      transmission: extractTransmission(fullText),
      puissance: extractPuissance(fullText),
    };
    
    console.log('Parsed vehicle:', { titre: vehicle.titre.slice(0, 30), prix: vehicle.prix, annee: vehicle.annee, km: vehicle.kilometrage });
    
    vehicles.push(vehicle);
  }
  
  return vehicles;
}

function extractPrice(priceStr: string): number {
  const match = priceStr.match(/(\d[\d\s]*\d|\d+)\s*€/);
  if (match) {
    return parseInt(match[1].replace(/\s/g, '')) || 0;
  }
  const cleaned = priceStr.replace(/[^\d]/g, '');
  const num = parseInt(cleaned);
  if (num >= 500 && num <= 500000) {
    return num;
  }
  return 0;
}

function extractYear(str: string): number {
  const match = str.match(/20[0-2]\d|19[89]\d/);
  return match ? parseInt(match[0]) : 0;
}

function extractKilometrage(kmStr: string): number {
  // Clean up the string first - remove extra spaces, normalize
  const cleaned = kmStr.replace(/\s+/g, ' ').trim();
  
  // Match patterns like "201 480 km", "201480km", "201.480 km"
  const match = cleaned.match(/(\d[\d\s.,]*)\s*km/i);
  if (match) {
    // Remove all spaces, dots, and commas from the number
    const numStr = match[1].replace(/[\s.,]/g, '');
    const km = parseInt(numStr) || 0;
    
    // Sanity check: no car should have more than 1,000,000 km
    // If the value is unrealistic, it's likely a parsing error
    if (km > 1000000) {
      console.warn(`Unrealistic km value detected: ${km}, from "${kmStr}"`);
      // Try to extract a reasonable number (first 6 digits max)
      const reasonableKm = parseInt(numStr.slice(0, 6));
      return reasonableKm > 1000000 ? 0 : reasonableKm;
    }
    return km;
  }
  
  // Try to extract just a number if no "km" suffix
  const numOnly = cleaned.replace(/[^\d]/g, '');
  if (numOnly) {
    const km = parseInt(numOnly);
    // Only accept if it looks like a reasonable km value
    if (km >= 1000 && km <= 500000) {
      return km;
    }
  }
  
  return 0;
}

function parseStandardCSV(csvText: string): Vehicle[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
  const vehicles: Vehicle[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < headers.length) continue;
    
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx]?.trim() || '';
    });
    
    const titre = row['titre'] || row['title'] || '';
    const marque = extractBrand(titre);
    const fullText = Object.values(row).join(' ');
    
    const vehicle: Vehicle = {
      id: `v-${i}-${Date.now()}`,
      titre,
      prix: parseSimplePrice(row['prix'] || row['price'] || '0'),
      annee: parseInt(row['année'] || row['annee'] || row['year'] || '0'),
      kilometrage: extractKilometrage(row['kilométrage'] || row['kilometrage'] || row['km'] || '0'),
      lien: row['lien'] || row['link'] || row['url'] || '#',
      image: row['image'] || row['img'] || row['photo'] || '',
      marque,
      modele: extractModel(titre, marque),
      carburant: extractCarburant(fullText),
      transmission: extractTransmission(fullText),
      puissance: extractPuissance(fullText),
    };
    
    if (vehicle.prix > 0 && vehicle.titre) {
      vehicles.push(vehicle);
    }
  }
  
  return vehicles;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  
  return result;
}

function parseSimplePrice(priceStr: string): number {
  const cleaned = priceStr.replace(/[^\d.,]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

export function parseCSV(csvText: string): Vehicle[] {
  const firstLine = csvText.split('\n')[0] || '';
  
  if (firstLine.includes('absolute href') || firstLine.includes('sr-only') || firstLine.includes('text-body')) {
    console.log('Detected LeBonCoin CSV format');
    return parseLeBonCoinCSV(csvText);
  }
  
  console.log('Using standard CSV format');
  return parseStandardCSV(csvText);
}

// ============================================
// MARKET ANALYSIS ENGINE - ADVANCED
// ============================================

// Depreciation rates per 10,000 km by fuel type
const KM_DEPRECIATION_RATES: Record<Carburant, number> = {
  'essence': 0.015,
  'diesel': 0.012,
  'electrique': 0.010,
  'hybride': 0.012,
  'gpl': 0.018,
  'autre': 0.015,
};

// Age depreciation curve (percentage of value lost per year)
const AGE_DEPRECIATION: Record<number, number> = {
  0: 0,      // New
  1: 0.20,   // -20% year 1
  2: 0.12,   // -12% year 2
  3: 0.10,   // -10% year 3
  4: 0.08,   // -8% year 4
  5: 0.07,   // -7% year 5+
};

// Transmission premium/discount
const TRANSMISSION_ADJUSTMENT: Record<Transmission, number> = {
  'automatique': 1.05,  // +5% for automatic
  'manuelle': 1.0,
  'autre': 1.0,
};

// Power category adjustments
const POWER_ADJUSTMENT: Record<string, number> = {
  'eco': 0.92,          // -8% for low power
  'standard': 1.0,       // Base
  'sport': 1.08,         // +8% for sport
  'performance': 1.15,   // +15% for performance
  'unknown': 1.0,
};

// Create refined segment key
function createSegmentKey(vehicle: Vehicle, level: 'precise' | 'standard' | 'broad'): string {
  const powerBucket = getPowerBucket(vehicle.puissance || 0);
  
  switch (level) {
    case 'precise':
      // Most precise: Marque|Modèle|Année|Carburant|Puissance
      return `${vehicle.marque}|${vehicle.modele}|${vehicle.annee}|${vehicle.carburant || 'autre'}|${powerBucket}`;
    case 'standard':
      // Standard: Marque|Modèle|Année±1|Carburant
      const yearBucket = vehicle.annee;
      return `${vehicle.marque}|${vehicle.modele}|${yearBucket}|${vehicle.carburant || 'autre'}`;
    case 'broad':
      // Broad: Marque|Modèle|Année±2|AllFuels
      const yearBucket2 = Math.floor(vehicle.annee / 2) * 2;
      return `${vehicle.marque}|${vehicle.modele}|${yearBucket2}|all`;
  }
}

// Remove outliers using IQR method
function removeOutliers(vehicles: Vehicle[]): Vehicle[] {
  if (vehicles.length < 4) return vehicles;
  
  const prices = vehicles.map(v => v.prix).sort((a, b) => a - b);
  const q1Index = Math.floor(prices.length * 0.25);
  const q3Index = Math.floor(prices.length * 0.75);
  const q1 = prices[q1Index];
  const q3 = prices[q3Index];
  const iqr = q3 - q1;
  
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  return vehicles.filter(v => v.prix >= lowerBound && v.prix <= upperBound);
}

// Calculate segment statistics with outlier removal
function calculateSegmentStats(vehicles: Vehicle[]): SegmentStats {
  // Remove outliers first
  const cleanedVehicles = removeOutliers(vehicles);
  if (cleanedVehicles.length === 0) return calculateSegmentStats(vehicles.slice(0, 3));
  
  const prices = cleanedVehicles.map(v => v.prix).sort((a, b) => a - b);
  const kms = cleanedVehicles.map(v => v.kilometrage);
  const ages = cleanedVehicles.map(v => new Date().getFullYear() - v.annee);
  
  // Median price (more robust than mean)
  const mid = Math.floor(prices.length / 2);
  const prixMedian = prices.length % 2 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2;
  
  // Averages
  const prixMoyen = prices.reduce((a, b) => a + b, 0) / prices.length;
  const kmMoyen = kms.reduce((a, b) => a + b, 0) / kms.length;
  const ageMoyen = ages.reduce((a, b) => a + b, 0) / ages.length;
  
  // Calculate price per km depreciation using regression
  let prixParKm = 0;
  if (cleanedVehicles.length >= 5) {
    const n = cleanedVehicles.length;
    const sumKm = kms.reduce((a, b) => a + b, 0);
    const sumPrix = prices.reduce((a, b) => a + b, 0);
    const sumKmPrix = cleanedVehicles.reduce((sum, v) => sum + v.kilometrage * v.prix, 0);
    const sumKm2 = kms.reduce((sum, km) => sum + km * km, 0);
    
    const denominator = n * sumKm2 - sumKm * sumKm;
    if (denominator !== 0) {
      prixParKm = Math.abs((n * sumKmPrix - sumKm * sumPrix) / denominator);
    }
  }
  
  // Fallback: estimate from depreciation rate
  if (prixParKm === 0 || !isFinite(prixParKm) || prixParKm > 1) {
    const avgCarburant = cleanedVehicles[0]?.carburant || 'essence';
    const rate = KM_DEPRECIATION_RATES[avgCarburant];
    prixParKm = (prixMoyen * rate) / 10000;
  }
  
  return {
    key: '',
    count: cleanedVehicles.length,
    prixMedian: Math.round(prixMedian),
    prixMoyen: Math.round(prixMoyen),
    kmMoyen: Math.round(kmMoyen),
    prixParKm: Math.round(prixParKm * 100) / 100,
  };
}

// Calculate age depreciation factor
function getAgeDepreciation(age: number): number {
  let totalDepreciation = 1;
  for (let year = 1; year <= Math.min(age, 10); year++) {
    const yearRate = AGE_DEPRECIATION[Math.min(year, 5)];
    totalDepreciation *= (1 - yearRate);
  }
  return totalDepreciation;
}

// Multi-factor confidence score
function calculateConfidenceScore(
  segmentSize: number,
  usedFallback: boolean,
  hasTransmission: boolean,
  hasPower: boolean,
  hasCarburant: boolean
): number {
  let score = 0;
  
  // Segment size (0-40 points)
  score += Math.min(40, segmentSize * 4);
  
  // Data quality (0-60 points)
  if (!usedFallback) score += 20;
  if (hasCarburant) score += 15;
  if (hasTransmission) score += 15;
  if (hasPower) score += 10;
  
  return Math.min(100, score);
}

// Main analysis function with advanced pricing model
export function analyzeMarket(vehicles: Vehicle[]): Vehicle[] {
  if (vehicles.length === 0) return [];
  
  const currentYear = new Date().getFullYear();
  
  // Step 1: Group by multiple segment levels
  const preciseSegments: Record<string, Vehicle[]> = {};
  const standardSegments: Record<string, Vehicle[]> = {};
  const broadSegments: Record<string, Vehicle[]> = {};
  
  vehicles.forEach(v => {
    const preciseKey = createSegmentKey(v, 'precise');
    const standardKey = createSegmentKey(v, 'standard');
    const broadKey = createSegmentKey(v, 'broad');
    
    if (!preciseSegments[preciseKey]) preciseSegments[preciseKey] = [];
    preciseSegments[preciseKey].push(v);
    
    if (!standardSegments[standardKey]) standardSegments[standardKey] = [];
    standardSegments[standardKey].push(v);
    
    if (!broadSegments[broadKey]) broadSegments[broadKey] = [];
    broadSegments[broadKey].push(v);
  });
  
  // Step 2: Calculate stats for each segment level
  const preciseStats: Record<string, SegmentStats> = {};
  const standardStats: Record<string, SegmentStats> = {};
  const broadStats: Record<string, SegmentStats> = {};
  
  Object.entries(preciseSegments).forEach(([key, segVehicles]) => {
    if (segVehicles.length >= 3) {
      preciseStats[key] = { ...calculateSegmentStats(segVehicles), key };
    }
  });
  
  Object.entries(standardSegments).forEach(([key, segVehicles]) => {
    if (segVehicles.length >= 3) {
      standardStats[key] = { ...calculateSegmentStats(segVehicles), key };
    }
  });
  
  Object.entries(broadSegments).forEach(([key, segVehicles]) => {
    if (segVehicles.length >= 3) {
      broadStats[key] = { ...calculateSegmentStats(segVehicles), key };
    }
  });
  
  // Step 3: Analyze each vehicle
  const analyzedVehicles = vehicles.map(v => {
    const preciseKey = createSegmentKey(v, 'precise');
    const standardKey = createSegmentKey(v, 'standard');
    const broadKey = createSegmentKey(v, 'broad');
    
    // Get best available stats (cascade from precise to broad)
    let stats = preciseStats[preciseKey];
    let usedFallback = false;
    let segmentLevel = 'precise';
    
    if (!stats || stats.count < 3) {
      stats = standardStats[standardKey];
      segmentLevel = 'standard';
    }
    
    if (!stats || stats.count < 3) {
      stats = broadStats[broadKey];
      usedFallback = true;
      segmentLevel = 'broad';
    }
    
    if (!stats) {
      return {
        ...v,
        segment: broadKey,
        prixMoyen: v.prix,
        prixAjuste: v.prix,
        gainPotentiel: 0,
        scoreConfiance: 0,
        ecartKm: 0,
      };
    }
    
    // Calculate km difference
    const ecartKm = v.kilometrage - stats.kmMoyen;
    
    // Base adjusted price from segment median
    let prixAjuste = stats.prixMedian;
    
    // Adjust for km difference
    prixAjuste -= ecartKm * stats.prixParKm;
    
    // Adjust for transmission premium
    if (v.transmission && v.transmission !== 'autre') {
      const transAdj = TRANSMISSION_ADJUSTMENT[v.transmission];
      // If segment includes mixed transmissions, apply adjustment
      if (segmentLevel !== 'precise') {
        prixAjuste *= transAdj;
      }
    }
    
    // Adjust for power if not in precise segment
    if (v.puissance && segmentLevel !== 'precise') {
      const powerBucket = getPowerBucket(v.puissance);
      const powerAdj = POWER_ADJUSTMENT[powerBucket];
      prixAjuste *= powerAdj;
    }
    
    // Ensure price is reasonable
    prixAjuste = Math.max(1000, Math.round(prixAjuste));
    
    // Calculate gain potential
    const gainPotentiel = Math.round(prixAjuste - v.prix);
    
    // Calculate confidence score
    const scoreConfiance = calculateConfidenceScore(
      stats.count,
      usedFallback,
      v.transmission !== 'autre',
      (v.puissance || 0) > 0,
      v.carburant !== 'autre'
    );
    
    return {
      ...v,
      segment: segmentLevel === 'precise' ? preciseKey : segmentLevel === 'standard' ? standardKey : broadKey,
      prixMoyen: stats.prixMedian,
      prixAjuste,
      gainPotentiel,
      scoreConfiance,
      ecartKm: Math.round(ecartKm),
    };
  });
  
  // Step 4: Sort by gain potential (best deals first), weighted by confidence
  return analyzedVehicles.sort((a, b) => {
    const scoreA = (a.gainPotentiel || 0) * (0.5 + (a.scoreConfiance || 0) / 200);
    const scoreB = (b.gainPotentiel || 0) * (0.5 + (b.scoreConfiance || 0) / 200);
    return scoreB - scoreA;
  });
}

// ============================================
// STATISTICS
// ============================================

export function calculateStats(vehicles: Vehicle[]): MarketStats {
  const opportunities = vehicles.filter(v => (v.gainPotentiel || 0) > 1000);
  const totalGains = opportunities.reduce((sum, v) => sum + (v.gainPotentiel || 0), 0);
  const budgetOpportunities = opportunities.reduce((sum, v) => sum + v.prix, 0);
  
  // Find best deal (highest gain with good confidence)
  const meilleureAffaire = opportunities
    .filter(v => (v.scoreConfiance || 0) >= 30)
    .sort((a, b) => {
      const scoreA = (a.gainPotentiel || 0) * (a.scoreConfiance || 0);
      const scoreB = (b.gainPotentiel || 0) * (b.scoreConfiance || 0);
      return scoreB - scoreA;
    })[0];
  
  return {
    totalVehicules: vehicles.length,
    opportunitesDetectees: opportunities.length,
    margeMoyenne: opportunities.length > 0 ? Math.round(totalGains / opportunities.length) : 0,
    budgetTotal: budgetOpportunities,
    meilleureAffaire,
  };
}

export function getUniqueBrands(vehicles: Vehicle[]): string[] {
  const brands = new Set(vehicles.map(v => v.marque));
  return Array.from(brands).sort();
}

export function getUniqueCarburants(vehicles: Vehicle[]): Carburant[] {
  const carburants = new Set(vehicles.map(v => v.carburant).filter(Boolean) as Carburant[]);
  return Array.from(carburants);
}
