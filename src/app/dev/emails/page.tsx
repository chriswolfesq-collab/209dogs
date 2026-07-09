"use client";

import { notFound } from "next/navigation";
import { useEffect, useState } from "react";

type DevEmail = {
  id: string;
  to: string;
  subject: string;
  body: string;
  createdAt: string;
};

export default function DevEmailsPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  const [emails, setEmails] = useState<DevEmail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dev/emails")
      .then((res) => res.json())
      .then((data) => setEmails(data.emails))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-1 text-2xl font-semibold">Dev Email Inbox</h1>
      <p className="mb-6 text-sm text-black/60">
        RESEND_API_KEY isn&apos;t set, so outgoing emails are logged here
        instead of being sent. This page is empty once a real API key is
        configured.
      </p>

      {loading ? (
        <p className="text-black/40">Loading…</p>
      ) : emails.length === 0 ? (
        <p className="text-black/60">No emails yet.</p>
      ) : (
        <div className="space-y-3">
          {emails.map((email) => (
            <div key={email.id} className="rounded-lg border border-black/10 bg-white p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{email.subject}</span>
                <span className="text-xs text-black/40">
                  {new Date(email.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="text-xs text-black/50">To: {email.to}</div>
              <pre className="mt-2 whitespace-pre-wrap text-sm text-black/80">
                {email.body}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
