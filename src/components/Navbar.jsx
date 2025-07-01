import React, { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import brandImg from '../assets/tcg.png';
import '../styles/Navbar.css';
import { GoogleLoginButton } from './shared/GoogleLoginButton.jsx';
import { useUser } from '../context/UserContext.jsx';

export function Navbar() {
    const { userId, setUserId } = useUser();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleLogout = () => {
        setUserId('');
        localStorage.removeItem('userId');
        navigate('/');
        setMenuOpen(false);
    };

    const handleMenuToggle = () => setMenuOpen(open => !open);
    const handleLinkClick = () => setMenuOpen(false);

    return (
        <>
            <nav>
                <Link to="/" onClick={handleLinkClick} className="exclude">
                    <img src={brandImg} alt="Brand" className="brand-img" />
                </Link>
                <button className="menu-toggle" onClick={handleMenuToggle} aria-label="Abrir menú">
                    &#9776;
                </button>
                <div>
                    <ul className={menuOpen ? 'open' : ''}>
                        <li>
                            <Link to="/binder" onClick={handleLinkClick}>Binder</Link>
                        </li>
                        <li>
                            <Link to="/mydecks" onClick={handleLinkClick}>MyDecks</Link>
                        </li>
                        <li>
                            <Link to="/wishlist" onClick={handleLinkClick}>Wishlist</Link>
                        </li>
                        <li>
                            <Link to="/torneos" onClick={handleLinkClick}>Torneos</Link>
                        </li>
                        <li>
                            <Link to="/calendar" onClick={handleLinkClick}>Calendario</Link>
                        </li>
                        <li className="right">
                            {userId
                                ? <button onClick={handleLogout} className="logout-btn">Cerrar sesión</button>
                                : <GoogleLoginButton key={userId || 'logout'} onLogin={setUserId} />
                            }
                        </li>
                    </ul>
                </div>
            </nav>
            <Outlet/>
        </>
    );
}