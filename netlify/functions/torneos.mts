import {neon} from "@netlify/neon";
import type {Context, Config} from "@netlify/functions";

const sql = neon();

async function table(){
    await sql(`
    CREATE TABLE IF NOT EXISTS torneos(
        id TEXT PRIMARY KEY,
        fecha TEXT NOT NULL,
        formato TEXT NOT NULL,
        jugadores TEXT NOT NULL,
        posiciones TEXT NOT NULL,
        cruces TEXT NOT NULL
    )`);
}

export default async (req: Request, _context: Context) => {
    await table();

    if (req.method === "GET") {
        const {searchParams} = new URL(req.url);

        const rows = await sql`SELECT * FROM torneos ORDER BY id DESC`;
        const parsedRows = rows.map(row => ({
            ...row,
            posiciones: JSON.parse(row.posiciones),
            cruces: JSON.parse(row.cruces)
        }));
        return new Response(JSON.stringify(parsedRows), {
            headers: {"Content-Type": "application/json"}
        });
    }
}