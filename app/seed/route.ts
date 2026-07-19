import { NextResponse } from "next/server";

export async function GET() {
	return NextResponse.json({
		message: "Seed endpoint ready. Connect your database and add your seed logic here.",
	});
}
