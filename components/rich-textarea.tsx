"use client";

import { useEffect, useRef } from "react";
import { Bold, Italic, List } from "lucide-react";

type Props = {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	minRows?: number;
	disabled?: boolean;
	showToolbar?: boolean;
	className?: string;
};

function wrapSelection(textarea: HTMLTextAreaElement, marker: string) {
	const { selectionStart, selectionEnd, value } = textarea;
	const selected = value.slice(selectionStart, selectionEnd);
	const newValue = value.slice(0, selectionStart) + marker + selected + marker + value.slice(selectionEnd);
	return {
		newValue,
		cursorStart: selectionStart + marker.length,
		cursorEnd: selectionStart + marker.length + selected.length,
	};
}

function toggleBulletLines(textarea: HTMLTextAreaElement) {
	const { selectionStart, selectionEnd, value } = textarea;
	const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
	const nextBreak = value.indexOf("\n", selectionEnd);
	const lineEnd = nextBreak === -1 ? value.length : nextBreak;

	const lines = value.slice(lineStart, lineEnd).split("\n");
	const allBulleted = lines.every((line) => line.startsWith("- ") || line.trim() === "");
	const newLines = lines.map((line) => {
		if (line.trim() === "") return line;
		return allBulleted ? line.replace(/^- /, "") : line.startsWith("- ") ? line : `- ${line}`;
	});
	const newBlock = newLines.join("\n");

	return {
		newValue: value.slice(0, lineStart) + newBlock + value.slice(lineEnd),
		cursorStart: lineStart,
		cursorEnd: lineStart + newBlock.length,
	};
}

export function RichTextarea({ value, onChange, placeholder, minRows = 3, disabled, showToolbar = false, className = "" }: Props) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		const el = textareaRef.current;
		if (!el) return;
		el.style.height = "auto";
		el.style.height = `${el.scrollHeight}px`;
	}, [value]);

	const applyFormat = (format: "bold" | "italic" | "bullet") => {
		const el = textareaRef.current;
		if (!el) return;

		const result = format === "bold" ? wrapSelection(el, "**") : format === "italic" ? wrapSelection(el, "*") : toggleBulletLines(el);

		onChange(result.newValue);
		requestAnimationFrame(() => {
			el.focus();
			el.setSelectionRange(result.cursorStart, result.cursorEnd);
		});
	};

	return (
		<div>
			{showToolbar ? (
				<div className="mb-1.5 flex items-center gap-1 rounded-t-lg border border-b-0 border-slate-300 bg-slate-50 p-1">
					<button type="button" onClick={() => applyFormat("bold")} disabled={disabled} className="rounded p-1.5 text-slate-500 transition hover:bg-white hover:text-slate-900 disabled:opacity-50" title="Bold" aria-label="Bold">
						<Bold className="h-3.5 w-3.5" />
					</button>
					<button type="button" onClick={() => applyFormat("italic")} disabled={disabled} className="rounded p-1.5 text-slate-500 transition hover:bg-white hover:text-slate-900 disabled:opacity-50" title="Italic" aria-label="Italic">
						<Italic className="h-3.5 w-3.5" />
					</button>
					<button type="button" onClick={() => applyFormat("bullet")} disabled={disabled} className="rounded p-1.5 text-slate-500 transition hover:bg-white hover:text-slate-900 disabled:opacity-50" title="Bullet list" aria-label="Bullet list">
						<List className="h-3.5 w-3.5" />
					</button>
				</div>
			) : null}
			<textarea
				ref={textareaRef}
				value={value}
				onChange={(event) => onChange(event.target.value)}
				placeholder={placeholder}
				disabled={disabled}
				rows={minRows}
				className={`block w-full resize-none overflow-hidden border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-stone-700 focus:ring-2 focus:ring-stone-100 disabled:opacity-60 ${showToolbar ? "rounded-b-lg" : "rounded-lg"} ${className}`}
			/>
		</div>
	);
}
