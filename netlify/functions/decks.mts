import { neon } from "@netlify/neon";
import type { Context } from "@netlify/functions";

const sql = neon();

async function table() {
    await sql(`
        CREATE TABLE IF NOT EXISTS decks(
            id TEXT PRIMARY KEY,
            decks TEXT NOT NULL,
            logos TEXT
        )
    `);
}

export default async (req: Request, _context: Context) => {
    await table();

    if (req.method === "GET") {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) {
            return new Response("Falta el id de usuario", { status: 400 });
        }
        const rows = await sql`SELECT * FROM decks WHERE id = ${id}`;
        return new Response(JSON.stringify(rows), {
            headers: { "Content-Type": "application/json" }
        });
    } else if (req.method === "POST") {
        const { id, decks, logos } = await req.json();
        if (!id || !decks) {
            return new Response("Faltan datos", { status: 400 });
        }
        const result = await sql`
            INSERT INTO decks (id, decks, logos)
            VALUES (${id}, ${decks}, ${logos})
            ON CONFLICT (id) DO UPDATE SET decks = ${decks}, logos = ${logos}
            RETURNING *`;
        return new Response(JSON.stringify(result), {
            headers: { "Content-Type": "application/json" }
        });
    }
}