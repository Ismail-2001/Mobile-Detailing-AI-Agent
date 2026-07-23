'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ArrowRight } from 'lucide-react';
import styles from './ServiceModal.module.css';

const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
};

const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 30 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { type: 'spring', damping: 25, stiffness: 300 },
    },
    exit: {
        opacity: 0,
        scale: 0.9,
        y: 30,
        transition: { duration: 0.2 },
    },
};

const staggerContainer = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.05 },
    },
};

const staggerItem = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
};

export default function ServiceModal({ service, isOpen, onClose }) {
    const modalRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };

        const handleFocusTrap = (e) => {
            if (e.key !== 'Tab' || !modalRef.current) return;
            const focusable = modalRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', handleEscape);
        document.addEventListener('keydown', handleFocusTrap);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.removeEventListener('keydown', handleFocusTrap);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen && modalRef.current) {
            modalRef.current.focus();
        }
    }, [isOpen]);

    if (!service) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className={styles.overlay}
                    variants={overlayVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onClick={onClose}
                >
                    <motion.div
                        ref={modalRef}
                        className={styles.modal}
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="modal-title"
                        tabIndex={-1}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className={styles.closeBtn}
                            onClick={onClose}
                            aria-label="Close modal"
                        >
                            <X size={24} />
                        </button>

                        <div className={styles.header}>
                            <span className={styles.badge}>{service.popular ? 'Most Popular' : 'Service'}</span>
                            <h2 id="modal-title" className={styles.title}>{service.title}</h2>
                            <div className={styles.priceRow}>
                                <span className={styles.price}>{service.price}</span>
                                <span className={styles.suffix}>{service.priceSuffix}</span>
                            </div>
                            <span className={styles.duration}>{service.duration}</span>
                        </div>

                        <div className={styles.content}>
                            <h3 className={styles.sectionTitle}>What&apos;s Included</h3>
                            <motion.ul
                                className={styles.featureList}
                                variants={staggerContainer}
                                initial="hidden"
                                animate="visible"
                            >
                                {service.features.map((feature, i) => (
                                    <motion.li key={i} className={styles.feature} variants={staggerItem}>
                                        <Check size={18} className={styles.checkIcon} />
                                        <span>{feature}</span>
                                    </motion.li>
                                ))}
                            </motion.ul>

                            <div className={styles.description}>
                                <h3 className={styles.sectionTitle}>About This Service</h3>
                                <p className={styles.descriptionText}>
                                    Our {service.title} package is meticulously designed to deliver exceptional results.
                                    Every detail is handled with precision and care, using only the finest products and techniques.
                                </p>
                            </div>
                        </div>

                        <div className={styles.footer}>
                            <button
                                className={styles.bookBtn}
                                onClick={() => {
                                    window.dispatchEvent(new CustomEvent('open-chat', { detail: { service: service.title } }));
                                    onClose();
                                }}
                            >
                                Book This Service
                                <ArrowRight size={18} />
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
