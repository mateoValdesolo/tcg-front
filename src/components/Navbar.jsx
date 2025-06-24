import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import brandImg from '../assets/tcg.png';
import '../styles/Navbar.css';
import { GoogleLoginButton } from './shared/GoogleLoginButton.jsx';
import { useUser } from '../context/UserContext.jsx';

export function Navbar() {
    const { userId, setUserId } = useUser();

    const handleLogout = () => {
        setUserId('');
        localStorage.removeItem('userId');
    };

    return (
        <>
            <nav>
                <div>
                    <ul>
                        <li className='exclude'>
                            <Link to="/">
                                <img src={brandImg} alt="Brand" style={{ height: '40px' }} />
                            </Link>
                        </li>
                        {/*<li className='exclude'>*/}
                        {/*    <Link to="/">*/}
                        {/*        <span className='brand-text'>MyBinder</span>*/}
                        {/*    </Link>*/}
                        {/*</li>*/}
                        <li>
                            <Link to="/binder">Binder</Link>
                        </li>
                        <li>
                            <Link to="/mydecks">MyDecks</Link>
                        </li>
                        <li>
                            <Link to="/wishlist">Wishlist</Link>
                        </li>
                        <li>
                            <Link to="/torneos">Torneos</Link>
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
    )
}