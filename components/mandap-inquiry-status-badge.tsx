import { MANDAP_INQUIRY_STATUS_META, isMandapInquiryStatus } from "@/lib/mandap-inquiry-status";

export function MandapInquiryStatusBadge({ status }: { status: string }) {
	const meta = isMandapInquiryStatus(status) ? MANDAP_INQUIRY_STATUS_META[status] : null;
	const label = meta?.label ?? status;
	const className = meta?.badgeClassName ?? "bg-stone-100 text-stone-700 border-stone-200";

	return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>{label}</span>;
}
