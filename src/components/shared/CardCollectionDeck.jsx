import React from 'react';
import '../../styles/CardCollectionDeck.css';

export function CardCollectionDeck({collection, onCardRemove, onAddProxy}) {
    const cards = Object.values(collection);
    const total = cards.reduce((acc, {count}) => acc + count, 0);
    const totalProxies = cards.reduce((acc, {proxy = 0}) => acc + proxy, 0);

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
                {cards.map(({card, count, proxy = 0}) => (
                    <div key={card.id} className="cardcollection-card">
                        <img
                            src={card.images.small}
                            alt={card.name}
                            className="card-img"
                            style={{cursor: 'pointer'}}
                            onClick={() => onCardRemove(card.id)}
                        />
                        <div className="cardcollection-count">Cantidad: {count}</div>
                        <button
                            className="proxy-btn"
                            onClick={() => onAddProxy(card.id)}
                        >
                            Proxy: {proxy}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}