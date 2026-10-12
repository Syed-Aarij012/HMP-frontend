export type LatePriceListCar = {
  id: number;
  image: string;
  title: string;
  price: number;
  href?: string;
};

export const LATE_PRICE_LIST_TOTAL_COUNT = 26;

export const LATE_PRICE_LIST_CARS: LatePriceListCar[] = [
  {
    id: 1,
    image: "/assets/images/section/dealer1.webp",
    title: "2015 Mitsubishi Triton GLS MQ Auto 4x4 MY16 Double Cab",
    price: 73000,
    href: "/listing-detail-v1/1",
  },
  {
    id: 2,
    image: "/assets/images/section/dealer2.webp",
    title: "2021 Skoda Kushaq 1.0 TSI Style AT",
    price: 73000,
    href: "/listing-detail-v2/2",
  },
  {
    id: 3,
    image: "/assets/images/section/dealer3.webp",
    title: "2012 Mercedes-Benz E-Class 2009-2013 E 200 CGI Avantgarde",
    price: 73000,
    href: "/listing-detail-v3/3",
  },
  {
    id: 4,
    image: "/assets/images/section/dealer4.webp",
    title: "2014 Audi A4 2.0 TDI Multitronic",
    price: 73000,
    href: "/listing-detail-v4/4",
  },
];

export function formatLatePriceListPrice(price: number) {
  return `£${price.toLocaleString("en-GB")}`;
}
