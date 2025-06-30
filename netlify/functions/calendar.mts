import {neon} from "@netlify/neon";
import type {Context, Config} from "@netlify/functions";

const sql = neon();

async function table(){
    await sql(`
    CREATE TABLE IF NOT EXISTS calendar(
        id TEXT PRIMARY KEY,
        fecha TEXT NOT NULL,
        ubicacion TEXT NOT NULL,
        formato TEXT NOT NULL,
        inscripcion TEXT,
        horario TEXT NOT NULL,
        nombre TEXT NOT NULL,
        maps TEXT
    )`);
}

export default async (req: Request, _context: Context) => {
    await table();

    if (req.method === "GET") {
        const {searchParams} = new URL(req.url);

        const rows = await sql`SELECT * FROM calendar`;
        const parsedRows = rows.map(row => ({
            ...row
        }));
        return new Response(JSON.stringify(parsedRows), {
            headers: {"Content-Type": "application/json"}
        });
    }
}