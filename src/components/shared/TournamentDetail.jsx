import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import "../../styles/TournamentDetail.css";

export function TournamentDetail() {
    const { id } = useParams();
    const [torneo, setTorneo] = useState(null);

    useEffect(() => {
        const fetchTorneo = async () => {
            const res = await fetch(`/.netlify/functions/torneos`);
            if (res.ok) {
                const data = await res.json();
                const found = data.find(t => String(t.id) === String(id));
                setTorneo(found);
            }
        };
        fetchTorneo();
    }, [id]);

    if (!torneo) return <div style={{ padding: 24 }}>Cargando...</div>;

    function renderMazoConIconos(p) {
        return (
            <>
                {p.mazo}
                {Array.isArray(p.iconos) && p.iconos.map((iconUrl, i) => (
                    <img
                        key={i}
                        src={iconUrl}
                        alt=""
                        style={{ width: 35, height: 35, marginLeft: 6, verticalAlign: "middle" }}
                    />
                ))}
            </>
        );
    }

    function groupByRonda(cruces) {
        return cruces.reduce((acc, c) => {
            if (!acc[c.ronda]) acc[c.ronda] = [];
            acc[c.ronda].push(c);
            return acc;
        }, {});
    }


    if (!torneo) return <div style={{ padding: 24 }}>Cargando...</div>;

    const crucesPorRonda = groupByRonda(torneo.cruces || []);

    return (
        <div className="tournament-detail-container">
            <div className="tournaments-detail-header">
                <h2>Detalle del Torneo #{torneo.id}</h2>
                <img
                    src="/logoCom.png"
                    alt="locoCom"
                    className="locoCom-img"
                />
            </div>
            <p><strong>Fecha:</strong> {torneo.fecha}</p>

            <h3>Posiciones</h3>
            <table className="tournament-detail-table">
                <thead>
                <tr>
                    <th>Puesto</th>
                    <th>Jugador</th>
                    <th>Mazo</th>
                    <th>Partidas</th>
                </tr>
                </thead>
                <tbody>
                {torneo.posiciones?.map((p, i) => (
                    <tr key={i}>
                        <td>{p.puesto}</td>
                        <td>{p.jugador}</td>
                        <td>{renderMazoConIconos(p)}</td>
                        <td>{p.partidas}</td>
                    </tr>
                ))}
                </tbody>
            </table>

            <h3>Cruces</h3>
            <table className="tournament-detail-table">
                <thead>
                <tr>
                    <th>Ronda</th>
                    <th>Jugador 1</th>
                    <th>Jugador 2</th>
                    <th>Ganador</th>
                </tr>
                </thead>
                <tbody>
                {Object.entries(crucesPorRonda).map(([ronda, cruces]) => (
                    <React.Fragment key={ronda}>
                        <tr>
                            <td colSpan={4} style={{ background: "#f0f0f0", fontWeight: "bold" }}>{ronda}</td>
                        </tr>
                        {cruces.map((c, i) => (
                            <tr key={i}>
                                <td></td>
                                <td style={{ color: c.ganador === c.jugador1 ? "green" : undefined }}>
                                    {c.jugador1}
                                </td>
                                <td style={{ color: c.ganador === c.jugador2 ? "green" : undefined }}>
                                    {c.jugador2}
                                </td>
                                <td style={{ color: "green", fontWeight: "bold" }}>
                                    {c.ganador}
                                </td>
                            </tr>
                        ))}
                    </React.Fragment>
                ))}
                </tbody>
            </table>
        </div>
    );
}