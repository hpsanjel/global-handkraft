"use client";

import { CURRENCIES } from "@/lib/documents/utils/currency";
import { setPreferredCurrency } from "@/lib/currency-preference";
import { useCurrencyPreference } from "@/hooks/use-currency-preference";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function CurrencySwitcher() {
	const currency = useCurrencyPreference();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button type="button" className="inline-flex h-9 items-center justify-center rounded-full border border-stone-200 bg-white px-2 text-xs font-medium text-stone-700 transition hover:text-stone-950 sm:h-10 sm:px-3 sm:text-sm" aria-label="Choose display currency">
					{currency}
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-36">
				{Object.values(CURRENCIES).map((option) => (
					<DropdownMenuItem key={option.code} onSelect={() => setPreferredCurrency(option.code)} className={option.code === currency ? "font-semibold text-stone-900" : "text-stone-700"}>
						<span>{option.code}</span>
						<span className="text-stone-700">{option.symbol}</span>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
