/**
 * Curated city knowledge used to ground Travidy's assistant for destinations
 * other than Rishikesh (Rishikesh is covered by the stored RAG documents).
 * Sourced from the Travidy destination research dossier.
 */

export const CITY_GUIDES: Record<string, string> = {
  goa: `GOA — Travidy city dossier

BAZAARS & SHOPPING
- Anjuna Flea Market (Wed 9:00–19:00): hippie beachside bazaar; fringed leather bags, brass trinkets, handmade jewelry, macramé. ₹200–₹5,000, bargaining recommended.
- Panjim Fontainhas Market (10:00–20:00): Latin quarter heritage stroll; azulejo tiles, cashew feni, Mario Miranda prints. ₹300–₹8,000, fixed price at emporiums.
- Mapusa Friday Market (Fri 8:00–18:30): Goan chorizo sausages, kokum syrup, palm jaggery, dried fish. ₹50–₹1,500.
- Arpora Saturday Night Market (18:00–01:00): resort wear, spices, organic cosmetics, carved wooden lamps. ₹400–₹10,000.
- Calangute Beach Market (10:00–21:00): shell jewelry, beachwear, trinkets. ₹100–₹2,000, bargain hard.
- Calizz / Candolim craft outlets (10:00–19:00): antique brassware, Goan pottery, coconut-shell crafts. ₹500–₹12,000.

ADVENTURE & OUTDOORS
- Scuba diving & snorkeling, Grande Island (from Calangute/Sinquerim): ₹2,500–₹4,000 pp, age 10+, PADI guided.
- Parasailing & jet ski, Calangute/Baga/Anjuna: ₹1,200–₹2,200 pp, 35–100 kg, weather permitting.
- White water rafting, Mhadei River at Valpoi: ₹1,800–₹2,500 pp, age 12+, monsoon season Jul–Oct, Grade II–III.
- Hot air ballooning, Chandor (South Goa): ₹11,000–₹14,000 pp, age 6+, early morning, 45 min flight.
- E-bike island tour, Divar & Chorao Islands: ₹1,500–₹2,500 pp, 3 hours.
- Windsurfing & catamaran, Dona Paula / Benaulim: ₹2,000–₹3,500 per session, age 14+, swimming required.

STAYS
- Ahilya By The Sea, Nerul: ₹22,000–₹38,000 — private sea-facing pools.
- Taj Fort Aguada, Sinquerim: ₹18,000–₹32,000 — hilltop heritage, beach access.
- W Goa, Vagator: ₹16,000–₹28,000 — Rock Pool, nightlife, spa.
- Joseph House Homestay, Fontainhas: ₹3,200–₹5,500 — Portuguese home, walkable Panjim.
- Postcard Velha, Old Goa hilltop: ₹18,000–₹28,000 — secluded luxury.
- Jungle by sturmfrei, Vagator: ₹600–₹900 dorm / ₹2,200 private — backpacker hub, coworking.

WELLNESS & CULTURE
- Devaaya Ayurvedic Center, Divar Island — panchakarma, naturopathy, detox. +91 832 228 0500, devaaya.com
- Ashiyana Yoga Center, Mandrem — hatha yoga, sound healing, breathwork. ashiyana.com
- Dr. Manoj's Ayurveda, Candolim Main Road — pulse diagnosis, herbal consults.

HIDDEN GEMS (route: Panjim → Chorao 15 km → Querim 45 km → Cabo de Rama 85 km → Netravali 105 km → Cola 115 km)
1. Querim (Keri) Beach & Sweet Water Lake — secluded northern tip, casuarina trees.
2. Chorao Island & Salim Ali Bird Sanctuary — car ferry from Ribandar, mangrove kayaking.
3. Cabo de Rama Fort & cliffside cove — panoramic ocean views.
4. Netravali "bubbling" lake — natural methane bubbles in a forest pool.
5. Cola Beach Lagoon — freshwater lagoon meeting the Arabian Sea.

TRAINS
- Goa Express #12780, H. Nizamuddin 15:00 → Madgaon 18:30 (day 2), daily.
- Mandovi Express #10103, CST Mumbai 07:10 → Thivim/Madgaon 18:45, daily.
- Jan Shatabdi #12051, Dadar 05:25 → Thivim 14:30, daily.
- Tejas Express #22119, CST Mumbai 05:50 → Karmali 14:00, 5 days/week.

3-DAY ITINERARY
Day 1 Heritage: Fontainhas walk, Goan-Portuguese lunch, Mandovi sunset cruise.
Day 2 North coast: Chorao mangrove kayaking, Querim Beach & Sweet Water Lake, dinner in Vagator.
Day 3 South solitude: Cabo de Rama Fort, Cola Beach Lagoon afternoon.

ADVISORIES
- Scooter rentals: carry a valid licence and helmet; NH 66 has frequent police checks.
- Monsoon: beach shacks and water sports shut Jun–Sep; mangrove and waterfall treks stay open.`,

  manali: `MANALI — Travidy city dossier

BAZAARS & SHOPPING
- Mall Road Market (10:00–21:00): Kullu shawls, Himachali caps, wooden handicrafts, prayer wheels. ₹150–₹6,000.
- Old Manali Bazaar (10:30–20:30): silver gemstone jewelry, hemp backpacks, leather diaries, knitted woolens. ₹200–₹5,000.
- Tibetan Market (10:00–19:30): carpets, thangka paintings, bamboo artifacts, silver amulets. ₹300–₹12,000.
- Bhuttico Handloom Outlet (10:00–20:00): certified pashmina, tweed coats, Himachali weaves. ₹800–₹18,000, fixed state rates.
- Vashisht Village Market (9:00–20:00): woolen socks, singing bowls, ayurvedic oils, stone carvings. ₹100–₹3,000.

ADVENTURE
- Tandem paragliding, Solang Valley / Dobhi: ₹2,000–₹3,500 pp, 35–95 kg, 10–15 min flight.
- River rafting, Beas River (Babeli/Kullu): ₹1,000–₹1,800 pp, age 12+, 14 km Grade II–III.
- Skiing & snowboarding, Solang / Rohtang: ₹1,500–₹3,000 per session, Dec–Mar, gear included.
- ATV quad biking, Solang / Anjani Mahadev: ₹1,000–₹1,500 per ride.
- Bouldering & rock climbing, Sethan Village / Aleo Crags: ₹1,200–₹2,500 pp.
- Snowmobile safari, Rohtang / Gulaba: ₹1,500–₹2,500, winter and spring only.

STAYS
- Span Resort (Spanish Manor), Kullu-Manali highway: ₹18,000–₹30,000 — Beas riverfront, spa.
- The Himalayan Resort & Spa, Hadimba Road: ₹12,000–₹20,000 — Gothic castle, heated pool.
- Apple Country Resorts, Log Huts area: ₹5,500–₹9,500 — valley views, family friendly.
- The Mudhouse Experience, Jibhi/Sethan: ₹3,000–₹5,500 — eco homestay, fireplace.
- Baragarh Resort & Spa, Naggar Road: ₹14,000–₹24,000 — apple orchards, snow-peak views.
- The Hosteller / Zostel Old Manali: ₹650–₹950 dorm / ₹2,500 private — river views, live music.

CULTURE & HEALING
- Vashisht Vedic Rishi Sansthan, Vashisht Temple complex — sulfur bath rituals, Graha Shanti pujas.
- Himalayan Healing Center, Old Manali — Tibetan bowl sound bath, crystal healing, meditation.

HIDDEN GEMS (route: Mall Road → Sethan 14 km → Anjani Mahadev 15 km → Naggar Castle 21 km → Sissu via Atal Tunnel 40 km)
1. Sethan Village igloo camp at 2,700 m — snow camping, stargazing.
2. Anjani Mahadev waterfall & winter ice Shivling — 45-min trek from Solang.
3. Naggar Castle & Roerich Art Gallery.
4. Sissu waterfall in Lahaul via the Atal Tunnel.
5. Jana Waterfall with traditional Siddu and Himachali thali eateries.

TRANSIT
- HPTDC luxury Volvo, ISBT Kashmiri Gate 18:00/19:30 → Manali 08:00/09:30, ~13–14 hrs, ₹1,200–₹1,800.
- HRTC AC bus, Chandigarh Sector 43 20:30 → Manali 06:00, ~9–10 hrs, ₹800–₹1,200.
- Flights Delhi (DEL) → Bhuntar (KUU) 06:45–08:00; shared cab to Manali ~₹1,200.

3-DAY ITINERARY
Day 1: Hadimba Temple, Vashisht hot springs, Old Manali cafés.
Day 2: Atal Tunnel to Sissu, Sissu waterfall hike, return via Solang.
Day 3: Sethan Village for bouldering, mountain views, quiet village culture.

ADVISORIES
- Rohtang Pass needs a pre-booked green-tax permit from the Himachal tourism portal.
- Jan–Feb: roads past Solang need 4x4 with snow chains.`,

  jaipur: `JAIPUR — Travidy city dossier

BAZAARS & SHOPPING
- Johari Bazaar (10:00–20:30): kundan & meenakari jewelry, silver, gemstones. ₹500–₹50,000+, insist on certificates.
- Bapu Bazaar (10:30–20:00): mojris, Sanganeri block-print linen, Jaipuri quilts. ₹200–₹3,500.
- Chandpole Bazaar (10:00–19:30): marble carvings, wooden puppets, lac bangles. ₹150–₹8,000.
- Kripal Kumbh (10:00–18:00): authentic Jaipur blue pottery. ₹300–₹10,000.
- Tripolia Bazaar (10:00–20:00): Maniharon ka Rasta lac bangles, brass and ironware. ₹100–₹2,500.

HERITAGE EXPERIENCES
- Hot air balloon safari over Amber Fort / Kukas Valley: ₹12,000–₹15,000 pp, age 5+.
- Nahargarh sunset trek along the Aravalli ridge: free trek, nominal entry.
- Elefantic Sanctuary, Amer village: ₹2,500–₹4,000 pp, ethical elephant interaction.
- Heritage walking tour of walled-city gates and havelis: ₹800–₹1,500 pp, 2–3 hrs.
- Bagru block-print workshop (28 km): ₹1,500–₹3,000 pp, hands-on natural dyeing.

STAYS
- Rambagh Palace (Taj), Bhawani Singh Road: ₹45,000–₹85,000.
- The Leela Palace, Kukas/Amer: ₹22,000–₹38,000 — plunge pools, Aravalli backdrop.
- Samode Haveli, Gangapole: ₹12,000–₹22,000 — 17th-century fresco suites.
- Jasvilas heritage homestay, Bani Park: ₹4,500–₹8,000.
- Shahpura House, Bani Park: ₹7,500–₹14,000 — rooftop restaurant.
- Moustache / Royal Osteria hostel, near MI Road: ₹550–₹850 dorm, ₹2,000 private.

VEDIC EXPERTS
- Pt. Kedar Nath Sharma, Johari Bazaar gem hub — horoscope analysis, gemstone certification, vastu. +91 141 257 0123.
- Dr. Mahendra Jyotishi, MI Road — birth chart rectification, gemology remedies.

HIDDEN GEMS (route: City Palace → Gaitore 6 km → Panna Meena Kund 10 km → Galtaji 14 km → Kishan Bagh 16 km)
1. Panna Meena ka Kund — 16th-century symmetrical stepwell near Amer.
2. Galtaji monkey temple in a mountain pass with natural springs.
3. Gaitore ki Chhatriyan — white-marble royal cenotaphs.
4. Jagat Shiromani Temple, Amer — 17th-century Krishna/Meera Bai temple.
5. Kishan Bagh sand-dune park at the Aravalli foothills.

TRAINS TO JAIPUR JN (JP)
- Vande Bharat #20978, New Delhi 15:15 → 19:10, daily except Wed.
- Ajmer Shatabdi #12015, New Delhi 06:10 → 10:40, daily.
- Double Decker #12986, Delhi Sarai Rohilla 17:35 → 22:00, daily.

3-DAY ITINERARY
Day 1: City Palace and Hawa Mahal, Johari & Bapu bazaars, Nahargarh sunset.
Day 2: Amer Fort, Jagat Shiromani Temple, Panna Meena stepwell, Bagru block printing.
Day 3: Gaitore cenotaphs in the morning, Galtaji temple pass in the late afternoon.

ADVISORIES
- Buy the ASI composite ticket (Amer, Jantar Mantar, Nahargarh, Albert Hall) for big savings.
- Buy precious stones only from government-approved Johari Bazaar shops with certificates.`,

  kerala: `MUNNAR & ALLEPPEY — Travidy city dossier

BAZAARS & SOUVENIRS
- Munnar Town Market (9:00–20:00): cardamom, cloves, cinnamon, hill honey, handmade chocolate. ₹100–₹2,500.
- KDHP / Ripple tea outlet (9:00–19:00): single-origin black, green, white and orthodox teas. ₹150–₹3,000.
- Mullakkal Street, Alleppey (9:30–20:30): coir handicrafts, coconut-shell items, brass lamps, banana chips. ₹50–₹2,000.
- Spice Walk plantation store (9:00–18:00): eucalyptus and lemongrass oils, organic vanilla. ₹200–₹4,000.
- Marayoor sandalwood outlet (10:00–17:00): certified sandalwood artifacts, jaggery, forest honey. ₹300–₹8,000.

OUTDOOR & BACKWATERS
- Private houseboat cruise, Punnamada Lake: ₹8,500–₹18,000 per night, Kuttanad meals onboard.
- Shikara / canoe kayaking, Kainakary canals: ₹600–₹1,200 pp, 2–4 hrs.
- Tea estate walking tour, Lockhart / Kolukkumalai: ₹500–₹1,500 pp, leaf picking and tasting.
- Kolukkumalai sunrise jeep, 4:30 AM departure: ₹2,500–₹3,500 per jeep, world's highest organic tea estate.
- Eravikulam National Park safari, Rajamalai: ₹200–₹500 pp, closed Feb–Mar for Nilgiri tahr calving.

STAYS
- Windermere Estate, Pallivasal Munnar: ₹16,000–₹26,000 — 55-acre coffee/cardamom estate.
- Spice Coast Cruises (CGH Earth), Alleppey backwaters: ₹18,000–₹30,000 — eco houseboats, personal chef.
- Fragrant Nature Resort, Pothamedu: ₹9,500–₹16,000 — glass-walled tea-valley rooms.
- Lemon Dew Homestay, Alleppey village: ₹2,500–₹4,500 — canoe trips from the yard.
- Blanket Hotel & Spa, Attukad Waterfall Road: ₹12,000–₹22,000.
- Zostel Munnar / goSTOPS, Devikulam: ₹650–₹950 dorm / ₹2,400 private.

AYURVEDA & KALARI
- Keraleeyam Ayurveda Resort, Alleppey backwaters — abhyangam, herbal steam, rejuvenation. +91 477 224 1468, keraleeyam.com
- Munnar Ayurvedic Healing, Old Munnar — herbal joint relief, steam baths, certified vaidyas.

HIDDEN GEMS (route: Munnar → Anayirangal Dam 22 km → Lakkom Waterfall 25 km → Alleppey 160 km → Pathiramanal 175 km)
1. Anayirangal Dam — tea-carpeted lake where wild elephant herds drink.
2. Lakkom Waterfalls & Marayoor sandalwood forest with ancient dolmens.
3. Pathiramanal Island in Vembanad Lake — boat-only migratory bird sanctuary.
4. Kuttanad below-sea-level paddy trails, farmed 4–10 ft below sea level.
5. Pambadum Shola National Park — guided walks, rare Nilgiri marten.

TRAINS (Ernakulam ERS / Alleppey ALLP)
- Kerala Express #12626, New Delhi 20:10 → Ernakulam 12:30 (day 3), daily.
- Vanchinad Express #16303, Trivandrum 05:45 → Alleppey 08:35 / Ernakulam 09:50, daily.
- Ernakulam Intercity #16305, Kannur 14:35 → Ernakulam 20:55, daily.

4-DAY ITINERARY
Day 1: Munnar Tea Museum and Lockhart estate walk.
Day 2: 4:30 AM Kolukkumalai sunrise jeep, afternoon at Anayirangal Dam.
Day 3: Drive to Alleppey (4 hrs), board the houseboat at Punnamada Jetty by 12:00 PM.
Day 4: Kainakary canoe ride, sunset walk at Marari Beach.

ADVISORIES
- Houseboat check-in is strictly 11:30 AM–12:00 PM; boats anchor by 5:30 PM for fishing-net rules.
- Carry salt or wear leech socks for shola forest and tea estate hikes in rainy months.`,
};

const ALIASES: Record<string, string> = {
  goa: "goa",
  manali: "manali",
  jaipur: "jaipur",
  kerala: "kerala",
  munnar: "kerala",
  alleppey: "kerala",
  "munnar & alleppey": "kerala",
};

/** Resolve a destination id/name (or free-text question) to a curated guide. */
export function findCityGuide(...inputs: (string | null | undefined)[]): string | null {
  const haystack = inputs.filter(Boolean).join(" ").toLowerCase();
  if (!haystack) return null;
  for (const [alias, key] of Object.entries(ALIASES)) {
    if (haystack.includes(alias)) return CITY_GUIDES[key] ?? null;
  }
  return null;
}
