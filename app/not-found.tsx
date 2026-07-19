import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-6 text-center text-stone-800">
			<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">404</p>
			<h1 className="mt-3 text-4xl font-semibold text-stone-900 sm:text-5xl">This page is not available.</h1>
			<p className="mt-4 max-w-xl text-lg leading-8 text-stone-600">The page you were looking for may have moved or no longer exists.</p>
			<Button asChild className="mt-8">
				<Link href="/">Return home</Link>
			</Button>
		</div>
	);
}
