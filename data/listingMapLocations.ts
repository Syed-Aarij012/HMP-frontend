export type ListingMapLocation = {
  id: number;
  position: [number, number];
  image: string;
  href: string;
  category: string;
  title: string;
  mileage: string;
  fuel: string;
  transmission: string;
  price: string;
  isNew?: boolean;
  photoCount?: number;
};

export const LISTING_MAP_CENTER = { lat: 40.706243, lng: -74.000303 };

export const LISTING_MAP_LOCATIONS: ListingMapLocation[] = [
  {
    id: 1,
    position: [40.706755, -74.006821],
    image: "/assets/images/car-list/car27.webp",
    href: "/listing-detail-v1/1",
    category: "Sedan",
    title: "Mazda 6 Sedan 2.0 Executive (A)",
    mileage: "1032 Km",
    fuel: "Petrol",
    transmission: "Manual",
    price: "£76,500",
    isNew: true,
    photoCount: 6,
  },
  {
    id: 2,
    position: [40.705445, -74.00423],
    image: "/assets/images/car-list/car29.webp",
    href: "/listing-detail-v1/2",
    category: "Sedan",
    title: "Mazda 6 Sedan 2.0 Executive (A)",
    mileage: "1032 Km",
    fuel: "Petrol",
    transmission: "Manual",
    price: "£76,500",
    isNew: true,
    photoCount: 6,
  },
  {
    id: 3,
    position: [40.703859, -74.009766],
    image: "/assets/images/car-list/car2.webp",
    href: "/listing-detail-v1/3",
    category: "Sedan",
    title: "Mazda 6 Sedan 2.0 Executive (A)",
    mileage: "1032 Km",
    fuel: "Petrol",
    transmission: "Manual",
    price: "£76,500",
    isNew: true,
    photoCount: 6,
  },
  {
    id: 4,
    position: [40.706828, -74.014434],
    image: "/assets/images/car-list/car8.webp",
    href: "/listing-detail-v1/4",
    category: "Sedan",
    title: "Mazda 6 Sedan 2.0 Executive (A)",
    mileage: "1032 Km",
    fuel: "Petrol",
    transmission: "Manual",
    price: "£76,500",
    isNew: true,
    photoCount: 6,
  },
  {
    id: 5,
    position: [40.709024, -74.012139],
    image: "/assets/images/car-list/car9.webp",
    href: "/listing-detail-v1/5",
    category: "Sedan",
    title: "Mazda 6 Sedan 2.0 Executive (A)",
    mileage: "1032 Km",
    fuel: "Petrol",
    transmission: "Manual",
    price: "£76,500",
    isNew: true,
    photoCount: 6,
  },
  {
    id: 6,
    position: [40.704015, -73.992613],
    image: "/assets/images/car-list/car10.webp",
    href: "/listing-detail-v1/6",
    category: "Sedan",
    title: "Mazda 6 Sedan 2.0 Executive (A)",
    mileage: "1032 Km",
    fuel: "Petrol",
    transmission: "Manual",
    price: "£76,500",
    isNew: true,
    photoCount: 6,
  },
  {
    id: 7,
    position: [40.7072, -74.0015],
    image: "/assets/images/car-list/car11.webp",
    href: "/listing-detail-v1/7",
    category: "Sedan",
    title: "Mazda 6 Sedan 2.0 Executive (A)",
    mileage: "1032 Km",
    fuel: "Petrol",
    transmission: "Manual",
    price: "£76,500",
    isNew: true,
    photoCount: 6,
  },
  {
    id: 8,
    position: [40.7029, -74.0078],
    image: "/assets/images/car-list/car12.webp",
    href: "/listing-detail-v1/8",
    category: "Sedan",
    title: "Mazda 6 Sedan 2.0 Executive (A)",
    mileage: "1032 Km",
    fuel: "Petrol",
    transmission: "Manual",
    price: "£76,500",
    isNew: true,
    photoCount: 6,
  },
];

export function getListingLatLng(location: ListingMapLocation) {
  return { lat: location.position[0], lng: location.position[1] };
}
