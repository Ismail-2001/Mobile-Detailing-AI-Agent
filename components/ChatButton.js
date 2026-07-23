'use client';

import { motion } from 'framer-motion';
import styles from './ChatButton.module.css';
import { MessageSquare } from 'lucide-react';

export default function ChatButton() {
    const handleClick = () => {
        window.dispatchEvent(new CustomEvent('open-chat'));
    };

    return (
        <motion.button
            className={styles.button}
            onClick={handleClick}
            aria-label="Open Maya Assistant"
            aria-describedby="chat-tooltip"
            initial={{ opacity: 0, scale: 0, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 1.5 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
        >
            <MessageSquare size={28} />
            <span className={styles.tooltip} id="chat-tooltip" role="tooltip">Book Now</span>
        </motion.button>
    );
}
