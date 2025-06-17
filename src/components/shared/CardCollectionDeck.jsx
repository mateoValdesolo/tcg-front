import React from 'react';
import '../../styles/CardCollectionDeck.css';

export function CardCollectionDeck({collection, onCardRemove,onAddCard, onAddProxy, onRemoveProxy}) {
    const cards = Object.values(collection);
    const total = cards.reduce((acc, {count}) => acc + count, 0);
    const totalProxies = cards.reduce((acc, {proxy = 0}) => acc + proxy, 0);

    const getTypePriority = (card) => {
        // Ajusta según cómo se almacene el tipo en tu objeto card
        if (card.supertype === 'Pokémon') return 0;
        if (card.subtypes[0] === 'Supporter') return 1;
        if (card.subtypes[0] === 'Item') return 2;
        if (card.subtypes[0] === 'Pokémon Tool') return 3;
        if (card.supertype === 'Energy') return 4;
        return 5;
    };

    const sortedCards = [...cards].sort((a, b) => {
        return getTypePriority(a.card) - getTypePriority(b.card);
    });


    if (cards.length === 0) {
        return <div className="cardcollection-empty">No has agregado cartas aún.</div>;
    }

    return (
        <div className="collection-wrapper">
            <div className="collection-total">
                Total de cartas: {total}
                <span className="proxy-total">
                    Proxys: {totalProxies}
                </span>
            </div>
            <div className="collection-grid">
                {sortedCards.map(({card, count, proxy = 0}) => (
                    <div key={card.id} className="cardcollection-card">
                        <img
                            src={card.images.small}
                            alt={card.name}
                            className="card-img"
                            style={{cursor: 'pointer'}}
                            onClick={() => onCardRemove(card.id)}
                        />
                        <div className="cardcollection-count">
                        <button
                            className="proxy-btn"
                            onClick={() => onCardRemove(card.id)}
                            type="button"
                            disabled={count <= 1}
                        >-</button>
                            Cantidad: {count}
                            <button
                                className="proxy-btn"
                                onClick={() => onAddCard(card.id)}
                                type="button"
                            >+</button>
                        </div>
                        <div className="cardcollection-proxy-controls">
                            <button
                                className="proxy-btn"
                                onClick={() => onRemoveProxy(card.id)}
                                type="button"
                                disabled={proxy === 0}
                            >-</button>
                            <span className="proxy-count">Proxy: {proxy}</span>
                            <button
                                className="proxy-btn"
                                onClick={() => onAddProxy(card.id)}
                                type="button"
                            >+</button>
                    </div>
                    </div>
                ))}
            </div>
        </div>
    );
}