"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

export function DropdownMenuContent({ children, className, align = "end" }: { children: React.ReactNode; className?: string; align?: "start" | "end" | "center" }) {
	return (
		<DropdownMenuPrimitive.Portal>
			<DropdownMenuPrimitive.Content align={align} sideOffset={8} className={cn("dropdown-menu-content z-40 overflow-hidden rounded-2xl border border-stone-200 bg-white py-1 text-sm shadow-lg outline-none", className)}>
				{children}
			</DropdownMenuPrimitive.Content>
		</DropdownMenuPrimitive.Portal>
	);
}

export function DropdownMenuItem({ children, className, onSelect, disabled, asChild }: { children: React.ReactNode; className?: string; onSelect?: () => void; disabled?: boolean; asChild?: boolean }) {
	return (
		<DropdownMenuPrimitive.Item
			asChild={asChild}
			disabled={disabled}
			onSelect={(event) => {
				if (asChild) return; // let the child (e.g. next/link) handle its own navigation
				event.preventDefault();
				onSelect?.();
			}}
			className={asChild ? "outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50" : cn("flex w-full cursor-pointer items-center justify-between px-4 py-2 text-left text-stone-700 outline-none transition hover:bg-stone-50 focus:bg-stone-50 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50", className)}
		>
			{children}
		</DropdownMenuPrimitive.Item>
	);
}
