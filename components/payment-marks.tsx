type MarkProps = { className?: string };

export function VisaMark({ className }: MarkProps) {
	return (
		<svg viewBox="0 0 48 32" className={className} role="img" aria-label="Visa">
			<rect width="48" height="32" rx="5" fill="#1A1F71" />
			<text x="24" y="21.5" textAnchor="middle" fontFamily="Arial, sans-serif" fontStyle="italic" fontWeight="700" fontSize="13" fill="#FFFFFF" letterSpacing="0.5">
				VISA
			</text>
		</svg>
	);
}

export function MastercardMark({ className }: MarkProps) {
	return (
		<svg viewBox="0 0 48 32" className={className} role="img" aria-label="Mastercard">
			<rect width="48" height="32" rx="5" fill="#F4F4F4" />
			<circle cx="20" cy="16" r="8.5" fill="#EB001B" />
			<circle cx="28" cy="16" r="8.5" fill="#F79E1B" />
			<path d="M24 9.8a8.5 8.5 0 0 1 0 12.4 8.5 8.5 0 0 1 0-12.4Z" fill="#FF5F00" />
		</svg>
	);
}

