import React from 'react';
import '../../styles/CardCollection.css';

export function CardCollection({ collection }) {
    const cards = Object.values(collection);
    const total = cards.reduce((acc, { count }) => acc + count, 0);

    if (cards.length === 0) {
        return <div>No has agregado cartas aún.</div>;
    }

    return (
        <div>
            <div className="card-grid">
                {cards.map(({ card, count }) => (
                    <div key={card.id} style={{ textAlign: 'center' }}>
                        <img
                            src={card.images.small}
                            alt={card.name}
                            className="card-img"
                        />
                        <div>Cantidad: {count}</div>
                    </div>
                ))}
            </div>
            <div style={{ marginTop: '1rem', textAlign: 'center', fontWeight: 'bold' }}>
                Total de cartas: {total}
            </div>
        </div>
    );
}