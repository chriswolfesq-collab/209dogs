"use client";

import { use, useState } from "react";

export default function UnsubscribePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [status, setStatus] = useState<"idle" | "busy" | "done" | "error">("idle");

  async function handleUnsubscribe() {
    setStatus("busy");
    try {
      const res = await fetch(`/api/subscribe/${token}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 text-center">
      <h1 className="mb-2 text-2xl font-semibold">Unsubscribe</h1>
      {status === "done" ? (
        <p className="text-black/60">
          You&apos;ve been unsubscribed from new dog alerts. Sorry to see you go!
        </p>
      ) : status === "error" ? (
        <p className="text-red-600">
          We couldn&apos;t find that subscription. It may already be unsubscribed.
        </p>
      ) : (
        <>
          <p className="mb-6 text-black/60">
            Stop receiving email alerts for newly posted dogs?
          </p>
          <button
            onClick={handleUnsubscribe}
            disabled={status === "busy"}
            className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {status === "busy" ? "Unsubscribing…" : "Unsubscribe"}
          </button>
        </>
      )}
    </div>
  );
}
