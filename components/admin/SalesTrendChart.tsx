"use client";

import { useState } from "react";
import type { SalesReportTrendBucket } from "@/lib/reports/sales-report.service";

// Slots 1 & 2 of the validated categorical palette (node scripts/validate_palette.js
// "#2a78d6,#eb6834" --mode light --surface "#ffffff" — all checks pass: CVD ΔE 24.7,
// normal-vision ΔE 33.6, both clear >=3:1 contrast). The app's own navy brand color
// fails the chart-mark lightness/chroma bands (it's a chrome/text color, not a mark
// hue), so this reuses the reference palette's chart slots instead of forcing it.
const CATALOG_COLOR = "#2a78d6";
const CUSTOM_COLOR = "#eb6834";

const GRIDLINE_COLOR = "#e2e8f0"; // matches border-slate-200, used everywhere else in the admin UI
const AXIS_TEXT_COLOR = "#94a3b8"; // slate-400

function formatCompact(value: number): string {
	if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
	if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
	return Math.round(value).toString();
}

function niceMax(value: number): number {
	if (value <= 0) return 100;
	const exponent = Math.floor(Math.log10(value));
	const magnitude = 10 ** exponent;
	const residual = value / magnitude;
	const niceResidual = residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 5 ? 5 : 10;
	return niceResidual * magnitude;
}

/** Rounded top corners, square baseline — "4px rounded data-end, square at the baseline" mark spec. */
function roundedTopRectPath(x: number, y: number, width: number, height: number, radius: number): string {
	const r = Math.max(0, Math.min(radius, width / 2, height));
	if (height <= 0) return "";
	return `M${x},${y + height} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + width - r},${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${y + height} Z`;
}

type Props = {
	trend: SalesReportTrendBucket[];
	currency: string;
};

const CHART_HEIGHT = 220;
const TOP_PADDING = 12;
const BOTTOM_PADDING = 28;
const LEFT_PADDING = 44;
const RIGHT_PADDING = 12;
const BAND_WIDTH = 48;
const BAR_WIDTH = 20;
const SEGMENT_GAP = 2;

export function SalesTrendChart({ trend, currency }: Props) {
	const [activeIndex, setActiveIndex] = useState<number | null>(null);

	if (trend.length === 0) {
		return <div className="flex h-[220px] items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-400">No revenue in this period.</div>;
	}

	const plotWidth = trend.length * BAND_WIDTH;
	const width = LEFT_PADDING + plotWidth + RIGHT_PADDING;
	const plotHeight = CHART_HEIGHT - TOP_PADDING - BOTTOM_PADDING;
	const maxTotal = niceMax(Math.max(...trend.map((bucket) => bucket.catalogRevenue + bucket.customRevenue)));
	const yTicks = [0, maxTotal / 2, maxTotal];
	const labelEvery = Math.max(1, Math.ceil(trend.length / 10));

	const valueToY = (value: number) => TOP_PADDING + plotHeight - (value / maxTotal) * plotHeight;

	const active = activeIndex !== null ? trend[activeIndex] : null;

	return (
		<div>
			<div className="flex items-center gap-4 text-xs text-slate-500">
				<span className="flex items-center gap-1.5">
					<span aria-hidden className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: CATALOG_COLOR }} />
					Catalog orders
				</span>
				<span className="flex items-center gap-1.5">
					<span aria-hidden className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: CUSTOM_COLOR }} />
					Custom orders (deposits + balances)
				</span>
			</div>

			<div className="relative mt-3 overflow-x-auto">
				<svg width={width} height={CHART_HEIGHT} role="img" aria-label="Revenue over time by catalog and custom orders" style={{ display: "block" }}>
					{yTicks.map((tick) => {
						const y = valueToY(tick);
						return (
							<g key={tick}>
								<line x1={LEFT_PADDING} x2={width - RIGHT_PADDING} y1={y} y2={y} stroke={GRIDLINE_COLOR} strokeWidth={1} />
								<text x={LEFT_PADDING - 8} y={y + 3} textAnchor="end" fontSize={10} fill={AXIS_TEXT_COLOR}>
									{formatCompact(tick)}
								</text>
							</g>
						);
					})}

					{trend.map((bucket, index) => {
						const bandX = LEFT_PADDING + index * BAND_WIDTH;
						const barX = bandX + (BAND_WIDTH - BAR_WIDTH) / 2;
						const catalogHeight = maxTotal === 0 ? 0 : (bucket.catalogRevenue / maxTotal) * plotHeight;
						const customHeight = maxTotal === 0 ? 0 : (bucket.customRevenue / maxTotal) * plotHeight;
						const baseline = TOP_PADDING + plotHeight;
						const catalogTop = baseline - catalogHeight;
						const hasCustomOnTop = bucket.customRevenue > 0;
						const customTop = catalogTop - (hasCustomOnTop ? SEGMENT_GAP + customHeight : 0);
						const isHovered = activeIndex === index;

						return (
							<g key={bucket.bucketStart} opacity={activeIndex === null || isHovered ? 1 : 0.55}>
								{bucket.catalogRevenue > 0 ? (
									hasCustomOnTop ? (
										<rect x={barX} y={catalogTop} width={BAR_WIDTH} height={catalogHeight} fill={CATALOG_COLOR} />
									) : (
										<path d={roundedTopRectPath(barX, catalogTop, BAR_WIDTH, catalogHeight, 4)} fill={CATALOG_COLOR} />
									)
								) : null}
								{hasCustomOnTop ? <path d={roundedTopRectPath(barX, customTop, BAR_WIDTH, customHeight, 4)} fill={CUSTOM_COLOR} /> : null}

								{index % labelEvery === 0 ? (
									<text x={bandX + BAND_WIDTH / 2} y={CHART_HEIGHT - 8} textAnchor="middle" fontSize={10} fill={AXIS_TEXT_COLOR}>
										{bucket.label}
									</text>
								) : null}

								{/* Hit target wider than the bar itself, per interaction spec */}
								<rect
									x={bandX}
									y={TOP_PADDING}
									width={BAND_WIDTH}
									height={plotHeight}
									fill="transparent"
									tabIndex={0}
									aria-label={`${bucket.label}: catalog ${formatCompact(bucket.catalogRevenue)}, custom ${formatCompact(bucket.customRevenue)}`}
									onMouseEnter={() => setActiveIndex(index)}
									onMouseLeave={() => setActiveIndex(null)}
									onFocus={() => setActiveIndex(index)}
									onBlur={() => setActiveIndex(null)}
								/>
							</g>
						);
					})}

					<line x1={LEFT_PADDING} x2={width - RIGHT_PADDING} y1={TOP_PADDING + plotHeight} y2={TOP_PADDING + plotHeight} stroke="#c3c2b7" strokeWidth={1} />
				</svg>

				{active ? (
					<div
						className="pointer-events-none absolute z-10 min-w-[9rem] -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg"
						style={{ left: LEFT_PADDING + (activeIndex ?? 0) * BAND_WIDTH + BAND_WIDTH / 2, top: 4 }}
					>
						<p className="font-medium text-slate-700">{active.label}</p>
						<p className="mt-1 flex items-center justify-between gap-3">
							<span className="text-slate-500">Catalog</span>
							<span className="font-semibold text-slate-900">
								{currency} {active.catalogRevenue.toFixed(0)}
							</span>
						</p>
						<p className="flex items-center justify-between gap-3">
							<span className="text-slate-500">Custom</span>
							<span className="font-semibold text-slate-900">
								{currency} {active.customRevenue.toFixed(0)}
							</span>
						</p>
					</div>
				) : null}
			</div>
		</div>
	);
}
