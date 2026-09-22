import type { NavMenuItem } from "@/types/navigation";

export const mainNavMenu: NavMenuItem[] = [
  {
    id: "home",
    label: "Home",
    href: "/",
  },
  {
    id: "listing-car",
    label: "Listing Car",
    href: "/listing-list",
  },
  {
    id: "page",
    label: "Page",
    children: [
      { id: "pricing", label: "Pricing", href: "/pricing" },
      { id: "compare", label: "Compare", href: "/compare" },
      {
        id: "dealer",
        label: "Dealer",
        href: "/dealer-listing2",
      },
      {
        id: "agents",
        label: "Agents",
        href: "/sale-agents",
      },
    ],
  },
  {
    id: "blog",
    label: "Blog",
    href: "/blog-grid",
  },
  {
    id: "contact",
    label: "Contact",
    href: "/contact",
  },
];
