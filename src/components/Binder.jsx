import React, { useState, useEffect } from 'react';
import '../styles/Binder.css';
import pokemon from "../api/pokemon.js";
import { CardGrid } from './shared/CardGrid.jsx';
import { CardCollection } from './shared/CardCollection.jsx';

export function Binder() {
    const [search, setSearch] = useState('');
    const [cards, setCards] = useState([]);
    const [collection, setCollection] = useState({}); // { [id]: { card, count } }

    // Cargar colección desde localStorage al iniciar
    useEffect(() => {
        const stored = localStorage.getItem('binderCollection');
        if (stored) setCollection(JSON.parse(stored));
    }, []);

    // Guardar colección en localStorage cuando cambie
    useEffect(() => {
        localStorage.setItem('binderCollection', JSON.stringify(collection));
    }, [collection]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await pokemon.card.where({ q: `name:${search}* legalities.standard:Legal`, orderBy:`-set.releaseDate`});
        setCards(result.data);
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
            return {
                ...prev,
                [card.id]: { card, count: prevCount + 1 }
            };
        });
    };

    const handleAddCard = (cardId) => {
        setCollection(prev => {
            const total = Object.values(prev).reduce((acc, {count}) => acc + count, 0);
            if (total >= 60) return prev; // No agregar más de 60
            const prevItem = prev[cardId] || {};
            const prevCount = prevItem.count || 0;
            const prevProxy = prevItem.proxy || 0;
            return {
                ...prev,
                [cardId]: {
                    ...prevItem,
                    count: prevCount + 1,
                    proxy: prevProxy
                }
            };
        });
    };

    // Para enviar al backend: Object.entries(collection).map(([id, { count }]) => ({ id, count }))

    return (
        <div className="binder-container">
            <div className="binder-box binder-left">
                <CardCollection collection={collection} onCardRemove={handleCardRemove} onAddCard={handleAddCard} />
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