import { getStripeClient } from "@/lib/stripe";

export interface StripeBalanceAmount {
	amount: number;
	currency: string;
}

export interface StripeAccountInfo {
	businessName: string | null;
	email: string | null;
	country: string | null;
	defaultCurrency: string | null;
	chargesEnabled: boolean;
	payoutsEnabled: boolean;
}

export interface StripePayout {
	id: string;
	amount: number;
	currency: string;
	status: string;
	method: string;
	arrivalDate: string;
	createdAt: string;
}

export interface StripeTransaction {
	id: string;
	type: string;
	description: string | null;
	amount: number;
	net: number;
	fee: number;
	currency: string;
	status: string;
	createdAt: string;
}

export interface StripeOverview {
	configured: boolean;
	available: StripeBalanceAmount[];
	pending: StripeBalanceAmount[];
	account: StripeAccountInfo | null;
	payouts: StripePayout[];
	transactions: StripeTransaction[];
	errors: {
		balance?: string;
		account?: string;
		payouts?: string;
		transactions?: string;
	};
}

function errorMessage(error: unknown) {
	return error instanceof Error ? error.message : "Something went wrong talking to Stripe.";
}

export async function getStripeOverview(): Promise<StripeOverview> {
	const stripe = getStripeClient();

	if (!stripe) {
		return {
			configured: false,
			available: [],
			pending: [],
			account: null,
			payouts: [],
			transactions: [],
			errors: {},
		};
	}

	const [balanceResult, accountResult, payoutsResult, transactionsResult] = await Promise.allSettled([stripe.balance.retrieve(), stripe.accounts.retrieveCurrent(), stripe.payouts.list({ limit: 10 }), stripe.balanceTransactions.list({ limit: 15 })]);

	const errors: StripeOverview["errors"] = {};

	const available = balanceResult.status === "fulfilled" ? balanceResult.value.available.map((entry) => ({ amount: entry.amount, currency: entry.currency })) : [];
	const pending = balanceResult.status === "fulfilled" ? balanceResult.value.pending.map((entry) => ({ amount: entry.amount, currency: entry.currency })) : [];
	if (balanceResult.status === "rejected") {
		errors.balance = errorMessage(balanceResult.reason);
	}

	let account: StripeAccountInfo | null = null;
	if (accountResult.status === "fulfilled") {
		const acc = accountResult.value;
		account = {
			businessName: acc.business_profile?.name ?? acc.settings?.dashboard?.display_name ?? null,
			email: acc.email ?? null,
			country: acc.country ?? null,
			defaultCurrency: acc.default_currency ?? null,
			chargesEnabled: acc.charges_enabled ?? false,
			payoutsEnabled: acc.payouts_enabled ?? false,
		};
	} else {
		errors.account = errorMessage(accountResult.reason);
	}

	let payouts: StripePayout[] = [];
	if (payoutsResult.status === "fulfilled") {
		payouts = payoutsResult.value.data.map((payout) => ({
			id: payout.id,
			amount: payout.amount,
			currency: payout.currency,
			status: payout.status,
			method: payout.method,
			arrivalDate: new Date(payout.arrival_date * 1000).toISOString(),
			createdAt: new Date(payout.created * 1000).toISOString(),
		}));
	} else {
		errors.payouts = errorMessage(payoutsResult.reason);
	}

	let transactions: StripeTransaction[] = [];
	if (transactionsResult.status === "fulfilled") {
		transactions = transactionsResult.value.data.map((tx) => ({
			id: tx.id,
			type: tx.type,
			description: tx.description,
			amount: tx.amount,
			net: tx.net,
			fee: tx.fee,
			currency: tx.currency,
			status: tx.status,
			createdAt: new Date(tx.created * 1000).toISOString(),
		}));
	} else {
		errors.transactions = errorMessage(transactionsResult.reason);
	}

	return { configured: true, available, pending, account, payouts, transactions, errors };
}
