import pokemon from 'pokemontcgsdk';

pokemon.configure({ apiKey: import.meta.env.API_TCG_KEY });

export default pokemon;