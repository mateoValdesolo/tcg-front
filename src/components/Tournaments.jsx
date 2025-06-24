import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "./../styles/Tournaments.css";

export function Tournaments() {
    const [tournaments, setTournaments] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetch('/data/tournaments.json')
            .then(res => res.json())
            .then(data => setTournaments(data));
    }, []);

    return (
        <div className="tournaments-container">
            <h2>Torneos</h2>
            <table className="tournaments-table">
                <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Formato</th>
                    <th>Cant. Jugadores</th>
                    <th>Ganador</th>
                    <th>Mazo</th>
                    <th></th>
                </tr>
                </thead>
                <tbody>
                {tournaments.map((t) => (
                    <tr key={t.id}>
                        <td>{t.fecha}</td>
                        <td>{t.formato}</td>
                        <td>{t.jugadores}</td>
                        <td>{t.posiciones[0].jugador}</td>
                        <td>
                            {t.posiciones[0].mazo}
                            {t.posiciones[0].iconos.map((iconUrl, i) => (
                                <img
                                    key={i}
                                    src={iconUrl}
                                    alt=""
                                    style={{ width: 30, height: 30, marginLeft: 6, verticalAlign: "middle" }}
                                />
                            ))}
                        </td>
                        <td>
                            <button
                                className="tournament-btn"
                                onClick={() => navigate(`/torneos/${t.id}`)}
                            >
                                Ver torneo
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}