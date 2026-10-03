// Destination knowledge base. Costs are rough per-person USD estimates per day (mid-range).
window.DESTINATIONS = {
  "Cape Town": {
    country: "South Africa", emoji: "🌊", best: "Nov–Mar (warm, dry)", currency: "ZAR", daily: { lodging: 90, food: 40, transport: 20 },
    tips: ["Book Table Mountain cable car online and go early to beat wind closures.", "Use Uber/Bolt rather than street taxis.", "Pack layers; the weather changes fast."],
    activities: {
      nature: ["Hike or cable-car up Table Mountain", "Cape Point & Cape of Good Hope drive", "Boulders Beach penguins", "Kirstenbosch Botanical Gardens"],
      culture: ["Robben Island tour", "Bo-Kaap walking tour", "Zeitz MOCAA art museum", "District Six Museum"],
      food: ["Constantia wine estate lunch", "Old Biscuit Mill market", "Braai & seafood at Kalk Bay", "V&A Waterfront dining"],
      adventure: ["Sandboarding at Atlantic Beach", "Shark cage diving (Gansbaai)", "Paragliding off Lion's Head", "Sea kayaking in Simon's Town"],
      relax: ["Camps Bay beach sunset", "Spa day at a Winelands hotel", "Chapman's Peak scenic drive", "Sunset cruise from the Waterfront"]
    }
  },
  "Paris": {
    country: "France", emoji: "🥐", best: "Apr–Jun, Sep–Oct", currency: "EUR", daily: { lodging: 170, food: 70, transport: 15 },
    tips: ["Buy a Navigo Easy pass for the metro.", "Pre-book the Louvre and Eiffel Tower slots.", "Many museums close Monday or Tuesday."],
    activities: {
      nature: ["Luxembourg Gardens picnic", "Seine river walk", "Day trip to Versailles gardens", "Parc des Buttes-Chaumont"],
      culture: ["Louvre Museum", "Musée d'Orsay", "Notre-Dame & Sainte-Chapelle", "Montmartre & Sacré-Cœur"],
      food: ["Bakery crawl in Le Marais", "Cooking class", "Marché des Enfants Rouges", "Bistro dinner in Saint-Germain"],
      adventure: ["Catacombs tour", "Day trip to Mont Saint-Michel", "Cycling the Canal Saint-Martin", "Climb the Arc de Triomphe"],
      relax: ["Eiffel Tower at sunset", "Seine evening cruise", "Café-hopping in the Latin Quarter", "Hammam & spa afternoon"]
    }
  },
  "Tokyo": {
    country: "Japan", emoji: "🗼", best: "Mar–May, Oct–Nov", currency: "JPY", daily: { lodging: 120, food: 50, transport: 15 },
    tips: ["Get a Suica/Pasmo IC card.", "Carry some cash; many small shops are cash-only.", "No tipping, and keep quiet on trains."],
    activities: {
      nature: ["Shinjuku Gyoen garden", "Day trip to Mt. Fuji / Hakone", "Yoyogi Park & Meiji Shrine", "Nikko day trip"],
      culture: ["Senso-ji temple in Asakusa", "teamLab digital art museum", "Edo-Tokyo Museum", "Ghibli Museum"],
      food: ["Tsukiji outer market breakfast", "Ramen in Shinjuku", "Izakaya alley in Yurakucho", "Sushi counter in Ginza"],
      adventure: ["Mario Kart street tour", "Akihabara arcades", "Shibuya Sky & crossing", "Kamakura hike & Great Buddha"],
      relax: ["Onsen (hot spring) visit", "Tea ceremony", "Odaiba waterfront", "Cat café break"]
    }
  },
  "New York": {
    country: "USA", emoji: "🗽", best: "Apr–Jun, Sep–Nov", currency: "USD", daily: { lodging: 240, food: 80, transport: 15 },
    tips: ["Use OMNY tap-to-pay on subway.", "Walk when you can; the grid is easy.", "Broadway rush/lottery tickets save a lot."],
    activities: {
      nature: ["Central Park stroll & bike", "High Line walk", "Brooklyn Bridge Park", "Staten Island Ferry"],
      culture: ["The Met", "9/11 Memorial & Museum", "MoMA", "Broadway show"],
      food: ["Pizza slice crawl", "Chelsea Market", "Brooklyn food tour", "Chinatown dim sum"],
      adventure: ["Top of the Rock / Edge", "Statue of Liberty & Ellis Island", "Brooklyn street-art tour", "Bike across Brooklyn Bridge"],
      relax: ["Jazz night in the Village", "Rooftop bar at sunset", "DUMBO waterfront", "Bookstore & café hopping"]
    }
  },
  "Bali": {
    country: "Indonesia", emoji: "🌴", best: "Apr–Oct (dry)", currency: "IDR", daily: { lodging: 60, food: 25, transport: 15 },
    tips: ["Hire a driver for day trips; it's inexpensive.", "Dress modestly at temples.", "Drink bottled or filtered water only."],
    activities: {
      nature: ["Tegallalang rice terraces", "Sunrise hike up Mt. Batur", "Sekumpul waterfall", "Monkey Forest Ubud"],
      culture: ["Tanah Lot temple", "Ubud art market & palace", "Uluwatu Kecak fire dance", "Balinese cooking class"],
      food: ["Warung crawl in Ubud", "Jimbaran beach seafood", "Coffee plantation tasting", "Smoothie bowls in Canggu"],
      adventure: ["Surf lesson at Kuta/Canggu", "White-water rafting on Ayung", "Snorkel Nusa Penida", "Scuba dive at Amed"],
      relax: ["Traditional Balinese massage", "Yoga in Ubud", "Beach club in Seminyak", "Villa pool day"]
    }
  },
  "Rome": {
    country: "Italy", emoji: "🏛️", best: "Apr–Jun, Sep–Oct", currency: "EUR", daily: { lodging: 140, food: 60, transport: 10 },
    tips: ["Pre-book Colosseum and Vatican tickets.", "Cover shoulders and knees for churches.", "Refill water at the free nasoni fountains."],
    activities: {
      nature: ["Villa Borghese gardens", "Appian Way by bike", "Orange Garden viewpoint", "Day trip to Tivoli"],
      culture: ["Colosseum & Roman Forum", "Vatican Museums & Sistine Chapel", "Pantheon & Piazza Navona", "Trevi Fountain at dawn"],
      food: ["Trastevere food tour", "Pasta-making class", "Testaccio market lunch", "Gelato crawl"],
      adventure: ["Catacombs tour", "Day trip to Pompeii", "Vespa tour of the city", "Ostia Antica ruins"],
      relax: ["Aperitivo in Campo de' Fiori", "Sunset at Janiculum Hill", "Tiber riverside walk", "Espresso at Sant'Eustachio"]
    }
  },
  "Dubai": {
    country: "UAE", emoji: "🏙️", best: "Nov–Mar", currency: "AED", daily: { lodging: 150, food: 60, transport: 25 },
    tips: ["Dress modestly in malls and old town.", "Metro is cheap and clean.", "Plan outdoor activities for early morning or evening."],
    activities: {
      nature: ["Desert safari & dune bashing", "Al Qudra lakes", "Dubai Creek dhow cruise", "Jumeirah Beach"],
      culture: ["Al Fahidi Historic District", "Dubai Museum", "Jumeirah Mosque tour", "Louvre Abu Dhabi day trip"],
      food: ["Gold & spice souks", "Brunch at a Marina restaurant", "Emirati lunch in Al Seef", "Street-food in Deira"],
      adventure: ["Burj Khalifa observation deck", "Skydive Palm Jumeirah", "Aquaventure waterpark", "Ski Dubai"],
      relax: ["Beach club day", "Dubai Fountain show", "Spa at a Palm resort", "Marina walk at sunset"]
    }
  },
  "Lisbon": {
    country: "Portugal", emoji: "🚋", best: "Mar–Jun, Sep–Oct", currency: "EUR", daily: { lodging: 100, food: 45, transport: 10 },
    tips: ["Wear grippy shoes for the hills.", "Tram 28 is crowded; walk the route instead.", "Get a Viva Viagem card."],
    activities: {
      nature: ["Day trip to Sintra", "Cabo da Roca cliffs", "Arrábida beaches", "Miradouro sunset hop"],
      culture: ["Belém Tower & Jerónimos", "Alfama & Fado night", "National Tile Museum", "São Jorge Castle"],
      food: ["Pastéis de nata in Belém", "Time Out Market", "Seafood in Cascais", "Petiscos in Bairro Alto"],
      adventure: ["Surf lesson at Costa da Caparica", "Tuk-tuk tour", "Sailing on the Tagus", "Cycle the riverfront"],
      relax: ["LX Factory browse", "Sunset at Miradouro da Senhora do Monte", "Beach day in Cascais", "Wine bar in Chiado"]
    }
  },
  "Bangkok": {
    country: "Thailand", emoji: "🛺", best: "Nov–Feb", currency: "THB", daily: { lodging: 55, food: 20, transport: 8 },
    tips: ["Use the BTS Skytrain and Grab app.", "Cover shoulders and knees at temples.", "Agree on a fare or insist on the meter."],
    activities: {
      nature: ["Lumphini Park", "Bang Krachao 'green lung' bike ride", "Floating market day trip", "Chao Phraya boat ride"],
      culture: ["Grand Palace & Wat Phra Kaew", "Wat Pho reclining Buddha", "Jim Thompson House", "Wat Arun at sunset"],
      food: ["Yaowarat (Chinatown) street food", "Thai cooking class", "Chatuchak market", "Rooftop dinner"],
      adventure: ["Muay Thai class", "Tuk-tuk night tour", "Ayutthaya day trip", "Damnoen Saduak floating market"],
      relax: ["Thai massage", "Sky bar cocktails", "Mall & café afternoon", "Riverside spa"]
    }
  }
};

window.INTERESTS = [
  { id: "nature", label: "Nature & outdoors", icon: "🌿" },
  { id: "culture", label: "History & culture", icon: "🏛️" },
  { id: "food", label: "Food & drink", icon: "🍜" },
  { id: "adventure", label: "Adventure", icon: "🧗" },
  { id: "relax", label: "Relaxation", icon: "🧖" }
];

// Multipliers applied to the mid-range daily baseline.
window.STYLES = {
  budget: { label: "Budget", mult: 0.6 },
  comfort: { label: "Comfort", mult: 1 },
  luxury: { label: "Luxury", mult: 2.2 }
};
