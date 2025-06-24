import React from 'react';

import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';

import {Home} from './components/Home';
import {Navbar} from "./components/Navbar";
import {Binder} from './components/Binder';
import {DeckView} from './components/DeckView';
import {MyDecks} from './components/MyDecks';
import {Wishlist} from "./components/Wishlist.jsx";
import {Tournaments} from './components/Tournaments';
import {TournamentDetail} from './components/shared/TournamentDetail';
import {UserProvider} from './context/UserContext.jsx';

export function App() {
    return (
        <UserProvider>
            <Router>
                <Navbar/>
                <Routes>
                    {/*<Route path="/" element={<Home />} />*/}
                    <Route path="/binder" element={<Binder/>}/>
                    <Route path="/mydecks" element={<MyDecks/>}/>
                    <Route path="/deckview" element={<DeckView/>}/>
                    <Route path="/wishlist" element={<Wishlist/>}/>
                    <Route path="/torneos" element={<Tournaments/>}/>
                    <Route path="/torneos/:id" element={<TournamentDetail/>}/>
                </Routes>
            </Router>
        </UserProvider>
    )
}