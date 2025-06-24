import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/MyDecks.css';
import { useUser } from '../context/UserContext.jsx';

export function MyDecks() {
    const [decks, setDecks] = useState([]);
    const [creating, setCreating] = useState(false);
    const [newDeckName, setNewDeckName] = useState('');
    const [deckLogos, setDeckLogos] = useState({});
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const { userId } = useUser();




    const handleCreateDeck = () => {
        setCreating(true);
    };

    const handleDeckNameChange = (e) => {
        setNewDeckName(e.target.value);
    };

    const handleDeckSubmit = (e) => {
        e.preventDefault();
        if (!newDeckName.trim()) return;
        if (decks.some(deck => deck.name.trim().toLowerCase() === newDeckName.trim().toLowerCase())) {
            setError('Ya existe un mazo con ese nombre.');
            return;
        }
        const newDeck = { name: newDeckName };
        setDecks(prev => [...prev, newDeck]);
        setNewDeckName('');
        setCreating(false);
        setError('');
        navigate('/deckview', { state: { deckName: newDeckName } });
    };

    const handleDeleteDeck = (idx) => {
        setDecks(prev => {
            const updatedDecks = prev.filter((_, i) => i !== idx);
            const deckName = prev[idx].name;
            setDeckLogos(logos => {
                const { [deckName]: _, ...rest } = logos;
                return rest;
            });
            return updatedDecks;
        });
    };

    // Cargar mazos y logos al iniciar
    useEffect(() => {
        if (!userId) return;
        const fetchDecks = async () => {
            const res = await fetch(`/.netlify/functions/decks?id=${userId}`);
            if (res.ok) {
                const data = await res.json();
                if (data.length) {
                    const decksArr = data[0].decks ? JSON.parse(data[0].decks) : [];
                    setDecks(decksArr);

                    // Cargar logos individuales de cada mazo
                    const logosObj = {};
                    await Promise.all(decksArr.map(async (deck) => {
                        const resDeck = await fetch(`/.netlify/functions/deck?id=${userId}&deckName=${encodeURIComponent(deck.name)}`);
                        if (resDeck.ok) {
                            const deckData = await resDeck.json();
                            if (deckData.length && deckData[0].logos) {
                                logosObj[deck.name] = JSON.parse(deckData[0].logos);
                            }
                        }
                    }));
                    setDeckLogos(logosObj);
                }
            }
        };
        fetchDecks();
    }, [userId]);

    useEffect(() => {
        if (!userId) return;
        // Evita POST vacíos
        if ((!decks || decks.length === 0) && (!deckLogos || Object.keys(deckLogos).length === 0)) return;
        fetch('/.netlify/functions/decks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: userId,
                decks: JSON.stringify(decks),
                logos: JSON.stringify(deckLogos)
            })
        });
    }, [decks, deckLogos, userId]);

    return (
        <div className="mydecks-container">
            <button className="create-deck-btn" onClick={handleCreateDeck}>
                Crear mazo
            </button>
            {creating && (
                <form
                    onSubmit={handleDeckSubmit}
                    className="deck-form"
                >
                    {error && (
                        <div className="modal-overlay" onClick={() => setError('')}>
                            <div className="modal-content" onClick={e => e.stopPropagation()}>
                                <h3>Error</h3>
                                <p>{error}</p>
                                <button onClick={() => setError('')}>Cerrar</button>
                            </div>
                        </div>
                    )}
                    <input
                        type="text"
                        placeholder="Nombre del mazo"
                        value={newDeckName}
                        onChange={handleDeckNameChange}
                        className="deck-input"
                    />
                    <button type="submit" className="create-deck-btn" style={{ padding: '0.5rem 1rem' }}>
                        Confirmar
                    </button>
                </form>
            )}
            <div className="decks-list">
                {decks.length === 0 ? (
                    <div className="decks-empty">No tienes mazos aún.</div>
                ) : (
                    decks.map((deck, idx) => (
                        <div
                            key={idx}
                            className="deck-item"
                            onClick={() => navigate('/deckview', { state: { deckName: deck.name } })}
                        >
                      <span onClick={() => navigate('/deckview', { state: { deckName: deck.name } })}>
                          {deck.name}
                          {(deckLogos[deck.name] || []).map(l => (
                              <img
                                  key={l.id}
                                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${l.nationalPokedexNumber}.png`}
                                  alt=""
                                  style={{width: 25, height: 25, marginRight: 2, verticalAlign: 'middle'}}
                              />
                          ))}
                            </span>
                            <button
                                className="delete-deck-btn"
                                onClick={e => {
                                    e.stopPropagation();
                                    handleDeleteDeck(idx);
                                }}
                            >
                                Eliminar
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}