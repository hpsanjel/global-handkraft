export function AccountPageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
	return (
		<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<h2 className="text-xl font-semibold text-slate-900">{title}</h2>
				{description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
			</div>
			{actions ? <div className="flex flex-wrap gap-2.5">{actions}</div> : null}
		</div>
	);
}
