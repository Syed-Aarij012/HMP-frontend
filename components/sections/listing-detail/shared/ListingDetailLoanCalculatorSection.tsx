import ListingDetailLoanCalculatorForm from "./ListingDetailLoanCalculatorForm";
import type { Car } from "@/types/cars";

export default function ListingDetailLoanCalculatorSection({ car }: { car: Car }) {
  return (
    <>
      <div className="listing-line " />
      <div className="listing-calculator loan-calculator-form">
        <div className="box-title">
          <h2 className="title-ct">Finance calculator</h2>
          <p>HP, PCP or PCH — see representative figures for this car before you apply.</p>
        </div>
        <div id="comments" className="comments">
          <div className="respond-comment">
            <ListingDetailLoanCalculatorForm car={car} />
          </div>
        </div>
      </div>
    </>
  );
}
