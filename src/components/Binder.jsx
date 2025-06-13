import React, { useState } from 'react';
import '../styles/Binder.css';
import pokemon from "../api/pokemon.js";
import { CardGrid } from './shared/CardGrid.jsx';

export function Binder() {
    const [search, setSearch] = useState('');
    const [cards, setCards] = useState([]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await pokemon.card.where({ q: `name:${search} legalities.standard:Legal` });
        setCards(result.data);
    };

    return (
        <div className="binder-container">
            <div className="binder-box binder-left">
                <span>Contenido izquierdo</span>
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
                <CardGrid cards={cards} />
            </div>
        </div>
    );
}