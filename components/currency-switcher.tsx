"use client";

import { useEffect, useRef, useState } from "react";
import { CURRENCIES } from "@/lib/documents/utils/currency";
import { setPreferredCurrency } from "@/lib/currency-preference";
import { useCurrencyPreference } from "@/hooks/use-currency-preference";

export function CurrencySwitcher() {
	const currency = useCurrencyPreference();
	const [menuOpen, setMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setMenuOpen(false);
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	return (
		<div className="relative" ref={menuRef}>
			<button type="button" onClick={() => setMenuOpen((open) => !open)} className="inline-flex h-9 items-center justify-center rounded-full border border-stone-200 bg-white px-2 text-xs font-medium text-stone-700 transition hover:text-stone-950 sm:h-10 sm:px-3 sm:text-sm" aria-haspopup="true" aria-expanded={menuOpen} aria-label="Choose display currency">
				{currency}
			</button>

			{menuOpen ? (
				<div className="absolute right-0 z-40 mt-2 w-36 overflow-hidden rounded-2xl border border-stone-200 bg-white py-1 text-sm shadow-lg">
					{Object.values(CURRENCIES).map((option) => (
						<button
							key={option.code}
							type="button"
							onClick={() => {
								setPreferredCurrency(option.code);
								setMenuOpen(false);
							}}
							className={`flex w-full items-center justify-between px-4 py-2 text-left transition hover:bg-stone-50 ${option.code === currency ? "font-semibold text-stone-900" : "text-stone-700"}`}
						>
							<span>{option.code}</span>
							<span className="text-stone-400">{option.symbol}</span>
						</button>
					))}
				</div>
			) : null}
		</div>
	);
}
