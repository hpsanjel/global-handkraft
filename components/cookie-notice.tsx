"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";

const STORAGE_KEY = "cookie-notice-dismissed";

export function CookieNotice() {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		if (!window.localStorage.getItem(STORAGE_KEY)) {
			setVisible(true);
		}
	}, []);

	const dismiss = () => {
		window.localStorage.setItem(STORAGE_KEY, "1");
		setVisible(false);
	};

	if (!visible) {
		return null;
	}

	return (
		<div className="fixed inset-x-0 bottom-0 z-50 border-t border-stone-200 bg-white/95 p-4 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur sm:p-5">
			<div className="mx-auto flex max-w-5xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-start gap-3">
					<span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-600">
						<Cookie className="h-4.5 w-4.5" />
					</span>
					<p className="text-sm text-stone-600">
						We use only strictly necessary cookies to run this site — sign-in sessions and your shopping cart. We don&apos;t use tracking or marketing cookies. Read our{" "}
						<Link href="/privacy" className="font-medium text-stone-900 underline underline-offset-2">
							Privacy Policy
						</Link>{" "}
						for details.
					</p>
				</div>
				<button type="button" onClick={dismiss} className="w-full shrink-0 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-700 sm:w-auto">
					Got it
				</button>
			</div>
		</div>
	);
}
