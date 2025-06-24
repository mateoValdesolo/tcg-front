import {neon} from "@netlify/neon";
import type {Context, Config} from "@netlify/functions";

const sql = neon();

// Table
async function table(){
    await sql(`
    CREATE TABLE IF NOT EXISTS binder(
        id TEXT PRIMARY KEY,
        cartas TEXT NOT NULL
    )`);
}

export default async (req: Request, _context: Context) => {
    await table();

    if (req.method === "GET") {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) {
            return new Response("Falta el id de usuario", { status: 400 });
        }
        const rows = await sql`SELECT * FROM binder WHERE id = ${id}`;
        return new Response(JSON.stringify(rows), {
            headers: { "Content-Type": "application/json" }
        });
    } else if (req.method === "POST") {
        const { id, cartas } = await req.json();
        if (!id || !cartas) {
            return new Response("Faltan datos", { status: 400 });
        }
        const result = await sql`
            INSERT INTO binder (id, cartas)
            VALUES (${id}, ${cartas})
                ON CONFLICT (id) DO UPDATE SET cartas = ${cartas}
                                        RETURNING *`;
        return new Response(JSON.stringify(result), {
            headers: { "Content-Type": "application/json" }
        });
    }
}