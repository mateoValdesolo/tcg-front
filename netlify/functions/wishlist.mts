import { neon } from "@netlify/neon";
import type { Context } from "@netlify/functions";

const sql = neon();

async function table() {
    await sql(`
        CREATE TABLE IF NOT EXISTS wishlist(
            id TEXT PRIMARY KEY,
            collection TEXT NOT NULL
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
        const rows = await sql`SELECT * FROM wishlist WHERE id = ${id}`;
        return new Response(JSON.stringify(rows[0] || {}), {
            headers: { "Content-Type": "application/json" }
        });
    } else if (req.method === "POST") {
        const { id, collection } = await req.json();
        if (!id || !collection) {
            return new Response("Faltan datos", { status: 400 });
        }
        const result = await sql`
            INSERT INTO wishlist (id, collection)
            VALUES (${id}, ${collection})
            ON CONFLICT (id) DO UPDATE SET collection = ${collection}
            RETURNING *`;
        return new Response(JSON.stringify(result[0]), {
            headers: { "Content-Type": "application/json" }
        });
    } else {
        return new Response("Método no permitido", { status: 405 });
    }
}