import React from 'react';

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { Navbar} from "./components/Navbar";
import {MyDecks} from './components/MyDecks';
import {CardManager} from "./components/shared/CardManager.jsx";

export function App() {
    return (
        <Router>
            <Navbar />
            <Routes>
                {/*<Route path="/" element={<Home />} />*/}
                <Route path="/binder" element={<CardManager typeCollection={"binder"} />} />
                <Route path="/mydecks" element={<MyDecks />} />
                <Route path="/deckview" element={<CardManager typeCollection={"deck"} />} />
                <Route path="/wishlist" element={<CardManager typeCollection={"wishlist"} />} />
            </Routes>
        </Router>
    )
}