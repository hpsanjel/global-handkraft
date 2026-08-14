export function SkipLink({ targetId = "main-content" }: { targetId?: string }) {
	return (
		<a
			href={`#${targetId}`}
			className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-stone-900 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
		>
			Skip to content
		</a>
	);
}
