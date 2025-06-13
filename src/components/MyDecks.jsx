import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/MyDecks.css';

export function MyDecks() {
    const [decks, setDecks] = useState([]);
    const [creating, setCreating] = useState(false);
    const [newDeckName, setNewDeckName] = useState('');
    const navigate = useNavigate();

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
        const newDeck = { name: newDeckName };
        setDecks(prev => [...prev, newDeck]);
        setNewDeckName('');
        setCreating(false);
        navigate('/deckview', { state: { deckName: newDeckName } });
    };

    const handleDeleteDeck = (idx) => {
        setDecks(prev => prev.filter((_, i) => i !== idx));
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