'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PageLoader() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 1800);
        return () => clearTimeout(timer);
    }, []);

    return (
        <AnimatePresence>
            {loading && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 10000,
                        background: '#0A0A0B',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '24px',
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                        }}
                    >
                        <span style={{
                            background: '#D4AF37',
                            color: '#0A0A0B',
                            padding: '12px 20px',
                            borderRadius: '12px',
                            fontFamily: "'Big Shoulders Display', sans-serif",
                            fontWeight: 900,
                            fontSize: '1.8rem',
                            letterSpacing: '-1px',
                        }}>MC</span>
                    </motion.div>

                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '120px' }}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
                        style={{
                            height: '2px',
                            background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)',
                            borderRadius: '1px',
                        }}
                    />

                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.8 }}
                        style={{
                            fontFamily: "'Manrope', sans-serif",
                            fontSize: '0.8rem',
                            color: 'rgba(255,255,255,0.3)',
                            textTransform: 'uppercase',
                            letterSpacing: '3px',
                        }}
                    >
                        Loading
                    </motion.p>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
