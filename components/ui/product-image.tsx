import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";

type ProductImageProps = Omit<ImageProps, "fill" | "alt"> & {
	/** Required: describe what's shown (product/category name at minimum), never decorative. */
	alt: string;
	/** Wrapper className — sizing/rounding/border classes that used to live on the background-image div. */
	className?: string;
};

/**
 * Replaces the CSS `background-image` div pattern (which conveys nothing to
 * screen readers) with a real `next/image`. Always fills its wrapper, so the
 * wrapper needs `position: relative` (or another positioning context) and an
 * explicit size — the same box the old div occupied.
 */
export function ProductImage({ alt, className, sizes = "(min-width: 1024px) 25vw, 50vw", ...imageProps }: ProductImageProps) {
	return (
		<div className={cn("relative overflow-hidden", className)}>
			<Image alt={alt} fill sizes={sizes} className="object-cover" {...imageProps} />
		</div>
	);
}
