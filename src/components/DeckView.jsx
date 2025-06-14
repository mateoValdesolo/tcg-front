import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/DeckView.css';
import pokemon from "../api/pokemon.js";
import { CardGrid } from './shared/CardGrid.jsx';
import { CardCollectionDeck } from './shared/CardCollectionDeck.jsx';

function calcularProbabilidadMulligan(collection) {
    let total = 0;
    let basicas = 0;
    Object.values(collection).forEach(({ card, count }) => {
        total += count;
        if (
            card.supertype === 'Pokémon' &&
            card.subtypes?.includes('Basic') &&
            card.supertype !== 'Energy'
        ) {
            basicas += count;
        }
    });
    if (total < 7) return 1;
    if (basicas === 0) return 1;
    if (basicas >= total) return 0; // Todas las cartas son básicas, nunca mulligan

    let probNoBasic = 1;
    for (let i = 0; i < 7; i++) {
        if ((total - basicas - i) < 0) {
            probNoBasic = 0;
            break;
        }
        probNoBasic *= (total - basicas - i) / (total - i);
    }
    // Limita el resultado entre 0 y 1
    return Math.max(0, Math.min(1, probNoBasic));
}

// Calcula la probabilidad de robar exactamente k básicos en 7 cartas
function probabilidadExactaBasicos(collection, k) {
    let total = 0;
    let basicas = 0;
    Object.values(collection).forEach(({ card, count }) => {
        total += count;
        if (
            card.supertype === 'Pokémon' &&
            card.subtypes?.includes('Basic') &&
            card.supertype !== 'Energy'
        ) {
            basicas += count;
        }
    });
    if (total < 7) return 0;
    if (basicas === 0) return k === 0 ? 1 : 0;
    if (basicas >= total && k === 7) return 1;
    // Fórmula hipergeométrica: C(basicas, k) * C(total-basicas, 7-k) / C(total, 7)
    function comb(n, r) {
        if (r < 0 || r > n) return 0;
        let res = 1;
        for (let i = 1; i <= r; i++) {
            res *= (n - i + 1) / i;
        }
        return res;
    }
    return comb(basicas, k) * comb(total - basicas, 7 - k) / comb(total, 7);
}

// Probabilidad de iniciar con al menos k básicos en 7 cartas
function probabilidadAlMenosKBasicos(collection, k) {
    let total = 0;
    let basicas = 0;
    Object.values(collection).forEach(({ card, count }) => {
        total += count;
        if (
            card.supertype === 'Pokémon' &&
            card.subtypes?.includes('Basic') &&
            card.supertype !== 'Energy'
        ) {
            basicas += count;
        }
    });
    if (total < 7) return 0;
    if (basicas === 0) return 0;
    if (basicas >= total && k <= 7) return 1;
    // Suma de hipergeométricas desde k hasta 7
    let prob = 0;
    for (let i = k; i <= 7; i++) {
        prob += probabilidadExactaBasicos(collection, i);
    }
    return prob;
}

export function DeckView() {
    const location = useLocation();
    const deckName = location.state?.deckName || 'Mazo sin nombre';

    const [search, setSearch] = useState('');
    const [cards, setCards] = useState([]);
    const [collection, setCollection] = useState({}); // { [id]: { card, count } }
    const [showTools, setShowTools] = useState(false);
    const toolsRef = useRef();
    const [showStats, setShowStats] = useState(false);

    // Cargar colección del mazo desde localStorage al iniciar
    useEffect(() => {
        const stored = localStorage.getItem(`deckCollection:${deckName}`);
        if (stored) setCollection(JSON.parse(stored));
    }, [deckName]);

    // Guardar colección del mazo en localStorage cuando cambie
    useEffect(() => {
        localStorage.setItem(`deckCollection:${deckName}`, JSON.stringify(collection));
    }, [deckName, collection]);

    // Cierra el menú si se hace clic fuera
    useEffect(() => {
        function handleClickOutside(event) {
            if (toolsRef.current && !toolsRef.current.contains(event.target)) {
                setShowTools(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

    const handleRemoveProxy = (cardId) => {
        setCollection(prev => {
            const prevItem = prev[cardId] || {};
            const prevProxy = prevItem.proxy || 0;
            const prevCount = prevItem.count || 0;
            if (prevProxy <= 0) return prev; // No hay proxys para quitar

            // Si al quitar proxy y count ambos quedan en 0, elimina la carta
            if (prevProxy - 1 === 0 && prevCount - 1 === 0) {
                const { [cardId]: _, ...rest } = prev;
                return rest;
            }

            return {
                ...prev,
                [cardId]: {
                    ...prevItem,
                    proxy: prevProxy - 1,
                    count: prevCount - 1
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


    return (
        <div className="binder-container">
            <div className="binder-box binder-left">
                <div className="deck-header" ref={toolsRef} style={{ position: 'relative' }}>
                    <h2 className="deck-title">{deckName}</h2>
                    <button
                        className="tool-btn"
                        title="Herramientas"
                        onClick={() => setShowTools(v => !v)}
                    >
                        Tools
                    </button>
                    {showTools && (
                        <div className="tools-menu">
                            <button
                                className="tools-menu-item"
                                onClick={() => {
                                    setShowStats(true);
                                    setShowTools(false);
                                }}
                            >
                                Statistics
                            </button>
                        </div>
                    )}
                </div>
                <CardCollectionDeck
                    collection={collection}
                    onCardRemove={handleCardRemove}
                    onAddProxy={handleAddProxy}
                    onRemoveProxy={handleRemoveProxy}
                />
                {showStats && (
                    <div className="modal-overlay" onClick={() => setShowStats(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <h3>Probabilidad de Mulligan</h3>
                            {Object.values(collection).reduce((acc, {count}) => acc + count, 0) < 7 ? (
                                <p>
                                    El mazo tiene menos de 7 cartas.<br />
                                    No es posible calcular la probabilidad de mulligan.
                                </p>
                            ) : (
                                <>
                                    <p>
                                        Probabilidad de NO tener una carta básica en la mano inicial (7 cartas):<br />
                                        <b>{(calcularProbabilidadMulligan(collection) * 100).toFixed(2)}%</b>
                                    </p>
                                    <p>
                                        Probabilidad de tener al menos una carta básica:<br />
                                        <b>{((1 - calcularProbabilidadMulligan(collection)) * 100).toFixed(2)}%</b>
                                    </p>
                                    <p>
                                        Probabilidad de iniciar con <b>exactamente 1</b> carta básica:<br />
                                        <b>{(probabilidadExactaBasicos(collection, 1) * 100).toFixed(2)}%</b>
                                    </p>
                                    <p>
                                        Probabilidad de iniciar con <b>2 o más</b> cartas básicas:<br />
                                        <b>{(probabilidadAlMenosKBasicos(collection, 2) * 100).toFixed(2)}%</b>
                                    </p>
                                </>
                            )}
                            <button onClick={() => setShowStats(false)}>Cerrar</button>
                        </div>
                    </div>
                )}
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