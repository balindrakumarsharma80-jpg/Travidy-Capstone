import { CalendarDays, ListChecks, MapPin, MessageCircle } from "lucide-react";

export type Destination = {
  id: string;
  name: string;
  tag: string;
  categories: string[];
  price: string;
  rating: string;
  bestTime: string;
  tagline: string;
  dailyBudget: string;
  highlights: string[];
  food: string[];
  imageKey: string;
};

export const EXPLORE_CATEGORIES = [
  "All",
  "Adventure",
  "Spiritual",
  "Beaches",
  "Nature",
  "Culture",
  "Nightlife",
] as const;

export const destinations: Destination[] = [
  {
    id: "rishikesh",
    name: "Rishikesh",
    tag: "Popular",
    categories: ["Adventure", "Spiritual", "Yoga"],
    price: "₹4,500/person",
    rating: "4.8",
    bestTime: "Oct – Apr",
    tagline: "The Yoga Capital of the World & Gateway to the Himalayas.",
    dailyBudget: "₹2,500 – ₹4,500 / day",
    highlights: [
      "River Rafting at Marine Drive",
      "Evening Ganga Aarti at Parmarth Niketan",
      "Beatles Ashram (Chaurasi Kutia)",
      "Ram & Laxman Jhula",
    ],
    food: ["Little Buddha Café", "Chotiwala"],
    imageKey: "rishikesh",
  },
  {
    id: "goa",
    name: "Goa",
    tag: "Trending",
    categories: ["Beaches", "Nightlife", "Culture"],
    price: "₹8,000/person",
    rating: "4.7",
    bestTime: "Nov – Feb",
    tagline: "Sun, sea, sand, and Portuguese heritage charm.",
    dailyBudget: "₹3,500 – ₹7,000 / day",
    highlights: [
      "Palolem & Anjuna Beaches",
      "Fontainhas Latin Quarter walk",
      "Dudhsagar Waterfalls trek",
      "Mandovi River Sunset Cruise",
    ],
    food: ["Fisherman's Wharf", "Thalassa"],
    imageKey: "goa",
  },
  {
    id: "manali",
    name: "Manali",
    tag: "Featured",
    categories: ["Mountains", "Adventure", "Nature"],
    price: "₹6,500/person",
    rating: "4.6",
    bestTime: "Oct – Jun",
    tagline: "Snow-capped peaks, pine valleys, and serene river trails.",
    dailyBudget: "₹3,000 – ₹6,000 / day",
    highlights: [
      "Solang Valley sports",
      "Atal Tunnel drive",
      "Old Manali cafes",
      "Jogini Waterfall hike",
    ],
    food: ["Cafe 1947", "Johnson Bar & Restaurant"],
    imageKey: "manali",
  },
  {
    id: "jaipur",
    name: "Jaipur",
    tag: "Heritage",
    categories: ["Culture", "Heritage", "Spiritual"],
    price: "₹5,000/person",
    rating: "4.7",
    bestTime: "Oct – Mar",
    tagline: "Royal palaces, grand forts, and vibrant pink heritage.",
    dailyBudget: "₹2,500 – ₹5,500 / day",
    highlights: [
      "Amber Fort light show",
      "Hawa Mahal viewpoint",
      "City Palace tour",
      "Chokhi Dhani evening",
    ],
    food: ["LMB Restaurant", "Tapri Central"],
    imageKey: "jaipur",
  },
  {
    id: "kerala",
    name: "Munnar & Alleppey",
    tag: "Scenic",
    categories: ["Nature", "Beaches", "Relaxation"],
    price: "₹9,500/person",
    rating: "4.9",
    bestTime: "Sep – Mar",
    tagline: "Lush tea gardens meet peaceful backwater houseboats.",
    dailyBudget: "₹4,000 – ₹8,000 / day",
    highlights: [
      "Alleppey houseboat cruise",
      "Munnar tea estate walk",
      "Eravikulam National Park",
      "Kathakali cultural dance",
    ],
    food: ["Villa Maya", "Rapsy Restaurant"],
    imageKey: "kerala",
  },
];

export const howItWorks = [
  {
    icon: MapPin,
    title: "Choose Destination",
    desc: "Select from handpicked travel hotspots or type any custom location globally.",
  },
  {
    icon: MessageCircle,
    title: "Chat with AI",
    desc: "Tell us your dates, party size, travel vibe, and total budget.",
  },
  {
    icon: CalendarDays,
    title: "Build Itinerary",
    desc: "Get personalized hotel stays, dining spots, and hidden gem activities added in real-time.",
  },
  {
    icon: ListChecks,
    title: "Follow Checklist",
    desc: "Access automated packing lists, local guidelines, and budget trackers on the go.",
  },
];

