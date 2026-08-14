import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	asChild?: boolean;
	variant?: "default" | "outline" | "destructive" | "primary" | "secondary" | "ghost";
	size?: "default" | "sm" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, asChild = false, variant = "default", size = "default", ...props }, ref) => {
	const Comp = asChild ? Slot : "button";

	const sizeClasses = {
		default: "px-5 py-3",
		sm: "px-3.5 py-2 text-xs",
		icon: "p-2",
	};

	const variantClasses = {
		default: "bg-stone-900 text-white hover:bg-stone-700 rounded-full",
		outline: "border border-stone-300 bg-white text-stone-900 hover:bg-stone-100 rounded-full",
		destructive: "bg-red-600 text-white hover:bg-red-500 rounded-full",
		// Admin-shell variants: neutral slate surfaces + brand orange accent, distinct from the
		// storefront's warm/pill-shaped button language above.
		primary: "bg-stone-600 text-white shadow-sm shadow-stone-600/20 hover:bg-stone-700 rounded-lg",
		secondary: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 rounded-lg",
		ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-lg",
	};

	return <Comp className={cn("inline-flex items-center justify-center text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60", sizeClasses[size], variantClasses[variant], className)} ref={ref} {...props} />;
});
Button.displayName = "Button";

export { Button };
