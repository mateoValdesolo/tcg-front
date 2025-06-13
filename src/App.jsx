import React from 'react';

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { Home } from './components/Home';
import { Navbar} from "./components/Navbar";
import { Binder } from './components/Binder';
import { DeckView } from './components/DeckView';
import {MyDecks} from './components/MyDecks';

export function App() {
    return (
        <Router>
            <Navbar />
            <Routes>
                {/*<Route path="/" element={<Home />} />*/}
                <Route path="/binder" element={<Binder />} />
                <Route path="/mydecks" element={<MyDecks />} />
                <Route path="/deckview" element={<DeckView />} />
            </Routes>
        </Router>
    )
}