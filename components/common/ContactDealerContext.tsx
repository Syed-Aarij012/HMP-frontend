"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { can, useAuth } from "@/contexts/AuthContext";
import type { Car } from "@/types/cars";

// The "Send message" button that opens the ContactDealer modal (#ModalTogglemess) lives in
// several different, globally-mounted sidebar components across the listing-detail pages,
// while the modal itself is mounted once in AllModals — so, like ListingActionsContext does
// for compare/favorite state, this context is the shared place a trigger site can stash
// "which listing is this for" right before the (Bootstrap data-attribute driven) modal opens,
// for ContactDealerForm to read back when the visitor actually submits a message.
export type ContactDealerTarget = {
  listingId: string;
  listingTitle: string;
};

type ContactDealerContextValue = {
  target: ContactDealerTarget | null;
  setContactDealerTarget: (car: Car) => void;
  // SRS §2.2 P1 "message sellers" is a buyer capability; a seller account receives and replies
  // to messages instead, so it isn't offered the "Send message" button. Guests still see it
  // (the form asks them to log in).
  canMessageSellers: boolean;
};

const ContactDealerContext = createContext<ContactDealerContextValue | null>(
  null,
);

export function useContactDealer() {
  const context = useContext(ContactDealerContext);
  if (!context) {
    throw new Error(
      "useContactDealer must be used within ContactDealerProvider",
    );
  }
  return context;
}

export function ContactDealerProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [target, setTarget] = useState<ContactDealerTarget | null>(null);
  const { user } = useAuth();
  const canMessageSellers = !user || can(user, "message-sellers");

  const setContactDealerTarget = useCallback((car: Car) => {
    // Mock/demo cars (data/cars.ts) have no backend ULID, so there's no real listing to
    // message a seller about — leave the target unset rather than pointing the form at an
    // id the API has never heard of.
    if (!car.publicId) {
      setTarget(null);
      return;
    }

    setTarget({ listingId: car.publicId, listingTitle: car.title });
  }, []);

  const value = useMemo(
    () => ({ target, setContactDealerTarget, canMessageSellers }),
    [target, setContactDealerTarget, canMessageSellers],
  );

  return (
    <ContactDealerContext.Provider value={value}>
      {children}
    </ContactDealerContext.Provider>
  );
}
