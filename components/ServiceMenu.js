'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import TiltCard from './TiltCard';
import ServiceModal from './ServiceModal';
import styles from './ServiceMenu.module.css';
import { Check, ArrowRight, Sparkles, Crown, Shield } from 'lucide-react';

const SERVICE_ICONS = {
    basic: Sparkles,
    premium: Crown,
    full: Shield,
};

const SERVICES = [
    {
        id: 'basic',
        title: 'Executive Preservation',
        price: '$120',
        priceSuffix: ' starting',
        duration: '1.5 Hours',
        features: ['Boutique Hand Wash', 'Tire Glaze & Dressing', 'Crystal Window Finish', 'Ceramic Spray Sealant'],
    },
    {
        id: 'premium',
        title: 'The Master Detail',
        price: '$250',
        priceSuffix: ' starting',
        duration: '3.5 Hours',
        popular: true,
        features: ['Everything in Executive', 'Decontamination Wash', 'Single-Stage Paint Correction', 'Deep Interior Extraction', 'Leather Hydration Treatment'],
    },
    {
        id: 'full',
        title: 'Signature Ceramic',
        price: '$450',
        priceSuffix: ' starting',
        duration: '6+ Hours',
        features: ['Everything in Master', 'Engine Room Detailing', 'Multi-Stage Paint Correction', '3-Year Ceramic Coating', 'Fabric Protection'],
    }
];

const containerReveal = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.15, delayChildren: 0.1 },
    },
};

const cardReveal = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
    },
};

const iconReveal = {
    hidden: { opacity: 0, scale: 0, rotate: -180 },
    visible: {
        opacity: 1,
        scale: 1,
        rotate: 0,
        transition: { type: 'spring', stiffness: 200, damping: 15, delay: 0.3 },
    },
};

const headerReveal = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    },
};

export default function ServiceMenu() {
    const [selectedService, setSelectedService] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleCardClick = (service) => {
        setSelectedService(service);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedService(null), 300);
    };

    return (
        <section id="services" className={styles.section}>
            <div className="container">
                <motion.div
                    className={styles.header}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-80px' }}
                    variants={headerReveal}
                >
                    <span className={styles.badge}>Our Packages</span>
                    <h2 className={styles.title}>Detailing Packages</h2>
                    <p className={styles.subtitle}>Choose the level of care your vehicle needs</p>
                </motion.div>

                <motion.div
                    className={styles.grid}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-80px' }}
                    variants={containerReveal}
                >
                    {SERVICES.map((service) => {
                        const ServiceIcon = SERVICE_ICONS[service.id];
                        return (
                            <TiltCard
                                key={service.id}
                                className={`${styles.card} ${service.popular ? styles.popular : ''}`}
                                disabled={service.popular}
                            >
                                <motion.div variants={cardReveal}>
                                    {service.popular && <div className={styles.popBadge}>Most Popular</div>}
                                    <div className={styles.cardHeader} onClick={() => handleCardClick(service)} style={{ cursor: 'pointer' }}>
                                        <motion.div
                                            className={styles.iconContainer}
                                            variants={iconReveal}
                                        >
                                            <ServiceIcon size={32} className={styles.serviceIcon} />
                                        </motion.div>
                                        <h3 className={styles.cardTitle}>{service.title}</h3>
                                        <div className={styles.priceContainer}>
                                            <span className={styles.price}>{service.price}</span>
                                            <span className={styles.suffix}>{service.priceSuffix}</span>
                                        </div>
                                        <span className={styles.duration}>{service.duration}</span>
                                    </div>
                                <ul className={styles.features}>
                                    {service.features.map((feature, j) => (
                                        <li key={j} className={styles.feature}>
                                            <Check size={16} className={styles.featureIcon} />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <button
                                    className={service.popular ? styles.activeBtn : styles.btn}
                                    onClick={() => window.dispatchEvent(new CustomEvent('open-chat', { detail: { service: service.title } }))}
                                >
                                    Book This Service
                                    <ArrowRight size={16} />
                                </button>
                            </motion.div>
                        </TiltCard>
                        );
                    })}
                </motion.div>
            </div>

            <ServiceModal
                service={selectedService}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
            />
        </section>
    );
}
