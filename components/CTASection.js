'use client';

import { motion } from 'framer-motion';
import MagneticButton from './MagneticButton';
import styles from './CTASection.module.css';
import { ArrowRight, MessageSquare } from 'lucide-react';

const contentReveal = {
    hidden: { opacity: 0, scale: 0.95, y: 40 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
    },
};

export default function CTASection() {
    return (
        <section className={styles.section}>
            <div className={styles.bgGlow}></div>
            <div className="container">
                <motion.div
                    className={styles.content}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-80px' }}
                    variants={contentReveal}
                >
                    <span className={styles.badge}>Ready to Begin?</span>
                    <h2 className={styles.title}>
                        Your Vehicle Deserves<br />
                        <span className={styles.gold}>Elite Care</span>
                    </h2>
                    <p className={styles.description}>
                        Chat with Maya, our AI concierge, to get a personalized quote
                        and book your appointment in under 60 seconds.
                    </p>
                    <div className={styles.actions}>
                        <MagneticButton
                            className={styles.primaryBtn}
                            onClick={() => window.dispatchEvent(new CustomEvent('open-chat'))}
                        >
                            <MessageSquare size={18} />
                            Chat with Maya
                        </MagneticButton>
                        <a href="tel:+15074797804" className={styles.secondaryBtn}>
                            Call Us Now
                            <ArrowRight size={16} />
                        </a>
                    </div>
                    <p className={styles.note}>
                        No commitment required. Get your personalized quote in seconds.
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
