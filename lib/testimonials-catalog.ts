import { useEffect, useState } from "react";

export type PublicTestimonial = {
	id: string;
	name: string;
	quote: string;
	rating: number;
	image: string | null;
};

let inMemoryTestimonials: PublicTestimonial[] | null = null;

async function fetchTestimonialsFromApi(): Promise<PublicTestimonial[]> {
	const response = await fetch("/api/testimonials", {
		method: "GET",
		cache: "no-store",
	});

	if (!response.ok) {
		throw new Error("Unable to fetch testimonials.");
	}

	const data = (await response.json()) as PublicTestimonial[];
	if (!Array.isArray(data)) {
		return [];
	}

	return data;
}

export async function refreshTestimonialsCatalog() {
	if (typeof window === "undefined") {
		return;
	}

	inMemoryTestimonials = await fetchTestimonialsFromApi();
	window.dispatchEvent(new Event("testimonials:updated"));
}

export function useTestimonialsCatalog() {
	const [testimonials, setTestimonials] = useState<PublicTestimonial[]>(() => inMemoryTestimonials ?? []);

	useEffect(() => {
		let isDisposed = false;

		const syncTestimonials = async () => {
			try {
				if (inMemoryTestimonials) {
					setTestimonials(inMemoryTestimonials);
					return;
				}

				const nextTestimonials = await fetchTestimonialsFromApi();
				inMemoryTestimonials = nextTestimonials;
				if (!isDisposed) {
					setTestimonials(nextTestimonials);
				}
			} catch {
				if (!isDisposed) {
					setTestimonials([]);
				}
			}
		};

		const handleTestimonialsUpdated = () => {
			inMemoryTestimonials = null;
			void syncTestimonials();
		};

		void syncTestimonials();
		window.addEventListener("testimonials:updated", handleTestimonialsUpdated);

		return () => {
			isDisposed = true;
			window.removeEventListener("testimonials:updated", handleTestimonialsUpdated);
		};
	}, []);

	return testimonials;
}
