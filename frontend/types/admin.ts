export type StaffRole = "OWNER" | "MANAGER" | "STAFF";
export type StaffProfile = {
  id: number; fullName: string; email: string; role: StaffRole; isActive: boolean;
};
export type CourtAdmin = {
  id: number; courtName: string; description: string | null;
  baseHourlyRate: number; isActive: boolean;
};
export type AdminBooking = {
  bookingCode: string; courtId: number; status: string;
  startsAtUtc: string; endsAtUtc: string; guestName: string;
  guestPhone: string | null; guestEmail: string | null;
  totalAmount: number; expiresAtUtc: string | null;
};
export type PendingPayment = {
  paymentId: number; bookingCode: string; guestName: string;
  paymentMethod: string; amount: number; submittedAtUtc: string;
  hasProof: boolean; startsAtUtc: string; bookingStatus: string;
};
export type PaymentAdmin = {
  id: number; paymentMethod: string; amount: number; status: string;
  submittedAtUtc: string; reviewedAtUtc: string | null; hasProof: boolean;
  transactionReference: string | null;
};
export type PaymentSummaryAdmin = {
  bookingCode: string; bookingStatus: string; bookingTotal: number;
  verifiedTotal: number; balanceDue: number; currency: string;
  payments: PaymentAdmin[];
};
export type PricingRuleAdmin = {
  id: number; courtId: number | null; ruleName: string;
  dayOfWeek: number | null; startsAt: string; endsAt: string;
  hourlyRate: number; priority: number; isActive: boolean;
};
export type VenueSettingsAdmin = {
  venueName: string; venueSlug: string; timezone: string; currency: string;
  logoUrl: string | null; primaryColor: string; secondaryColor: string;
  slotMinutes: number; holdMinutes: number;
  bookingAdvanceDays: number; minimumNoticeMinutes: number;
};
export type OperatingHourAdmin = {
  dayOfWeek: number; isClosed: boolean; opensAt: string | null; closesAt: string | null;
};
export type CourtBlockAdmin = {
  id: number; courtId: number; startsAtUtc: string; endsAtUtc: string;
  status: string; reason: string; createdByStaffId: number | null;
};
export type AdminSectionId = "overview" | "schedule" | "payments" | "manage" | "account";
