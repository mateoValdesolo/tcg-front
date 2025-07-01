import React from 'react';
import '../../styles/CardCollection.css';

export function CardCollection({ collection, userId, onCardRemove, onAddCard }) {
    const cards = Object.values(collection);
    const total = cards.reduce((acc, { count }) => acc + count, 0);


    const getTypePriority = (card) => {
        // Ajusta según cómo se almacene el tipo en tu objeto card
        if (card.supertype === 'Pokémon') return 0;
        if (card.subtypes[0] === 'Supporter') return 1;
        if (card.subtypes[0] === 'Item') return 2;
        if (card.subtypes[0] === 'Pokémon Tool') return 3;
        if (card.subtypes[0] === 'Stadium') return 4;
        if (card.supertype === 'Energy') return 5;
        return 6;
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
            </div>
            <div className="collection-grid">
                {sortedCards.map(({ card, count }) => (
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