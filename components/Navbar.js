'use client';

import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import styles from './Navbar.module.css';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const { scrollY } = useScroll();
    const bgOpacity = useTransform(scrollY, [0, 80], [0.8, 0.95]);
    const borderOpacity = useTransform(scrollY, [0, 80], [0.05, 0.1]);

    // Close mobile menu on resize to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768) setMenuOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <motion.nav
            className={styles.nav}
            style={{
                backgroundColor: useTransform(bgOpacity, (o) => `rgba(10, 10, 11, ${o})`),
                borderColor: useTransform(borderOpacity, (o) => `rgba(255, 255, 255, ${o})`),
            }}
        >
            <div className="container">
                <div className={styles.wrapper}>
                    <div className={styles.logo}>
                        <span className={styles.mc}>MC</span>
                        <span className={styles.text}>Mr. Cleaner</span>
                    </div>

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

                {menuOpen && (
                    <motion.div
                        className={styles.mobileMenu}
                        role="menu"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    >
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
                    </motion.div>
                )}
            </div>
        </motion.nav>
    );
}
