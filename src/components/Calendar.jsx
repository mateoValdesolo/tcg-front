import React, { useEffect, useState } from "react";
import "../styles/Calendar.css";

export function Calendar() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);

    useEffect(() => {
        fetch("/.netlify/functions/calendar")
            .then(res => res.json())
            .then(data => setEvents(data));
    }, []);

    function parseFechaDMY(fechaStr) {
        const [dia, mes, anio] = fechaStr.split("/").map(Number);
        return new Date(anio, mes - 1, dia);
    }

    const eventsByDay = {};
    events.forEach(ev => {
        const date = parseFechaDMY(ev.fecha);
        if (
            date.getFullYear() === currentYear &&
            date.getMonth() + 1 === currentMonth
        ) {
            const day = date.getDate();
            if (!eventsByDay[day]) eventsByDay[day] = [];
            eventsByDay[day].push(ev);
        }
    });

    function getGoogleCalendarUrl(ev) {
        // Combina fecha y hora
        const [dia, mes, anio] = ev.fecha.split("/").map(Number);
        const [hora, minuto] = ev.horario.split(":").map(Number);
        const startDate = new Date(anio, mes - 1, dia, hora, minuto);

        // Formato Google Calendar: YYYYMMDDTHHmmssZ
        const start = startDate.toISOString().replace(/-|:|\.\d\d\d/g, "").slice(0, 15) + "00Z";
        const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
        const end = endDate.toISOString().replace(/-|:|\.\d\d\d/g, "").slice(0, 15) + "00Z";

        const text = encodeURIComponent(ev.nombre);
        const details = encodeURIComponent(
            `Formato: ${ev.formato}\nInscripción: ${ev.inscripcion || ""}`
        );
        const location = encodeURIComponent(ev.maps || ev.ubicacion);
        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${end}&details=${details}&location=${location}`;
    }

    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const weeks = [];
    const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
    let day = 1;
    for (let w = 0; w < 6; w++) {
        const week = [];
        for (let d = 0; d < 7; d++) {
            if (w === 0 && d < firstDay) {
                week.push(<td key={d} className="inactive"></td>);
            } else if (day > daysInMonth) {
                week.push(<td key={d} className="inactive"></td>);
            } else {
                const currentDay = day; // ← FIX: congelamos el valor
                const hasEvent = !!eventsByDay[currentDay];
                week.push(
                    <td key={d} className={`active${hasEvent ? " has-event" : ""}`}>
                        <div
                            onClick={() =>
                                setSelectedEvent({
                                    day: currentDay,
                                    events: eventsByDay[currentDay] || [],
                                })
                            }
                            style={{
                                width: "100%",
                                height: "100%",
                                cursor: "pointer",
                            }}
                        >
                            {currentDay}
                            {hasEvent && <span className="event-dot"></span>}
                        </div>
                    </td>
                );
                day++;
            }
        }
        weeks.push(<tr key={w}>{week}</tr>);
        if (day > daysInMonth) break;
    }

    return (
        <div className="calendar-container">
            <div className="calendar-detail-header">
                <h2>Calendario</h2>
                <img src="/logoCom.png" alt="logoCom" className="locoCom-img" />
            </div>
            <table className="calendar">
                <thead>
                <tr>
                    <th>Dom</th><th>Lun</th><th>Mar</th><th>Mié</th><th>Jue</th><th>Vie</th><th>Sáb</th>
                </tr>
                </thead>
                <tbody>{weeks}</tbody>
            </table>

            {selectedEvent && (
                <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
                    <div
                        className="modal-content"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedEvent(null)}
                            className="popup-close-button"
                            title="Cerrar"
                        >
                            ×
                        </button>
                        <h3>Eventos del día {selectedEvent.day}</h3>
                        {selectedEvent.events.length > 0 ? (
                            <ul>
                                {selectedEvent.events.map(ev => (
                                    <li key={ev.id} className="popup-event">
                                        <div><b>Horario:</b> {ev.horario}</div>
                                        <div><b>Ubicación:</b> {ev.ubicacion}</div>
                                        <div><b>Formato:</b> {ev.formato}</div>
                                        {ev.inscripcion && (
                                            <div><b>Inscripción:</b> {ev.inscripcion}</div>
                                        )}
                                        <a
                                            href={getGoogleCalendarUrl(ev)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="gcal-link"
                                        >
                                            Guardar en Google Calendar
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div>No hay eventos para este día.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
