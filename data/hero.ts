import type {
  HeroCategory,
  HeroSlide,
  Home02HeroSlide,
  Home03HeroSlide,
  Home04HeroSlide,
  HeroSpecification,
} from "@/types/hero";

export const heroCategories: HeroCategory[] = [
  {
    id: 1,
    icon: "icon-carus-suv",
    label: "SUV",
    filterParam: "body_type",
    filterValue: "suv",
  },
  {
    id: 2,
    icon: "icon-carus-coupe",
    label: "Coupe",
    // Not a body type the backend actually supports yet (only hatchback/saloon/estate/suv) —
    // this honestly returns "no results" rather than silently matching the wrong cars.
    filterParam: "body_type",
    filterValue: "coupe",
  },
  {
    id: 3,
    icon: "icon-carus-hatchback",
    label: "Hatchback",
    filterParam: "body_type",
    filterValue: "hatchback",
  },
  {
    id: 4,
    icon: "icon-carus-hybrid",
    label: "Hybrid",
    // Hybrid is a fuel type, not a body type, in the real vehicle schema.
    filterParam: "fuel_type",
    filterValue: "hybrid",
  },
];

export const heroSlides: HeroSlide[] = [
  {
    id: 1,
    image: "/assets/images/slider/slider1.3.webp",
    title: "Find and sell your dream car with HMP",
    description:
      "We have thousands of car listings, along with the most reputable partners.",
  },
  {
    id: 2,
    image: "/assets/images/slider/slider1.2.webp",
    title: "Find your dream car with HMP",
    description:
      "We have thousands of car listings, along with the most reputable partners.",
  },
  {
    id: 3,
    image: "/assets/images/slider/slider1.1.webp",
    title: "Trusted car buying and selling platform",
    description:
      "We have thousands of car listings, along with the most reputable partners.",
  },
];

export const home02HeroSlides: Home02HeroSlide[] = [
  {
    id: 1,
    image: "/assets/images/slider/slider7.3.webp",
    subtitle: "Luxury Meets Reliability",
    title: "Discover excellence in every new ride",
    description:
      "A dealership is a retail company that sells cars, offering customers choices from brand‑ new models to second hand ones.",
  },
  {
    id: 2,
    image: "/assets/images/slider/slider7.2.webp",
    subtitle: "Luxury Meets Reliability",
    title: "The smart way to begin your adventure",
    description:
      "A dealership is a retail company that sells cars, offering customers choices from brand‑ new models to second hand ones.",
  },
  {
    id: 3,
    image: "/assets/images/slider/slider7.1.webp",
    subtitle: "Luxury Meets Reliability",
    title: "Elevate your lifestyle with HMP cars",
    description:
      "A dealership is a retail company that sells cars, offering customers choices from brand‑ new models to second hand ones.",
  },
];

const home03HeroSpecifications: HeroSpecification[] = [
  {
    id: 1,
    icon: "icon-carus-transmission",
    label: "Transmission",
    value: "Manual",
  },
  {
    id: 2,
    icon: "icon-carus-engine",
    label: "Engine",
    value: "1.2L",
  },
  {
    id: 3,
    icon: "icon-carus-power",
    label: "Max Power",
    value: "89HP",
  },
  {
    id: 4,
    icon: "icon-carus-torque",
    label: "Max Torque",
    value: "110 Nm",
  },
];

export const home03HeroSlides: Home03HeroSlide[] = [
  {
    id: 1,
    image: "/assets/images/slider/slider8.3.webp",
    subtitle: "Luxury Meets Reliability",
    title: "Find the right car for your lifestyle",
    description:
      "Car dealers are businesses that specialize in selling cars, offering buyers a choice between modern models and previously owned vehicles.",
    specifications: home03HeroSpecifications,
  },
  {
    id: 2,
    image: "/assets/images/slider/slider8.2.webp",
    subtitle: "Luxury Meets Reliability",
    title: "Find the car that balances luxury & price",
    description:
      "Car dealers are businesses that specialize in selling cars, offering buyers a choice between modern models and previously owned vehicles.",
    specifications: home03HeroSpecifications,
  },
  {
    id: 3,
    image: "/assets/images/slider/slider8.1.webp",
    subtitle: "Luxury Meets Reliability",
    title: "Find the car that blends safety and style",
    description:
      "Car dealers are businesses that specialize in selling cars, offering buyers a choice between modern models and previously owned vehicles.",
    specifications: home03HeroSpecifications,
  },
];

export const home05HeroSlides: Home02HeroSlide[] = [
  {
    id: 1,
    image: "/assets/images/slider/slider11.3.webp",
    subtitle: "Safety Meets Style",
    title: "Find the car that makes travel effortless",
    description:
      "Dealerships are retail enterprises that sell cars, presenting buyers with options ranging from fresh releases to pre‑owned selections.",
  },
  {
    id: 2,
    image: "/assets/images/slider/slider11.2.webp",
    subtitle: "Power Meets Style",
    title: "Discover the car that suits every lifestyle",
    description:
      "An auto dealership is a retail outlet that specializes in cars, offering customers everything from the latest models to second‑hand vehicles.",
  },
  {
    id: 3,
    image: "/assets/images/slider/slider11.1.webp",
    subtitle: "Trust Meets Quality",
    title: "Pick the car that makes ownership effortless",
    description:
      "A dealership is a retail business that focuses on selling cars, offering customers a range of options from new models to used vehicles.",
  },
];

export const home04HeroSlides: Home04HeroSlide[] = [
  {
    id: 1,
    image: "/assets/images/slider/slider4.3.webp",
    titleLine1: "Mercedes",
    titleLine2: "Maybach S600",
    description:
      "An auto sales company specializes in selling cars to individuals. Suitable for dealership websites.",
    detailUrl: "/listing-detail-v1",
    authorImage: "/assets/images/author/avata-slider2.webp",
    authorName: "Kathryn Murphy",
    authorTime: "3 hours ago",
  },
  {
    id: 2,
    image: "/assets/images/slider/slider4.2.webp",
    titleLine1: "Mercedes",
    titleLine2: "Maybach S600",
    description:
      "Car dealers are businesses dedicated to selling cars, offering customers choices between new models and pre owned vehicles.",
    detailUrl: "/listing-detail-v2",
    authorImage: "/assets/images/author/avata-slider2.webp",
    authorName: "Kathryn Murphy",
    authorTime: "3 hours ago",
  },
  {
    id: 3,
    image: "/assets/images/slider/slider4.1.webp",
    titleLine1: "Mercedes",
    titleLine2: "Maybach S600",
    description:
      "A dealership is a retail company that specializes in cars, giving customers access to both new and used vehicles.",
    detailUrl: "/listing-detail-v3",
    authorImage: "/assets/images/author/avata-slider2.webp",
    authorName: "Kathryn Murphy",
    authorTime: "3 hours ago",
  },
];
