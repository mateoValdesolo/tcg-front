import React, { useState, useEffect } from 'react';
import '../styles/Binder.css';
import pokemon from "../api/pokemon.js";
import { CardGrid } from './shared/CardGrid.jsx';
import { CardCollectionWish } from "./shared/CardCollectionWish.jsx";
import {useUser} from "../context/UserContext.jsx";

export function Wishlist() {
    const [search, setSearch] = useState('');
    const [cards, setCards] = useState([]);
    const [collection, setCollection] = useState({});
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        pokemon: false,
        item: false,
        supporter: false,
        trainer: false,
        stadium: false,
        energy: false,
        onlyBasic: false
    });
    const { userId } = useUser();
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (!userId) return;
        const fetchWishlist = async () => {
            const res = await fetch(`/.netlify/functions/wishlist?id=${userId}`);
            if (res.ok) {
                const data = await res.json();
                setCollection(data.collection ? JSON.parse(data.collection) : {});
            }
            setIsLoaded(true);
        };
        fetchWishlist();
    }, [userId]);

    useEffect(() => {
        if (!userId || !isLoaded) return;
        fetch('/.netlify/functions/wishlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: userId,
                collection: JSON.stringify(collection)
            })
        });
    }, [collection, userId, isLoaded]);

    const handleFilterChange = (e) => {
        const { name, checked } = e.target;
        if (name === "onlyBasic") {
            setFilters({
                pokemon: false,
                item: false,
                supporter: false,
                trainer: false,
                stadium: false,
                energy: false,
                onlyBasic: checked
            });
        } else {
            setFilters({
                pokemon: false,
                item: false,
                supporter: false,
                trainer: false,
                stadium: false,
                energy: false,
                onlyBasic: false,
                [name]: checked
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        let q = `name:${search}* legalities.standard:Legal`;

        if (filters.pokemon) q += ` supertype:Pokémon`;
        if (filters.item) q += ` subtypes:Item`;
        if (filters.supporter) q += ` subtypes:Supporter`;
        if (filters.stadium) q += ` subtypes:Stadium`;
        if (filters.energy) q += ` supertype:Energy`;
        if (filters.onlyBasic) q += ` subtypes:Basic`;

        const result = await pokemon.card.where({
            q,
            orderBy: `-set.releaseDate`
        });
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
            const prevItem = prev[cardId] || {};
            const prevCount = prevItem.count || 0;
            return {
                ...prev,
                [cardId]: {
                    ...prevItem,
                    count: prevCount + 1
                }
            };
        });
    };

    return (
        <div className="binder-container">
            <div className="binder-box binder-left">
                <CardCollectionWish collection={collection} onCardRemove={handleCardRemove} onAddCard={handleAddCard} />
            </div>
            <div className="binder-divider"></div>
            <div className="binder-box binder-right" >
                <form className="search-form" onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
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
                    <button
                        type="button"
                        className="filter-btn"
                        style={{ marginLeft: 4 }}
                        onClick={() => setShowFilters(v => !v)}
                    >
                        Filtros
                    </button>
                    {showFilters && (
                        <div className="filters-panel" style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            background: 'var(--modal-bg, #fff)',
                            border: '1px solid #ccc',
                            borderRadius: 8,
                            padding: 12,
                            zIndex: 10,
                            minWidth: 180
                        }}>
                            <label>
                                <input
                                    type="checkbox"
                                    name="pokemon"
                                    checked={filters.pokemon}
                                    onChange={handleFilterChange}
                                /> Pokémon
                            </label>
                            <br />
                            <label>
                                <input
                                    type="checkbox"
                                    name="item"
                                    checked={filters.item}
                                    onChange={handleFilterChange}
                                /> Item
                            </label>
                            <br />
                            <label>
                                <input
                                    type="checkbox"
                                    name="supporter"
                                    checked={filters.supporter}
                                    onChange={handleFilterChange}
                                /> Partidario
                            </label>
                            <br />
                            <label>
                                <input
                                    type="checkbox"
                                    name="stadium"
                                    checked={filters.stadium}
                                    onChange={handleFilterChange}
                                /> Estadio
                            </label>
                            <br />
                            <label>
                                <input
                                    type="checkbox"
                                    name="energy"
                                    checked={filters.energy}
                                    onChange={handleFilterChange}
                                /> Energía
                            </label>
                            <br />
                            <label>
                                <input
                                    type="checkbox"
                                    name="onlyBasic"
                                    checked={filters.onlyBasic}
                                    onChange={handleFilterChange}
                                /> Solo básicos
                            </label>
                        </div>
                    )}
                </form>
                <CardGrid cards={cards} onCardClick={handleCardClick} />
            </div>
        </div>
    );
}