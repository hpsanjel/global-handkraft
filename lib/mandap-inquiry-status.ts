export const MANDAP_INQUIRY_STATUSES = ["PENDING", "ACCEPTED", "DECLINED", "PAID"] as const;

export type MandapInquiryStatus = (typeof MANDAP_INQUIRY_STATUSES)[number];

export function isMandapInquiryStatus(value: string): value is MandapInquiryStatus {
	return (MANDAP_INQUIRY_STATUSES as readonly string[]).includes(value);
}

type MandapInquiryStatusMeta = {
	label: string;
	badgeClassName: string;
};

export const MANDAP_INQUIRY_STATUS_META: Record<MandapInquiryStatus, MandapInquiryStatusMeta> = {
	PENDING: {
		label: "Pending Response",
		badgeClassName: "bg-amber-50 text-amber-700 border-amber-200",
	},
	ACCEPTED: {
		label: "Request Accepted",
		badgeClassName: "bg-emerald-50 text-emerald-700 border-emerald-200",
	},
	DECLINED: {
		label: "Request Declined",
		badgeClassName: "bg-red-50 text-red-700 border-red-200",
	},
	PAID: {
		label: "Paid",
		badgeClassName: "bg-sky-50 text-sky-700 border-sky-200",
	},
};
