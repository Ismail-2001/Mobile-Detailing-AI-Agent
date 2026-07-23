'use client';

import { useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function MagneticButton({ children, className, onClick, style }) {
    const ref = useRef(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const springX = useSpring(x, { stiffness: 300, damping: 20 });
    const springY = useSpring(y, { stiffness: 300, damping: 20 });

    function handleMouse(e) {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        x.set(dx * 0.3);
        y.set(dy * 0.3);
    }

    function handleLeave() {
        x.set(0);
        y.set(0);
    }

    return (
        <motion.button
            ref={ref}
            className={className}
            style={{ ...style, x: springX, y: springY }}
            onMouseMove={handleMouse}
            onMouseLeave={handleLeave}
            whileTap={{ scale: 0.97 }}
            onClick={onClick}
        >
            {children}
        </motion.button>
    );
}
