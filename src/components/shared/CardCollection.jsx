import React from 'react';
import '../../styles/CardCollection.css';

export function CardCollection({ collection, onCardRemove, onAddCard }) {
    const cards = Object.values(collection);
    const total = cards.reduce((acc, { count }) => acc + count, 0);

    if (cards.length === 0) {
        return <div className="cardcollection-empty">No has agregado cartas aún.</div>;
    }

    return (
        <div className="collection-wrapper">
            <div className="collection-total">
                Total de cartas: {total}
            </div>
            <div className="collection-grid">
                {cards.map(({ card, count }) => (
                    <div key={card.id} className="cardcollection-card">
                        <img
                            src={card.images.small}
                            alt={card.name}
                            className="card-img"
                            style={{ cursor: 'pointer' }}
                            onClick={() => onCardRemove(card.id)}
                        />
                        <div className="cardcollection-count">
                            <button
                                className="card-btn"
                                onClick={() => onCardRemove(card.id)}
                                type="button"
                                disabled={count <= 1}
                            >-</button>
                            Cantidad: {count}
                            <button
                                className="card-btn"
                                onClick={() => onAddCard(card.id)}
                                type="button"
                            >+</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}