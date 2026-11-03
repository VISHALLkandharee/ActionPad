import { z } from "zod";
import { pool } from "@/lib/db";
import { extractFromNotes } from "@/lib/extract";

const Body = z.object({ text: z.string().trim().min(10).max(8000) });

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: "Please paste between 10 and 8000 characters." },
      { status: 400 }
    );
  }

  try {
    const result = await extractFromNotes(parsed.data.text);
    const { rows } = await pool.query(
      `INSERT INTO notes (raw_text, title, summary, action_items)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, summary, action_items, created_at`,
      [parsed.data.text, result.title, result.summary, JSON.stringify(result.actionItems)]
    );
    return Response.json({ note: rows[0] });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}

export async function GET() {
  const { rows } = await pool.query(
    `SELECT id, title, summary, action_items, created_at
     FROM notes ORDER BY created_at DESC LIMIT 20`
  );
  return Response.json({ notes: rows });
}