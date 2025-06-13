import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import brandImg from '../assets/tcg.png';
import '../styles/Navbar.css';


export function Navbar() {
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
                        <li className='exclude'>
                            <Link to="/">
                                <span className='brand-text'>MyBinder</span>
                            </Link>
                        </li>
                        <li>
                            <Link to="/binder">Binder</Link>
                        </li>
                        <li>
                            <Link to="/mydecks">MyDecks</Link>
                        </li>
                    </ul>
                </div>
            </nav>
            <Outlet/>
        </>
    )
}