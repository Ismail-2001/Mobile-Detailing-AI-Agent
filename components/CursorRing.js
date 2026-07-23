'use client';

import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function CursorRing() {
    const cursorX = useMotionValue(-100);
    const cursorY = useMotionValue(-100);

    const springConfig = { damping: 25, stiffness: 400, mass: 0.5 };
    const cursorXSpring = useSpring(cursorX, springConfig);
    const cursorYSpring = useSpring(cursorY, springConfig);

    useEffect(() => {
        const isDesktop = window.matchMedia('(min-width: 1024px) and (hover: hover)').matches;
        if (!isDesktop) return;

        const handleMouseMove = (e) => {
            cursorX.set(e.clientX - 20);
            cursorY.set(e.clientY - 20);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [cursorX, cursorY]);

    useEffect(() => {
        const isDesktop = window.matchMedia('(min-width: 1024px) and (hover: hover)').matches;
        if (!isDesktop) return;

        document.body.style.cursor = 'none';

        const interactiveElements = document.querySelectorAll('a, button, [role="button"], input, textarea, select, [tabindex]');
        
        const addHoverClass = () => document.body.classList.add('cursor-hover');
        const removeHoverClass = () => document.body.classList.remove('cursor-hover');

        interactiveElements.forEach(el => {
            el.style.cursor = 'none';
            el.addEventListener('mouseenter', addHoverClass);
            el.addEventListener('mouseleave', removeHoverClass);
        });

        return () => {
            document.body.style.cursor = '';
            document.body.classList.remove('cursor-hover');
            interactiveElements.forEach(el => {
                el.style.cursor = '';
                el.removeEventListener('mouseenter', addHoverClass);
                el.removeEventListener('mouseleave', removeHoverClass);
            });
        };
    }, []);

    return (
        <>
            <motion.div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: '2px solid var(--gold)',
                    pointerEvents: 'none',
                    zIndex: 9999,
                    x: cursorXSpring,
                    y: cursorYSpring,
                    transition: 'width 0.3s, height 0.3s, border-color 0.3s',
                    mixBlendMode: 'difference',
                }}
                className="cursor-ring"
            />
            <style>{`
                @media (min-width: 1024px) and (hover: hover) {
                    .cursor-ring {
                        width: 40px;
                        height: 40px;
                    }
                    body.cursor-hover .cursor-ring {
                        width: 60px;
                        height: 60px;
                        border-color: var(--platinum);
                    }
                }
                @media (max-width: 1023px), (hover: none) {
                    .cursor-ring {
                        display: none;
                    }
                }
            `}</style>
        </>
    );
}
