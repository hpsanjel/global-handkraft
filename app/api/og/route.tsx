import { ImageResponse } from "next/og";
import { siteConfig } from "@/app/metadata";

export const runtime = "edge";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const title = searchParams.get("title") || siteConfig.name;
	const description = searchParams.get("description") || siteConfig.description;
	const type = searchParams.get("type") || "website";

	try {
		return new ImageResponse(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					flexDirection: "column",
					justifyContent: "flex-start",
					alignItems: "center",
					background: "linear-gradient(180deg, #fff8eb 0%, #fff2d6 100%)",
					padding: "80px 60px",
					position: "relative",
				}}
			>
				{/* Logo at top */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						marginBottom: "60px",
					}}
				>
					<div
						style={{
							width: 120,
							height: 120,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<img
							src="https://handcraftsglobal.com/images/globalhandicraft-logo.png"
							alt="Global Handcrafts"
							style={{
								width: "100%",
								height: "100%",
								objectFit: "contain",
							}}
						/>
					</div>
				</div>

				{/* Title */}
				<div
					style={{
						display: "flex",
						fontSize: 56,
						fontWeight: "bold",
						color: "#1B365D",
						textAlign: "center",
						marginBottom: "30px",
						lineHeight: 1.2,
						maxWidth: 1000,
					}}
				>
					{title}
				</div>

				{/* Description */}
				<div
					style={{
						display: "flex",
						fontSize: 28,
						color: "#6b1f10",
						textAlign: "center",
						lineHeight: 1.4,
						maxWidth: 900,
					}}
				>
					{description}
				</div>

				{/* Bottom accent */}
				<div
					style={{
						position: "absolute",
						bottom: 0,
						left: 0,
						right: 0,
						height: 12,
						background: "linear-gradient(90deg, #1B365D 0%, #4CAF50 100%)",
					}}
				/>
			</div>,
			{
				width: 1200,
				height: 630,
			},
		);
	} catch (error) {
		console.error("OG image generation failed:", error);
		return new Response("Failed to generate image", { status: 500 });
	}
}
