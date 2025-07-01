import { neon } from "@netlify/neon";
import type { Context } from "@netlify/functions";

const sql = neon();

async function table() {
    await sql(`
        CREATE TABLE IF NOT EXISTS deck(
            id TEXT NOT NULL,
            deckName TEXT NOT NULL,
            collection TEXT NOT NULL,
            logos TEXT,
            PRIMARY KEY (id, deckName)
        )
    `);
}

export default async (req: Request, _context: Context) => {
    await table();

    if (req.method === "GET") {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        const deckName = searchParams.get("deckName");
        if (!id || !deckName) {
            return new Response("Faltan datos", { status: 400 });
        }
        const rows = await sql`SELECT * FROM deck WHERE id = ${id} AND deckName = ${deckName}`;
        return new Response(JSON.stringify(rows), {
            headers: { "Content-Type": "application/json" }
        });
    } else if (req.method === "POST") {
        const { id, deckName, collection, logos } = await req.json();
        if (!id || !deckName || !collection) {
            return new Response("Faltan datos", { status: 400 });
        }
        const safeLogos = logos === undefined || logos === null ? '[]' : logos;
        const result = await sql`
            INSERT INTO deck (id, deckName, collection, logos)
            VALUES (${id}, ${deckName}, ${collection}, ${safeLogos})
                ON CONFLICT (id, deckName) DO UPDATE SET
                collection = ${collection},
                                                  logos = ${safeLogos}
                                                  RETURNING *`;
        return new Response(JSON.stringify(result), {
            headers: { "Content-Type": "application/json" }
        });
    }
}