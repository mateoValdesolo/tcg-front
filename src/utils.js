export function calcularProbabilidadMulligan(collection) {
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
export function probabilidadExactaBasicos(collection, k) {
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
export function probabilidadAlMenosKBasicos(collection, k) {
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