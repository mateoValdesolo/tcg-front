import React, {useState, useEffect, useRef} from 'react';
import {useLocation} from 'react-router-dom';
import '../styles/DeckView.css';
import pokemon from "../api/pokemon.js";
import {CardGrid} from './shared/CardGrid.jsx';
import {CardCollectionDeck} from './shared/CardCollectionDeck.jsx';

function calcularProbabilidadMulligan(collection) {
    let total = 0;
    let basicas = 0;
    Object.values(collection).forEach(({card, count}) => {
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
    Object.values(collection).forEach(({card, count}) => {
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
    Object.values(collection).forEach(({card, count}) => {
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
        const result = await pokemon.card.where({
            q: `name:${search}* legalities.standard:Legal`,
            orderBy: `-set.releaseDate`
        });
        setCards(result.data);
    };

    const handleAddProxy = (cardId) => {
        setCollection(prev => {
            const total = Object.values(prev).reduce((acc, {count}) => acc + count, 0);
            if (total >= 60) return prev; // No agregar más de 60
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
                const {[cardId]: _, ...rest} = prev;
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
                const {[cardId]: _, ...rest} = prev;
                return rest;
            }
            return {
                ...prev,
                [cardId]: {...prev[cardId], count: prevCount - 1}
            };
        });
    };

    const handleCardClick = (card) => {
        setCollection(prev => {
            const total = Object.values(prev).reduce((acc, {count}) => acc + count, 0);
            if (total >= 60) return prev; // No agregar más de 60
            const prevCount = prev[card.id]?.count || 0;
            const prevProxy = prev[card.id]?.proxy || 0;
            return {
                ...prev,
                [card.id]: {card, count: prevCount + 1, proxy: prevProxy}
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

    // const handleDownloadCanvas = async () => {
    //     setIsGenerating(true);
    //     try {
    //         const canvasWidth = 1920;
    //         const canvasHeight = 1080;
    //         const maxCols = 10;
    //         const maxRows = 3;
    //         const cards = Object.values(collection).slice(0, maxCols * maxRows);
    //
    //         // Calcula el tamaño de carta y padding para que encajen en 1920x1080
    //         const padding = 24;
    //         const cardWidth = Math.floor((canvasWidth - (maxCols + 1) * padding) / maxCols);
    //         const cardHeight = Math.floor((canvasHeight - (maxRows + 1) * padding - maxRows * 60) / maxRows);
    //
    //         const canvas = document.createElement('canvas');
    //         canvas.width = canvasWidth;
    //         canvas.height = canvasHeight;
    //         const ctx = canvas.getContext('2d');
    //
    //         ctx.fillStyle = '#444';
    //         ctx.fillRect(0, 0, canvas.width, canvas.height);
    //
    //         for (let i = 0; i < cards.length; i++) {
    //             const {card, count} = cards[i];
    //             const row = Math.floor(i / maxCols);
    //             const col = i % maxCols;
    //
    //             let offsetX = 0;
    //             if (row === Math.ceil(cards.length / maxCols) - 1 && cards.length % maxCols !== 0) {
    //                 const lastRowCards = cards.length % maxCols;
    //                 offsetX = ((maxCols - lastRowCards) * (cardWidth + padding)) / 2;
    //             }
    //
    //             const x = padding + col * (cardWidth + padding) + offsetX;
    //             const y = padding + row * (cardHeight + 60 + padding);
    //
    //             const img = new window.Image();
    //             img.crossOrigin = 'anonymous';
    //             img.src = `http://localhost:4000/proxy?url=${encodeURIComponent(card.images.large)}`;
    //
    //             await new Promise(resolve => {
    //                 img.onload = () => {
    //                     ctx.drawImage(img, x, y, cardWidth, cardHeight);
    //                     ctx.fillStyle = '#fff';
    //                     ctx.font = `bold ${Math.floor(cardHeight * 0.09)}px Montserrat, Arial`;
    //                     ctx.textAlign = 'center';
    //                     ctx.fillText(`Cantidad: ${count}`, x + cardWidth / 2, y + cardHeight + 40);
    //                     resolve();
    //                 };
    //                 img.onerror = () => {
    //                     ctx.fillStyle = '#444';
    //                     ctx.fillRect(x, y, cardWidth, cardHeight);
    //                     ctx.fillStyle = '#fff';
    //                     ctx.font = `bold ${Math.floor(cardHeight * 0.09)}px Montserrat, Arial`;
    //                     ctx.textAlign = 'center';
    //                     ctx.fillText(`Cantidad: ${count}`, x + cardWidth / 2, y + cardHeight + 40);
    //                     resolve();
    //                 };
    //             });
    //         }
    //
    //         // Dibuja el logo en la esquina inferior derecha
    //         await new Promise(resolve => {
    //             const logo = new window.Image();
    //             logo.src = '/logo.png'; // Asegúrate de que la ruta sea correcta
    //             logo.onload = () => {
    //                 const logoWidth = 120;
    //                 const logoHeight = 120;
    //                 const margin = 32;
    //                 ctx.drawImage(
    //                     logo,
    //                     canvasWidth - logoWidth - margin,
    //                     canvasHeight - logoHeight - margin,
    //                     logoWidth,
    //                     logoHeight
    //                 );
    //                 resolve();
    //             };
    //             logo.onerror = resolve; // Si falla, simplemente continúa
    //         });
    //
    //         const link = document.createElement('a');
    //         link.download = `${deckName}.png`;
    //         link.href = canvas.toDataURL();
    //         link.click();
    //     } finally {
    //         setIsGenerating(false);
    //     }
    // };

    return (
        <div className="binder-container">
            <div className="binder-box binder-left">
                <div className="deck-header" ref={toolsRef} style={{position: 'relative'}}>
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
                            {/*<button*/}
                            {/*    className="tools-menu-item"*/}
                            {/*    onClick={async () => {*/}
                            {/*        await handleDownloadCanvas();*/}
                            {/*        setShowTools(false);*/}
                            {/*    }}*/}
                            {/*>*/}
                            {/*    Descargar imagen del mazo*/}
                            {/*</button>*/}
                        </div>
                    )}
                </div>
                <CardCollectionDeck
                    collection={collection}
                    onCardRemove={handleCardRemove}
                    onAddCard={handleAddCard}
                    onAddProxy={handleAddProxy}
                    onRemoveProxy={handleRemoveProxy}
                />
                {/*{isGenerating && (*/}
                {/*    <div className="modal-overlay">*/}
                {/*        <div className="modal-content">*/}
                {/*            <p>Generando imagen, por favor espera...</p>*/}
                {/*        </div>*/}
                {/*    </div>*/}
                {/*)}*/}
                {showStats && (
                    <div className="modal-overlay" onClick={() => setShowStats(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <h3>Probabilidad de Mulligan</h3>
                            {Object.values(collection).reduce((acc, {count}) => acc + count, 0) < 7 ? (
                                <p>
                                    El mazo tiene menos de 7 cartas.<br/>
                                    No es posible calcular la probabilidad de mulligan.
                                </p>
                            ) : (
                                <>
                                    <p>
                                        Probabilidad de NO tener una carta básica en la mano inicial (7 cartas):<br/>
                                        <b>{(calcularProbabilidadMulligan(collection) * 100).toFixed(2)}%</b>
                                    </p>
                                    <p>
                                        Probabilidad de tener al menos una carta básica:<br/>
                                        <b>{((1 - calcularProbabilidadMulligan(collection)) * 100).toFixed(2)}%</b>
                                    </p>
                                    <p>
                                        Probabilidad de iniciar con <b>exactamente 1</b> carta básica:<br/>
                                        <b>{(probabilidadExactaBasicos(collection, 1) * 100).toFixed(2)}%</b>
                                    </p>
                                    <p>
                                        Probabilidad de iniciar con <b>2 o más</b> cartas básicas:<br/>
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
            <div className="binder-box binder-right">
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
                <CardGrid cards={cards} onCardClick={handleCardClick}/>
            </div>
        </div>
    );
}