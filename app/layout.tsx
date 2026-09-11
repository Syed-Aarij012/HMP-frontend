import { Figtree, Inter, Outfit } from "next/font/google";
import BootstrapClient from "@/components/common/BootstrapClient";
import FlatAccordionClient from "@/components/common/FlatAccordionClient";
import ScrollTop from "@/components/common/ScrollTop";
import { StickyHeaderOffsetProvider } from "@/contexts/StickyHeaderOffsetContext";
import { AuthProvider } from "@/contexts/AuthContext";
import WowClient from "@/components/common/WowClient";
import { HeaderSearchProvider } from "@/components/headers/HeaderSearch";
import { ListingActionsProvider } from "@/components/common/ListingActionsContext";
import { MobileMenuPathListener } from "@/components/headers/MobileMenu";
import AllModals from "@/components/modals/AllModals";
import "./globals.scss";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
  style: ["normal", "italic"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  style: ["normal", "italic"],
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${figtree.variable} ${inter.variable} ${outfit.variable}`}
    >
      <body>
        <AuthProvider>
          <HeaderSearchProvider>
            <ListingActionsProvider>
              <StickyHeaderOffsetProvider>
              <MobileMenuPathListener />
              <BootstrapClient />
              <WowClient />
              <FlatAccordionClient />
              <AllModals />
              {children}
              <ScrollTop />
              </StickyHeaderOffsetProvider>
            </ListingActionsProvider>
          </HeaderSearchProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
