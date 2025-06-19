import React, {useEffect, useRef, useState} from 'react';
import pokemon from "../../api/pokemon.js";
import { useLocation } from 'react-router-dom';
import { CardGrid } from './CardGrid.jsx';
import { GenericCardCollection} from './GenericCardCollection.jsx';
import {calcularProbabilidadMulligan, probabilidadExactaBasicos, probabilidadAlMenosKBasicos} from "../../utils.js";
import '../../styles/CardManager.css';


export function CardManager({typeCollection}) {
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

    // --------------------------------------------- DECK ---------------------------------------------
    const location = useLocation();
    const deckName = location.state?.deckName || 'Mazo sin nombre';
    const [showTools, setShowTools] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [importText, setImportText] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [showExported, setShowExported] = useState(false);
    const toolsRef = useRef();

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

    // --------------------------------------------- FIN DECK ---------------------------------------------

    // --------------------------------------------- GENERAL ---------------------------------------------

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

    // Obtiene el nobre de la colleccion
    function getLocalCollection(typeCollection){
        if (typeCollection === 'deck') {
            return 'deckCollection:' + deckName;
        }
        if (typeCollection === 'binder') {
            return 'binderCollection';
        }
        if (typeCollection === 'wishlist') {
            return 'wishlistCollection';
        }
        return null;
    }

    useEffect(() => {
        const localKey = getLocalCollection(typeCollection, deckName);
        if (localKey) {
            const stored = localStorage.getItem(localKey);
            if (stored) setCollection(JSON.parse(stored));
        }
    }, [typeCollection, deckName]);

    useEffect(() => {
        const localKey = getLocalCollection(typeCollection, deckName);
        if (localKey) {
            localStorage.setItem(localKey, JSON.stringify(collection));
        }
    }, [collection, typeCollection, deckName]);

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

            if(typeCollection === "deck"){
                const total = Object.values(prev).reduce((acc, {count}) => acc + count, 0);
                if (total >= 60) return prev; // No agregar más de 60
                const prevProxy = prev[card.id]?.proxy || 0;
                return {
                    ...prev,
                    [card.id]: {card, count: prevCount + 1, proxy: prevProxy}
                };
            } else {
                return {
                    ...prev,
                    [card.id]: { card, count: prevCount + 1 }
                };
            }
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

    function switchTipo(typeCollection) {
        switch (typeCollection) {
            case 'binder':
                return (
                    <div className="binder-container">
                        <div className="binder-box binder-left">
                            <GenericCardCollection
                                typeCollection={typeCollection} collection={collection} onCardRemove={handleCardRemove} onAddCard={handleAddCard} />
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
            case 'deck':
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
                        <GenericCardCollection
                            typeCollection={typeCollection}
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
            case 'wishlist':
                return (
                    <div className="binder-container">
                    <div className="binder-box binder-left">
                        <GenericCardCollection
                            typeCollection={typeCollection} collection={collection} onCardRemove={handleCardRemove} onAddCard={handleAddCard} />
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
            default:
                return null;
        }
    }
    // --------------------------------------------- FIN GENERAL ---------------------------------------------




    return (
        <div>
            {switchTipo(typeCollection)}
        </div>
    );
}