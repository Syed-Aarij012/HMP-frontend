import ListingDetailScrollspy from "./ListingDetailScrollspy";
import type { Car } from "@/types/cars";

type ListingDetailScrollspyColumnProps = {
  showOverview?: boolean;
  car: Car;
};

export default function ListingDetailScrollspyColumn({
  showOverview = true,
  car,
}: ListingDetailScrollspyColumnProps) {
  return <ListingDetailScrollspy showOverview={showOverview} car={car} />;
}