export const findDestination = (id: string | undefined) =>
  destinations.find((d) => d.id === id);

export type DestRec = {
  id: string;
  name: string;
  category: "hotel" | "activity" | "attraction" | "restaurant";
  subtitle: string;
  price_label: string;
  rating: number;
  reviews: number;
  duration: string | null;
};

/** Suggestions per destination — surfaced only after the traveller asks for them. */
export const destinationRecs: Record<string, DestRec[]> = {
  rishikesh: [
    { id: "rk1", name: "Shiv Shakti Hostel", category: "hotel", subtitle: "Near Ram Jhula", price_label: "₹1,200 / night", rating: 4.4, reviews: 128, duration: null },
    { id: "rk2", name: "River Rafting", category: "activity", subtitle: "Marine Drive Rapids", price_label: "₹900 / person", rating: 4.6, reviews: 342, duration: "4 hrs" },
    { id: "rk3", name: "Neelkanth Temple", category: "attraction", subtitle: "Morning visit", price_label: "Free", rating: 4.7, reviews: 98, duration: "30 mins" },
    { id: "rk4", name: "Little Buddha Café", category: "restaurant", subtitle: "Healthy food", price_label: "₹400", rating: 4.3, reviews: 256, duration: null },
  ],
  goa: [
    { id: "go1", name: "Anjuna Beach Hostel", category: "hotel", subtitle: "2 mins from the sand", price_label: "₹1,500 / night", rating: 4.5, reviews: 210, duration: null },
    { id: "go2", name: "Dudhsagar Waterfalls Trek", category: "activity", subtitle: "Jeep + trek combo", price_label: "₹1,800 / person", rating: 4.6, reviews: 410, duration: "6 hrs" },
    { id: "go3", name: "Fontainhas Latin Quarter", category: "attraction", subtitle: "Heritage walk", price_label: "Free", rating: 4.7, reviews: 156, duration: "2 hrs" },
    { id: "go4", name: "Thalassa", category: "restaurant", subtitle: "Greek cliffside dining", price_label: "₹1,200 for two", rating: 4.5, reviews: 890, duration: null },
  ],
  manali: [
    { id: "mn1", name: "Old Manali Pine Stay", category: "hotel", subtitle: "Riverside wooden cabin", price_label: "₹1,900 / night", rating: 4.5, reviews: 174, duration: null },
    { id: "mn2", name: "Solang Valley Paragliding", category: "activity", subtitle: "Tandem flight", price_label: "₹2,500 / person", rating: 4.6, reviews: 388, duration: "1 hr" },
    { id: "mn3", name: "Jogini Waterfall Hike", category: "attraction", subtitle: "From Vashisht village", price_label: "Free", rating: 4.7, reviews: 142, duration: "3 hrs" },
    { id: "mn4", name: "Cafe 1947", category: "restaurant", subtitle: "Live music by the river", price_label: "₹800 for two", rating: 4.4, reviews: 512, duration: null },
  ],
  jaipur: [
    { id: "jp1", name: "Haveli Heritage Stay", category: "hotel", subtitle: "Walled city, near Hawa Mahal", price_label: "₹2,200 / night", rating: 4.6, reviews: 199, duration: null },
    { id: "jp2", name: "Amber Fort Light Show", category: "activity", subtitle: "Evening sound & light", price_label: "₹300 / person", rating: 4.5, reviews: 268, duration: "1 hr" },
    { id: "jp3", name: "City Palace & Jantar Mantar", category: "attraction", subtitle: "Guided royal tour", price_label: "₹700", rating: 4.7, reviews: 631, duration: "3 hrs" },
    { id: "jp4", name: "LMB Restaurant", category: "restaurant", subtitle: "Classic Rajasthani thali", price_label: "₹600 for two", rating: 4.4, reviews: 742, duration: null },
  ],
  kerala: [
    { id: "kl1", name: "Alleppey Houseboat", category: "hotel", subtitle: "Private backwater cruise", price_label: "₹7,500 / night", rating: 4.8, reviews: 302, duration: null },
    { id: "kl2", name: "Munnar Tea Estate Walk", category: "activity", subtitle: "Sunrise plantation trail", price_label: "₹600 / person", rating: 4.7, reviews: 188, duration: "2 hrs" },
    { id: "kl3", name: "Eravikulam National Park", category: "attraction", subtitle: "Nilgiri tahr spotting", price_label: "₹200", rating: 4.6, reviews: 421, duration: "3 hrs" },
    { id: "kl4", name: "Rapsy Restaurant", category: "restaurant", subtitle: "Kerala parotta & beef fry", price_label: "₹500 for two", rating: 4.5, reviews: 610, duration: null },
  ],
};
