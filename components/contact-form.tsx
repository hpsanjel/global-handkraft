"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/inline-alert";

export function ContactForm() {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [message, setMessage] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [feedback, setFeedback] = useState<{ tone: "error" | "success"; text: string } | null>(null);

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setIsSubmitting(true);
		setFeedback(null);

		try {
			const response = await fetch("/api/contact", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name, email, phone, message }),
			});
			const data = await response.json();

			if (response.ok) {
				setFeedback({ tone: "success", text: "Thanks for reaching out — we'll get back to you shortly." });
				setName("");
				setEmail("");
				setPhone("");
				setMessage("");
			} else {
				setFeedback({ tone: "error", text: data.error || "Something went wrong. Please try again." });
			}
		} catch {
			setFeedback({ tone: "error", text: "Something went wrong. Please try again." });
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form className="space-y-4" onSubmit={handleSubmit}>
			<div>
				<label htmlFor="contact-name" className="mb-1 block text-sm font-medium text-stone-700">
					Full name
				</label>
				<Input id="contact-name" name="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
			</div>
			<div>
				<label htmlFor="contact-email" className="mb-1 block text-sm font-medium text-stone-700">
					Email
				</label>
				<Input id="contact-email" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
			</div>
			<div>
				<label htmlFor="contact-phone" className="mb-1 block text-sm font-medium text-stone-700">
					Phone <span className="font-normal text-stone-500">(optional)</span>
				</label>
				<Input id="contact-phone" name="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+47 ..." />
			</div>
			<div>
				<label htmlFor="contact-message" className="mb-1 block text-sm font-medium text-stone-700">
					Message
				</label>
				<textarea id="contact-message" name="message" required value={message} onChange={(e) => setMessage(e.target.value)} className="min-h-36 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-stone-700 focus:ring-2 focus:ring-stone-200" placeholder="How can we help?" />
			</div>
			<Button type="submit" className="w-full" disabled={isSubmitting}>
				{isSubmitting ? "Sending..." : "Send message"}
			</Button>
			{feedback ? <InlineAlert tone={feedback.tone}>{feedback.text}</InlineAlert> : null}
		</form>
	);
}
