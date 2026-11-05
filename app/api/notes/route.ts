
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { extractFromNotes } from "@/lib/extract";

const Body = z.object({ text: z.string().trim().min(10).max(8000) });

// Which columns we send back to the page.
const fields = {
  id: true,
  title: true,
  summary: true,
  action_items: true,
  created_at: true,
} as const;

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

    const note = await prisma.notes.create({
      data: {
        raw_text: parsed.data.text,
        title: result.title,
        summary: result.summary,
        action_items: result.actionItems,
      },
      select: fields,
    });

    return Response.json({ note });
  } catch (err) {
    console.error(err);
    return Response.json(
      { error: "Something went wrong. Try again." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const notes = await prisma.notes.findMany({
      orderBy: { created_at: "desc" },
      take: 20,
      select: fields,
    });

    return Response.json({ notes });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Could not load notes." }, { status: 500 });
  }
}












// import { z } from "zod";
// import { pool } from "@/lib/db";
// import { extractFromNotes } from "@/lib/extract";

// const Body = z.object({ text: z.string().trim().min(10).max(8000) });

// export async function POST(req: Request) {
//   let json: unknown;
//   try {
//     json = await req.json();
//   } catch {
//     return Response.json({ error: "Invalid request" }, { status: 400 });
//   }

//   const parsed = Body.safeParse(json);
//   if (!parsed.success) {
//     return Response.json(
//       { error: "Please paste between 10 and 8000 characters." },
//       { status: 400 }
//     );
//   }

//   try {
//     const result = await extractFromNotes(parsed.data.text);
//     const { rows } = await pool.query(
//       `INSERT INTO notes (raw_text, title, summary, action_items)
//        VALUES ($1, $2, $3, $4)
//        RETURNING id, title, summary, action_items, created_at`,
//       [parsed.data.text, result.title, result.summary, JSON.stringify(result.actionItems)]
//     );
//     return Response.json({ note: rows[0] });
//   } catch (err) {
//     console.error(err);
//     return Response.json({ error: "Something went wrong. Try again." }, { status: 500 });
//   }
// }

// export async function GET() {
//   const { rows } = await pool.query(
//     `SELECT id, title, summary, action_items, created_at
//      FROM notes ORDER BY created_at DESC LIMIT 20`
//   );
//   return Response.json({ notes: rows });
// }