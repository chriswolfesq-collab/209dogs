"use client";

import { use, useEffect, useState } from "react";

export default function ConfirmSubscriptionPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [status, setStatus] = useState<"busy" | "done" | "error">("busy");

  useEffect(() => {
    fetch(`/api/subscribe/confirm/${token}`, { method: "POST" })
      .then((res) => setStatus(res.ok ? "done" : "error"))
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <div className="mx-auto max-w-md px-4 py-12 text-center">
      <h1 className="mb-2 text-2xl font-semibold">Confirm Subscription</h1>
      {status === "busy" && <p className="text-black/60">Confirming…</p>}
      {status === "done" && (
        <p className="text-black/60">
          You&apos;re subscribed! You&apos;ll get an email whenever a new lost
          or found dog is posted.
        </p>
      )}
      {status === "error" && (
        <p className="text-red-600">
          We couldn&apos;t find that confirmation link. It may have already
          been used.
        </p>
      )}
    </div>
  );
}
