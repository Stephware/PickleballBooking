/* eslint-disable @next/next/no-img-element -- local venue-approved branding */
import { RESERVE_LOGO_PATH } from "@/lib/reserve-brand";

export function ReserveMark({ className = "" }: { className?: string }) {
  return <span className={"reserve-logo " + className} aria-hidden="true">
    <img src={RESERVE_LOGO_PATH} alt="" width={150} height={150}/>
  </span>;
}
