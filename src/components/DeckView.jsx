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
    const [showImport, setShowImport] = useState(false);
    const [importText, setImportText] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [showExported, setShowExported] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        pokemon: true,
        trainer: true,
        energy: true,
        onlyBasic: false
    });

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

        if (filters.pokemon) {
            q += ` supertype:Pokémon`;
        }

        if (filters.item) {
            q += ` subtypes:Item`;
        }

        if (filters.supporter) {
            q += ` subtypes:Supporter`;
        }

        if (filters.stadium) {
            q += ` subtypes:Stadium`;
        }

        if (filters.energy) {
            q += ` supertype:Energy`;
        }

        if (filters.onlyBasic) {
            q += ` subtypes:Basic`;
        }
        const result = await pokemon.card.where({
            q,
            orderBy: `-set.releaseDate`
        });
        setCards(result.data);
    };

    async function importDeck(text) {
        setIsImporting(true);
        try {
            const lines = text.split('\n').filter(l => /^\d+ /.test(l));
            let newCollection = {};
            for (const line of lines) {
                const match = line.match(/^(\d+)\s+(.+)\s+([A-Z0-9]+)\s+(\d+)$/);
                if (!match) continue;
                const [, count, rawName, set, number] = match;

                const name = rawName.replace(/\s*\(.*?\)\s*/g, '').trim();

                let result = await pokemon.card.where({
                    q: `name:"${name}" set.id:${set} number:${number}`
                });
                let card = result.data?.[0];

                if (!card) {
                    result = await pokemon.card.where({
                        q: `name:${name} set.id:${set} number:${number}`
                    });
                    card = result.data?.[0];
                }

                if (!card && rawName !== name) {
                    result = await pokemon.card.where({
                        q: `name:"${rawName}" set.id:${set} number:${number}`
                    });
                    card = result.data?.[0];
                }

                if (card) {
                    newCollection[card.id] = {
                        card,
                        count: parseInt(count, 10),
                        proxy: 0
                    };
                }
            }
            setCollection(newCollection);
        } finally {
            setIsImporting(false);
        }
    }

    function exportDeck(collection) {
        // Agrupa cartas por tipo
        const groups = {
            'Pokémon': [],
            'Trainer': [],
            'Energy': []
        };
        Object.values(collection).forEach(({card, count}) => {
            if (card.supertype === 'Pokémon') {
                groups['Pokémon'].push({card, count});
            } else if (card.supertype === 'Trainer') {
                groups['Trainer'].push({card, count});
            } else if (card.supertype === 'Energy') {
                groups['Energy'].push({card, count});
            }
        });

        function formatGroup(name, arr) {
            if (arr.length === 0) return '';
            const total = arr.reduce((acc, {count}) => acc + count, 0);
            let lines = [`${name}: ${total}`];
            arr.forEach(({card, count}) => {
                // Ejemplo: 2 Charizard ex PAF 54
                const set = card.set?.id?.toUpperCase() || '';
                const num = card.number || '';
                lines.push(`${count} ${card.name} ${set} ${num}`);
            });
            return lines.join('\n');
        }

        return [
            formatGroup('Pokémon', groups['Pokémon']),
            formatGroup('Trainer', groups['Trainer']),
            formatGroup('Energy', groups['Energy'])
        ].filter(Boolean).join('\n\n');
    }


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
                                Estadisticas
                            </button>
                            <button
                                className="tools-menu-item"
                                onClick={() => {
                                    const text = exportDeck(collection);
                                    navigator.clipboard.writeText(text);
                                    setShowExported(true);
                                    setShowTools(false);
                                }}
                            >
                                Exportar mazo
                            </button>
                            <button
                                className="tools-menu-item"
                                onClick={() => setShowImport(true)}
                            >
                                Importar mazo
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
                {showImport &&  !isImporting &&(
                    <div className="modal-overlay" onClick={() => setShowImport(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <h3>Importar mazo</h3>
                            <textarea
                                rows={10}
                                style={{width: '100%'}}
                                placeholder="Pega aquí el texto exportado..."
                                onChange={e => setImportText(e.target.value)}
                            />
                            <button onClick={async () => {
                                await importDeck(importText);
                                setShowImport(false);
                            }}>Importar</button>
                            <button onClick={() => setShowImport(false)}>Cancelar</button>
                        </div>
                    </div>
                )}
                {isImporting && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h3>Importando mazo...</h3>
                            <p>Por favor espera.</p>
                        </div>
                    </div>
                )}
                {showExported && (
                    <div className="modal-overlay" onClick={() => setShowExported(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <h3>Mazo exportado</h3>
                            <p>El mazo se copió al portapapeles.</p>
                            <button onClick={() => setShowExported(false)}>Cerrar</button>
                        </div>
                    </div>
                )}
            </div>
            <div className="binder-divider"></div>
            <div className="binder-box binder-right">
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
                <CardGrid cards={cards} onCardClick={handleCardClick}/>
            </div>
        </div>
    );
}