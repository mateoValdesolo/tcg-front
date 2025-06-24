import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/MyDecks.css';

export function MyDecks() {
    const [decks, setDecks] = useState([]);
    const [creating, setCreating] = useState(false);
    const [newDeckName, setNewDeckName] = useState('');
    const [deckLogos, setDeckLogos] = useState({});
    const navigate = useNavigate();
    const [error, setError] = useState('');

    useEffect(() => {
        const logos = {};
        decks.forEach(deck => {
            const stored = localStorage.getItem(`deckLogo:${deck.name}`);
            if (stored) logos[deck.name] = JSON.parse(stored);
        });
        setDeckLogos(logos);
    }, [decks]);

    useEffect(() => {
        const storedDecks = JSON.parse(localStorage.getItem('decks')) || [];
        setDecks(storedDecks);
    }, []);

    useEffect(() => {
        localStorage.setItem('decks', JSON.stringify(decks));
    }, [decks]);

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
            // Elimina la clave individual del mazo
            const deckName = prev[idx].name;
            localStorage.removeItem(`deckCollection:${deckName}`);
            localStorage.setItem('decks', JSON.stringify(updatedDecks));
            return updatedDecks;
        });
    };

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