/**
 * Episode overrides — custom short descriptions and category tags.
 * Keyed by a slug derived from the RSS episode title.
 * If an override exists, it takes priority over the RSS description.
 *
 * Description rule: Must open with a framing clause that names the product,
 * category, or business model (never a bare noun).
 * Pattern: "[What the company does]: [key topics covered]."
 * One to two sentences max.
 */

const episodeOverrides = {
  // --- Newest first ---
  "lotties-meats-chelsey-cassie-maschhoff": {
    brand: "Lottie's Meats",
    guest: "Chelsey & Cassie Maschhoff",
    category: "Food & Beverage",
    desc: "Building a premium sausage brand: USDA facility constraints, frozen DTC economics, and competing in a category where consumers think mostly about price.",
    website: "https://lottiesmeats.com",
  },
  "bytem-jack-davis-jacob-tubis": {
    brand: "Byte'm",
    guest: "Jack Davis & Jacob Tubis",
    category: "Food & Beverage",
    desc: "Translating a home brownie recipe into scalable production: ingredient costs, packaging as communication, and building retail distribution from scratch.",
  },
  "armada-seamus-meniahane": {
    brand: "Armada",
    guest: "Seamus Meniahane",
    category: "Logistics",
    desc: "How modern band merch actually works: sourcing blanks, screen printing, tour logistics, and the economics of artist merchandise.",
  },
  "lil-tuffy": {
    brand: "Lil Tuffy",
    guest: "Lil Tuffy",
    category: "Art & Design",
    desc: "Two decades of concert poster art: print runs, revenue splits, screen printing logistics, and the evolution from promo material to collectible merch.",
  },
  "muttville-sherri-franklin": {
    brand: "Muttville",
    guest: "Sherri Franklin",
    category: "Nonprofit",
    desc: "Running a senior dog rescue at scale: foster networks, adoption mechanics, nonprofit structure, and placing over 14,000 dogs.",
  },
  "kelly-bennett": {
    brand: "Kelly Bennett",
    guest: "Kelly Bennett",
    category: "Strategy",
    desc: "Pre-launch brand strategy for CPG founders: retail positioning, demand creation, building in public, and turning a podcast into a client funnel.",
  },
  "pickle-brian-mcmahon": {
    brand: "Pickle",
    guest: "Brian McMahon",
    category: "Marketplace",
    desc: "Peer-to-peer rental marketplace mechanics: the pivot from social polling, personally completing thousands of deliveries, and building network effects.",
  },
  "hiya-adam-gillman": {
    brand: "Hiya",
    guest: "Adam Gillman",
    category: "Health & Wellness",
    desc: "Rethinking children's vitamins: 100% subscription from day one, formulation tradeoffs, bootstrapped growth, and the path to acquisition.",
  },
  "sourmilk-kiki-couchman-elan-halpern": {
    brand: "Sourmilk",
    guest: "Kiki Couchman & Elan Halpern",
    category: "Food & Beverage",
    desc: "Probiotic yogurt formulated around specific strains: sourcing grass-fed dairy, co-manufacturing from scratch, and gut-health as a product thesis.",
  },
  "light-joe-hollier": {
    brand: "Light",
    guest: "Joe Hollier",
    category: "Consumer Tech",
    desc: "Building the Light Phone: hardware in a software world, Foxconn at small scale, NRE costs, bill of materials, tariffs, and inventory financing.",
  },
  "hotel-ceramics-sara-victorio": {
    brand: "Hotel Ceramics",
    guest: "Sara Victorio",
    category: "Home Goods",
    desc: "One-person handmade ceramics studio: slip casting vs. wheel throwing, kiln capacity, drop-based sales, and pricing when the founder is the sole producer.",
  },
  "felt-fat-nate-mell": {
    brand: "Felt + Fat",
    guest: "Nate Mell",
    category: "Home Goods",
    desc: "Scaling a ceramics studio: restaurant tableware, debt-financed equipment, vertical integration limits, and financial distress as a forcing function.",
  },
  "one-trick-pony-lucy-dana": {
    brand: "One Trick Pony",
    guest: "Lucy Dana",
    category: "Food & Beverage",
    desc: "Peanut butter built around Argentinian peanuts: supplier selection tradeoffs, custom jar design as a growth lever, and balancing DTC with retail.",
  },
  "gob-lauryn-menard": {
    brand: "GOB",
    guest: "Lauryn Menard",
    category: "Health & Wellness",
    desc: "Rethinking single-use products with mycelium earplugs: commercializing a new biomaterial, pricing in a price-sensitive category, and subscription as the core model.",
  },
  "jones-hilary-dubin-caroline-huber": {
    brand: "Jones",
    guest: "Hilary Dubin & Caroline Huber",
    category: "Health & Wellness",
    desc: "Nicotine cessation for vapers: regulated physical product alongside software, FDA economics, and fundraising in a tightly regulated space.",
  },
  "erstwhile-jared": {
    brand: "Erstwhile",
    guest: "Jared",
    category: "Jewelry",
    desc: "Fifth-generation jeweler: antique and vintage jewelry, family legacy from Russia to America, and building a modern brand on century-old expertise.",
  },
  "nymzo-elliott-walker-tim-hucklesby": {
    brand: "Nymzo",
    guest: "Elliott Walker & Tim Hucklesby",
    category: "Games & Leisure",
    desc: "A modern chess brand built from scratch: tooling decisions, material choices, MOQs, and bootstrapping a premium physical product.",
  },
  "young-jerks-weastcoast": {
    brand: "Young Jerks / Weastcoast",
    guest: "Dan Cassaro, Dan Christofferson & Meg Yahashi",
    category: "Games & Leisure",
    desc: "From branding studio to board game company: product development, manufacturing, and running two businesses simultaneously.",
  },
  "bezi-ilay-karateke": {
    brand: "Bezi",
    guest: "Ilay Karateke",
    category: "Food & Beverage",
    desc: "Introducing labneh to U.S. grocery: retail-first strategy, in-store demos, bootstrapping against funded competitors, and scaling inside Whole Foods.",
  },
  "currently-running-nash-howe": {
    brand: "Currently Running",
    guest: "Nash Howe",
    category: "Apparel",
    desc: "Running apparel at the intersection of product, art, and storytelling: sourcing, manufacturing, pricing, and building a brand with intention.",
  },
  "almond-surfboards-dave-allee": {
    brand: "Almond Surfboards",
    guest: "Dave Allee",
    category: "Consumer Products",
    desc: "17 years of surfboard shaping: 1960s craft nostalgia, retail in Costa Mesa, custom orders, and stubbornly paddling in the same direction.",
  },
  "alecs-ice-cream-alec-jaffe": {
    brand: "Alec's Ice Cream",
    guest: "Alec Jaffe",
    category: "Food & Beverage",
    desc: "Regenerative A2 dairy ice cream: rebuilding a factory in Sonoma, cold-chain logistics, ingredient costs, and Culture Cup going viral on TikTok.",
  },
  "stonemaier-games-jamey-stegmaier": {
    brand: "Stonemaier Games",
    guest: "Jamey Stegmaier",
    category: "Games & Leisure",
    desc: "From Kickstarter to $20-25M in revenue: tabletop game publishing, direct-to-consumer logistics, and bringing joy to tabletops worldwide.",
  },
  "spring-mulberry-kathryn-shaw": {
    brand: "Spring & Mulberry",
    guest: "Kathryn Shaw",
    category: "Food & Beverage",
    desc: "Building a chocolate brand without refined sugar: co-manufacturing, MOQs, cacao market chaos, and premium positioning in grocery.",
  },
  "talea-beer-co-tara-hankinson-leann-darland": {
    brand: "Talea Beer Co",
    guest: "Tara Hankinson & LeAnn Darland",
    category: "Food & Beverage",
    desc: "Co-founding a brewery: Navy to Google to beer, sourcing, taproom economics, and building a community-driven brand.",
  },
  "pf-candle-co-kristen-pumphrey-tom-neuberger": {
    brand: "PF Candle Co",
    guest: "Kristen Pumphrey & Tom Neuberger",
    category: "Home Goods",
    desc: "From Etsy shop to home fragrance brand: making everything in-house in LA, scaling production, and the husband-wife operating dynamic.",
  },
  "le-puzz-alistair-matthews-michael-hunter": {
    brand: "Le Puzz",
    guest: "Alistair Matthews & Michael Hunter",
    category: "Games & Leisure",
    desc: "Artist-run jigsaw puzzles from Brooklyn: pandemic origins, sourcing from existing collections, and turning a hobby into a full-time business.",
  },
  "alecs-ice-cream-trailer": {
    brand: "Alec's Ice Cream (Trailer)",
    guest: "Alec Jaffe",
    category: "Food & Beverage",
    desc: "A preview of our conversation with Alec Jaffe, founder of the first certified regenerative A2-dairy ice cream brand in the country.",
  },
  "craighill-zach-fried": {
    brand: "Craighill",
    guest: "Zach Fried",
    category: "Home Goods",
    desc: "Building a design-forward objects brand: sourcing globally, community-driven customer acquisition, retention strategies, and new product development.",
  },
};

module.exports = episodeOverrides;
