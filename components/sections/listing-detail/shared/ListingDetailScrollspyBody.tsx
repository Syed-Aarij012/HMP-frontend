import ListingDetailScrollspy from "./ListingDetailScrollspy";
import type { Car } from "@/types/cars";

type ListingDetailScrollspyBodyProps = {
  showOverview?: boolean;
  car: Car;
};

export default function ListingDetailScrollspyBody({
  showOverview = true,
  car,
}: ListingDetailScrollspyBodyProps) {
  return <ListingDetailScrollspy showOverview={showOverview} car={car} />;
}
