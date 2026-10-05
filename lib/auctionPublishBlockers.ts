/**
 * FR-E-032 / FR-F-011 / FR-D-003: what can stop a Cataloged lot from being published, as the
 * codes RunListService::publishBlockers() returns — worded for the consignor, with who has to
 * act, so "why isn't my car in the auction?" has an answer on screen.
 */
export type PublishBlocker = "provenance" | "vat_status" | "v5c_status" | "acquisition_cost" | "condition_report";

export const PUBLISH_BLOCKER_LABELS: Record<PublishBlocker, string> = {
  vat_status: "VAT status needed",
  v5c_status: "V5C (logbook) status needed",
  acquisition_cost: "Acquisition cost needed (margin scheme)",
  condition_report: "Awaiting an inspector's condition report",
  provenance: "Provenance checks haven't cleared",
};

/** Blockers the consignor can fix themselves, in the lot's details form. */
export const CONSIGNOR_FIXABLE: PublishBlocker[] = ["vat_status", "v5c_status", "acquisition_cost"];

export function describeBlocker(code: string): string {
  return PUBLISH_BLOCKER_LABELS[code as PublishBlocker] ?? code.replace(/_/g, " ");
}
