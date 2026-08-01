"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);

export default function UploadPage() {
	const [file, setFile] = useState<File | null>(null);
	const [uploading, setUploading] = useState(false);
	const [imageUrl, setImageUrl] = useState("");
	const [message, setMessage] = useState("");

	async function handleUpload() {
		if (!file) {
			setMessage("Please select an image");
			return;
		}

		setUploading(true);
		setMessage("");

		try {
			const fileExt = file.name.split(".").pop();
			const fileName = `${Date.now()}.${fileExt}`;

			const { error } = await supabase.storage.from("products").upload(fileName, file);

			if (error) throw error;

			const { data } = supabase.storage.from("products").getPublicUrl(fileName);

			setImageUrl(data.publicUrl);
			setMessage("Upload successful!");
		} catch (err: any) {
			console.error(err);
			setMessage(err.message);
		} finally {
			setUploading(false);
		}
	}

	return (
		<main className="min-h-screen bg-gray-100 p-8">
			<div className="mx-auto max-w-md rounded-xl bg-white p-6 shadow">
				<h1 className="mb-4 text-2xl font-bold">Supabase Image Upload Test</h1>

				<input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mb-4 block w-full" />

				<button onClick={handleUpload} disabled={uploading} className="w-full rounded bg-blue-600 px-4 py-2 text-white disabled:bg-gray-400">
					{uploading ? "Uploading..." : "Upload Image"}
				</button>

				{message && <p className="mt-4 text-sm text-gray-700">{message}</p>}

				{imageUrl && (
					<div className="mt-6">
						<img src={imageUrl} alt="Uploaded" className="w-full rounded border" />

						<textarea readOnly value={imageUrl} className="mt-3 h-24 w-full rounded border p-2 text-sm" />
					</div>
				)}
			</div>
		</main>
	);
}
