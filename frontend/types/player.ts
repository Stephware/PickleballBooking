export type SlotStatus =
  | "AVAILABLE" | "OCCUPIED" | "PENDING" | "ELAPSED" | "BLOCKED" | "UNAVAILABLE";

export interface Venue {
  venueName: string; venueSlug: string; timezone: string; currency: string;
  logoUrl: string | null; primaryColor: string; secondaryColor: string;
}
export interface Slot {
  startsAt: string; endsAt: string; startsAtUtc: string; endsAtUtc: string;
  status: SlotStatus; totalPrice: number;
}
export interface Court { courtId: number; courtName: string; slots: Slot[]; }
export interface AvailabilityDay {
  date: string; timezone: string; currency: string; isClosed: boolean;
  slotMinutes: number; courts: Court[];
}
export interface Booking {
  bookingCode: string; courtId: number; status: string;
  startsAtUtc: string; endsAtUtc: string; totalAmount: number;
  currency: string; expiresAtUtc: string | null;
}
export interface Payment {
  id: number; paymentMethod: string; amount: number; status: string;
  submittedAtUtc: string; reviewedAtUtc: string | null;
  hasProof: boolean; transactionReference: string | null;
}
export interface PaymentSummary {
  bookingCode: string; bookingStatus: string; bookingTotal: number;
  verifiedTotal: number; balanceDue: number; currency: string; payments: Payment[];
}
export interface SelectedRange {
  courtId: number; courtName: string; date: string; timezone: string;
  currency: string; slots: Slot[];
}
export interface ApiErrorResponse { error?: string; }
