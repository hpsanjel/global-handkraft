export function AccountPageHeader({ title, description, actions, level = "h1" }: { title: string; description?: string; actions?: React.ReactNode; level?: "h1" | "h2" }) {
	const Heading = level;

	return (
		<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<Heading className="text-xl font-semibold text-slate-900">{title}</Heading>
				{description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
			</div>
			{actions ? <div className="flex flex-wrap gap-2.5">{actions}</div> : null}
		</div>
	);
}
