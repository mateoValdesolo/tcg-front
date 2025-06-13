import React from 'react';
import '../../styles/CardGrid.css';

export function CardGrid({ cards }) {
    return (
        <div className="card-grid">
            {cards.map(card => (
                <img
                    key={card.id}
                    src={card.images.small}
                    alt={card.name}
                    className="card-img"
                />
            ))}
        </div>
    );
}