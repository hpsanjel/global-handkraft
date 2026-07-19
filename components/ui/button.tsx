import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	asChild?: boolean;
	variant?: "default" | "outline" | "destructive";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, asChild = false, variant = "default", ...props }, ref) => {
	const Comp = asChild ? Slot : "button";

	const variantClasses = {
		default: "bg-stone-900 text-white hover:bg-stone-700",
		outline: "border border-stone-300 bg-white text-stone-900 hover:bg-stone-100",
		destructive: "bg-red-600 text-white hover:bg-red-500",
	};

	return <Comp className={cn("inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60", variantClasses[variant], className)} ref={ref} {...props} />;
});
Button.displayName = "Button";

export { Button };
