import type { ReactNode } from "react";

type Block = { type: "paragraph"; content: string } | { type: "list"; items: string[] };

function groupBlocks(text: string): Block[] {
	const lines = text.split("\n");
	const blocks: Block[] = [];
	let paragraphLines: string[] = [];
	let listItems: string[] = [];

	const flushParagraph = () => {
		if (paragraphLines.length > 0) {
			blocks.push({ type: "paragraph", content: paragraphLines.join("\n") });
			paragraphLines = [];
		}
	};
	const flushList = () => {
		if (listItems.length > 0) {
			blocks.push({ type: "list", items: listItems });
			listItems = [];
		}
	};

	for (const line of lines) {
		const bulletMatch = /^\s*[-*]\s+(.*)/.exec(line);
		if (bulletMatch) {
			flushParagraph();
			listItems.push(bulletMatch[1]);
		} else {
			flushList();
			paragraphLines.push(line);
		}
	}
	flushParagraph();
	flushList();

	return blocks;
}

function parseInline(text: string, keyPrefix: string): ReactNode[] {
	const nodes: ReactNode[] = [];
	const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
	let lastIndex = 0;
	let match: RegExpExecArray | null;
	let i = 0;

	while ((match = regex.exec(text)) !== null) {
		if (match.index > lastIndex) {
			nodes.push(text.slice(lastIndex, match.index));
		}
		if (match[1] !== undefined) {
			nodes.push(<strong key={`${keyPrefix}-${i++}`}>{match[1]}</strong>);
		} else if (match[2] !== undefined) {
			nodes.push(<em key={`${keyPrefix}-${i++}`}>{match[2]}</em>);
		}
		lastIndex = regex.lastIndex;
	}
	if (lastIndex < text.length) {
		nodes.push(text.slice(lastIndex));
	}

	return nodes;
}

export function FormattedText({ text, className = "" }: { text: string; className?: string }) {
	if (!text) return null;

	const blocks = groupBlocks(text);

	return (
		<div className={className}>
			{blocks.map((block, index) =>
				block.type === "list" ? (
					<ul key={index} className="my-1 list-disc space-y-0.5 pl-5 first:mt-0 last:mb-0">
						{block.items.map((item, itemIndex) => (
							<li key={itemIndex}>{parseInline(item, `${index}-${itemIndex}`)}</li>
						))}
					</ul>
				) : (
					<p key={index} className="whitespace-pre-wrap break-words first:mt-0 last:mb-0">
						{parseInline(block.content, `${index}`)}
					</p>
				),
			)}
		</div>
	);
}
