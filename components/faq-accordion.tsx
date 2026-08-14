"use client";

import { useState } from "react";
import { ChevronDown, CreditCard, Truck, Hammer, RotateCcw, ShieldCheck, MessageCircle, type LucideIcon } from "lucide-react";

export type FaqItem = {
	id: string;
	question: string;
	answer: string;
};

export type FaqCategory = {
	id: string;
	label: string;
	icon: "orders" | "shipping" | "custom" | "returns" | "products" | "account";
	items: FaqItem[];
};

const iconMap: Record<FaqCategory["icon"], LucideIcon> = {
	orders: CreditCard,
	shipping: Truck,
	custom: Hammer,
	returns: RotateCcw,
	products: ShieldCheck,
	account: MessageCircle,
};

function FaqAccordionItem({ item, defaultOpen }: { item: FaqItem; defaultOpen?: boolean }) {
	const [open, setOpen] = useState(Boolean(defaultOpen));

	return (
		<div className="border-b border-stone-200 last:border-b-0">
			<button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center justify-between gap-4 py-5 text-left">
				<span className="text-[15px] font-medium text-stone-900 sm:text-base">{item.question}</span>
				<ChevronDown className={`h-5 w-5 shrink-0 text-stone-700 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
			</button>
			<div className={`grid transition-all duration-300 ease-in-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
				<div className="overflow-hidden">
					<p className="pb-5 text-sm leading-7 text-stone-700 sm:text-[15px]">{item.answer}</p>
				</div>
			</div>
		</div>
	);
}

export function FaqAccordion({ categories }: { categories: FaqCategory[] }) {
	return (
		<div className="space-y-8">
			{categories.map((category, categoryIndex) => {
				const Icon = iconMap[category.icon];
				return (
					<div key={category.id} id={category.id} className="scroll-mt-24 rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-900 text-white">
								<Icon className="h-5 w-5" />
							</div>
							<h2 className="text-lg font-semibold text-stone-900 sm:text-xl">{category.label}</h2>
						</div>
						<div className="mt-2">
							{category.items.map((item, itemIndex) => (
								<FaqAccordionItem key={item.id} item={item} defaultOpen={categoryIndex === 0 && itemIndex === 0} />
							))}
						</div>
					</div>
				);
			})}
		</div>
	);
}
