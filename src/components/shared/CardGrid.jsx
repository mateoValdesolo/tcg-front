import React from 'react';
import '../../styles/CardGrid.css';

export function CardGrid({ cards, onCardClick }) {
    return (
        <div className="card-grid">
            {cards.map(card => (
                <img
                    key={card.id}
                    src={card.images.small}
                    alt={card.name}
                    className="card-img"
                    style={{ cursor: onCardClick ? 'pointer' : 'default' }}
                    onClick={onCardClick ? () => onCardClick(card) : undefined}
                />
            ))}
        </div>
    );
}