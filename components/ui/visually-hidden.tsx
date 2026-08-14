import * as React from "react";

export function VisuallyHidden({ children, as: Component = "span" }: { children: React.ReactNode; as?: React.ElementType }) {
	return <Component className="sr-only">{children}</Component>;
}
