// Reliable preset Bengaluru locations with coordinates for zero-fail fallback
export const BENGALURU_PRESETS = [
  {
    id: 'kempegowda-airport',
    name: 'Kempegowda International Airport (BLR)',
    shortName: 'BLR Airport, Terminal 1',
    address: 'KIAL Rd, Devanahalli, Bengaluru',
    lat: 13.1986,
    lng: 77.7066,
    category: 'airport'
  },
  {
    id: 'majestic-station',
    name: 'KSR Bengaluru City Railway Station (Majestic)',
    shortName: 'Majestic Railway Station',
    address: 'Kempegowda, Sevashrama, Bengaluru',
    lat: 12.9781,
    lng: 77.5695,
    category: 'transit'
  },
  {
    id: 'mg-road',
    name: 'MG Road Metro Station',
    shortName: 'MG Road Metro',
    address: 'Mahatma Gandhi Rd, Shanthala Nagar, Ashok Nagar, Bengaluru',
    lat: 12.9756,
    lng: 77.6066,
    category: 'metro'
  },
  {
    id: 'koramangala-sony',
    name: 'Koramangala (Sony World Signal)',
    shortName: 'Koramangala 4th Block',
    address: '100 Feet Rd, 4th Block, Koramangala, Bengaluru',
    lat: 12.9352,
    lng: 77.6245,
    category: 'popular'
  },
  {
    id: 'indiranagar-100ft',
    name: 'Indiranagar (100 Feet Road)',
    shortName: 'Indiranagar 100ft Rd',
    address: 'HAL 2nd Stage, Indiranagar, Bengaluru',
    lat: 12.9719,
    lng: 77.6412,
    category: 'popular'
  },
  {
    id: 'whitefield-itpl',
    name: 'International Tech Park Bengaluru (ITPL)',
    shortName: 'ITPL Whitefield',
    address: 'Whitefield Main Rd, Pattandur Agrahara, Bengaluru',
    lat: 12.9866,
    lng: 77.7337,
    category: 'tech-park'
  },
  {
    id: 'electronic-city',
    name: 'Electronic City Phase 1 (Infosys Gate 1)',
    shortName: 'Electronic City Toll',
    address: 'Hosur Rd, Electronic City, Bengaluru',
    lat: 12.8452,
    lng: 77.6602,
    category: 'tech-park'
  },
  {
    id: 'hsr-layout',
    name: 'HSR Layout BDA Complex',
    shortName: 'HSR BDA Complex',
    address: 'Sector 6, HSR Layout, Bengaluru',
    lat: 12.9116,
    lng: 77.6389,
    category: 'popular'
  }
];

export const DEFAULT_BENGALURU_CENTER = {
  lat: 12.9716,
  lng: 77.5946,
  zoom: 12
};
