import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/Binder.css';
import pokemon from "../api/pokemon.js";
import { CardGrid } from './shared/CardGrid.jsx';
import { CardCollectionDeck } from './shared/CardCollectionDeck.jsx';

export function DeckView() {
    const location = useLocation();
    const deckName = location.state?.deckName || 'Mazo sin nombre';

    const [search, setSearch] = useState('');
    const [cards, setCards] = useState([]);
    const [collection, setCollection] = useState({}); // { [id]: { card, count } }

    // Cargar colección del mazo desde localStorage al iniciar
    useEffect(() => {
        const stored = localStorage.getItem(`deckCollection:${deckName}`);
        if (stored) setCollection(JSON.parse(stored));
    }, [deckName]);

    // Guardar colección del mazo en localStorage cuando cambie
    useEffect(() => {
        localStorage.setItem(`deckCollection:${deckName}`, JSON.stringify(collection));
    }, [deckName, collection]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await pokemon.card.where({ q: `name:${search}* legalities.standard:Legal` });
        setCards(result.data);
    };

    const handleAddProxy = (cardId) => {
        setCollection(prev => {
            const prevItem = prev[cardId] || {};
            const prevProxy = prevItem.proxy || 0;
            const prevCount = prevItem.count || 0;
            return {
                ...prev,
                [cardId]: {
                    ...prevItem,
                    proxy: prevProxy + 1,
                    count: prevCount + 1,
                }
            };
        });
    };

    const handleCardRemove = (cardId) => {
        setCollection(prev => {
            const prevCount = prev[cardId]?.count || 0;
            if (prevCount <= 1) {
                const { [cardId]: _, ...rest } = prev;
                return rest;
            }
            return {
                ...prev,
                [cardId]: { ...prev[cardId], count: prevCount - 1 }
            };
        });
    };

    const handleCardClick = (card) => {
        setCollection(prev => {
            const prevCount = prev[card.id]?.count || 0;
            const prevProxy = prev[card.id]?.proxy || 0; // Mantener el valor de proxy
            return {
                ...prev,
                [card.id]: { card, count: prevCount + 1, proxy: prevProxy }
            };
        });
    };

    // Para enviar al backend: Object.entries(collection).map(([id, { count }]) => ({ id, count }))

    return (
        <div className="binder-container">
            <div className="binder-box binder-left">
                <h2 style={{ fontFamily: 'Montserrat, Arial, sans-serif', fontWeight: 700, marginBottom: '1rem', textAlign: 'center' }}>
                    {deckName}
                </h2>
                <CardCollectionDeck
                    collection={collection}
                    onCardRemove={handleCardRemove}
                    onAddProxy={handleAddProxy}
                />
            </div>
            <div className="binder-divider"></div>
            <div className="binder-box binder-right" >
                <form className="search-form" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Buscar..."
                        className="search-input"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <button type="submit" className="search-button">
                        Buscar
                    </button>
                </form>
                <CardGrid cards={cards} onCardClick={handleCardClick} />
            </div>
        </div>
    );
}