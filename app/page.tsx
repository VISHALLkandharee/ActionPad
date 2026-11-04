"use client";

import { useEffect, useState } from "react";

type ActionItem = {
  task: string;
  owner: string | null;
  due: string | null;
  priority: "low" | "medium" | "high";
};

type Note = {
  id: number;
  title: string;
  summary: string;
  action_items: ActionItem[];
  created_at: string;
};

export default function Home() {
  const [text, setText] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadNotes() {
    const res = await fetch("/api/notes");
    const data = await res.json();
    setNotes(data.notes ?? []);
  }

  useEffect(() => {
    loadNotes();
  }, []);

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setText("");
      await loadNotes();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-8">
      <h1 className="text-3xl font-bold">ActionPad</h1>

      <section className="space-y-3">
        <textarea
          className="w-full h-40 rounded border p-3"
          placeholder="Paste messy notes here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
          onClick={handleSubmit}
          disabled={loading || text.trim().length < 10}
        >
          {loading ? "Working..." : "Extract action items"}
        </button>
        {error && <p className="text-red-600">{error}</p>}
      </section>

      <section className="space-y-4">
        {notes.map((n) => (
          <article key={n.id} className="rounded border p-4 space-y-2">
            <h2 className="text-xl font-semibold">{n.title}</h2>
            <p className="text-gray-600">{n.summary}</p>
            <ul className="list-disc pl-5">
              {n.action_items.map((a, i) => (
                <li key={i}>
                  {a.task}
                  {a.owner ? ` (${a.owner})` : ""}
                  {a.due ? ` due ${a.due}` : ""} [{a.priority}]
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </main>
  );
}
