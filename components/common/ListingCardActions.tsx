"use client";

import type { Car } from "@/types/cars";
import { useListingActions } from "@/components/common/ListingActionsContext";

type ListingCardActionsProps = {
  car: Car;
  className?: string;
  iconClassName?: string;
  variant?: "overlay" | "featured";
  favoriteActiveIcon?: "heart" | "trash";
};

export default function ListingCardActions({
  car,
  className = "flex",
  iconClassName = "w-32",
  variant = "overlay",
  favoriteActiveIcon = "trash",
}: ListingCardActionsProps) {
  const {
    isInCompare,
    isFavorite,
    addToCompare,
    toggleFavorite,
    canFavorite,
    removeFromCompare,
  } = useListingActions();

  const compareActive = isInCompare(car.id);
  const favoriteActive = isFavorite(car.id);

  const compareButton = (
    <li
      className={`box-icon ${iconClassName}${compareActive ? " active" : ""}`}
    >
      {compareActive ? (
        <button
          type="button"
          className="icon"
          onClick={(event) => {
            event.stopPropagation();
            removeFromCompare(car.id);
          }}
          aria-label="Remove from compare"
          aria-pressed
        >
          <i className="icon-carus-arrowsleftright" />
        </button>
      ) : (
        <a
          data-bs-toggle="offcanvas"
          data-bs-target="#offcanvasBottom"
          aria-controls="offcanvasBottom"
          className="icon"
          onClick={(event) => {
            event.stopPropagation();
            addToCompare(car);
          }}
          aria-label="Add to compare"
          aria-pressed={false}
        >
          <i className="icon-carus-arrowsleftright" />
        </a>
      )}
    </li>
  );

  const favoriteButton = canFavorite && (
    <li
      className={`box-icon ${iconClassName}${favoriteActive ? " active" : ""}`}
    >
      <button
        type="button"
        className="icon"
        onClick={() => toggleFavorite(car)}
        aria-label={
          favoriteActive ? "Remove from favorites" : "Add to favorites"
        }
        aria-pressed={favoriteActive}
      >
        <i
          className={
            favoriteActive
              ? favoriteActiveIcon === "trash"
                ? "icon-carus-trashsimple"
                : "icon-carus-heartstraight"
              : "icon-carus-heart"
          }
        />
      </button>
    </li>
  );

  return (
    <ul className={`change-heart ${className}`.trim()}>
      {variant === "featured" ? (
        <>
          {favoriteButton}
          {compareButton}
        </>
      ) : (
        <>
          {compareButton}
          {favoriteButton}
        </>
      )}
    </ul>
  );
}
