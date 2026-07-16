'use client';

import { useState } from 'react';
import styles from './Navbar.module.css';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <nav className={styles.nav}>
            <div className="container">
                <div className={styles.wrapper}>
                    <div className={styles.logo}>
                        <span className={styles.mc}>MC</span>
                        <span className={styles.text}>Mr. Cleaner</span>
                    </div>

                    {/* Desktop links */}
                    <div className={styles.links}>
                        <a href="#services">Services</a>
                        <button
                            type="button"
                            className={styles.cta}
                            onClick={() => window.dispatchEvent(new CustomEvent('open-chat'))}
                        >
                            Book Now
                        </button>
                    </div>

                    {/* Mobile hamburger */}
                    <button
                        type="button"
                        className={styles.hamburger}
                        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                        aria-expanded={menuOpen}
                        onClick={() => setMenuOpen(!menuOpen)}
                    >
                        {menuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile dropdown */}
                {menuOpen && (
                    <div className={styles.mobileMenu} role="menu">
                        <a href="#services" onClick={() => setMenuOpen(false)} role="menuitem">Services</a>
                        <button
                            type="button"
                            className={styles.cta}
                            role="menuitem"
                            onClick={() => {
                                setMenuOpen(false);
                                window.dispatchEvent(new CustomEvent('open-chat'));
                            }}
                        >
                            Book Now
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
}
