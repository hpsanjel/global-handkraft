"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type DialogVariant = "center" | "sheet-right" | "sheet-bottom" | "drawer-left";

const overlayClass = "dialog-overlay fixed inset-0 z-50 bg-black/40 backdrop-blur-sm";

const variantContentClass: Record<DialogVariant, string> = {
	center: "dialog-content-center fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[1.75rem] bg-white shadow-2xl outline-none",
	"sheet-right": "dialog-content-sheet-right fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-white shadow-2xl outline-none sm:max-w-md",
	"sheet-bottom": "dialog-content-sheet-bottom fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-3xl bg-white shadow-2xl outline-none",
	"drawer-left": "dialog-content-drawer-left fixed inset-y-0 left-0 z-50 flex w-full max-w-xs flex-col bg-white shadow-2xl outline-none",
};

type DialogProps = {
	open: boolean;
	onClose: () => void;
	children: React.ReactNode;
	variant?: DialogVariant;
	className?: string;
	/** Element to move focus to on open; defaults to the dialog content itself. */
	initialFocusRef?: React.RefObject<HTMLElement | null>;
};

export function Dialog({ open, onClose, children, variant = "center", className, initialFocusRef }: DialogProps) {
	return (
		<DialogPrimitive.Root open={open} onOpenChange={(next) => !next && onClose()}>
			<DialogPrimitive.Portal>
				<DialogPrimitive.Overlay className={overlayClass} />
				<DialogPrimitive.Content
					className={cn(variantContentClass[variant], className)}
					onOpenAutoFocus={
						initialFocusRef
							? (event) => {
									event.preventDefault();
									initialFocusRef.current?.focus();
								}
							: undefined
					}
				>
					{children}
				</DialogPrimitive.Content>
			</DialogPrimitive.Portal>
		</DialogPrimitive.Root>
	);
}

export function DialogTitle({ children, className }: { children: React.ReactNode; className?: string }) {
	return <DialogPrimitive.Title className={className}>{children}</DialogPrimitive.Title>;
}

export function DialogDescription({ children, className }: { children: React.ReactNode; className?: string }) {
	return <DialogPrimitive.Description className={className}>{children}</DialogPrimitive.Description>;
}

export function DialogClose({ children, className, label = "Close" }: { children?: React.ReactNode; className?: string; label?: string }) {
	return (
		<DialogPrimitive.Close type="button" className={className} aria-label={!children ? label : undefined}>
			{children ?? <X className="h-4 w-4" aria-hidden="true" />}
		</DialogPrimitive.Close>
	);
}
