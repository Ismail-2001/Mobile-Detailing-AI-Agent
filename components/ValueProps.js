'use client';

import { motion } from 'framer-motion';
import styles from './ValueProps.module.css';
import { Award, Timer, Target, Gem } from 'lucide-react';

const props = [
    {
        icon: <Gem size={28} />,
        title: "Concierge Quality",
        desc: "Every inch of your vehicle is treated with boutique-grade products and master precision."
    },
    {
        icon: <Timer size={28} />,
        title: "Time Autonomy",
        desc: "We bring the showroom to you. Stay focused while Maya manages logistics and scheduling."
    },
    {
        icon: <Target size={28} />,
        title: "Obsessive Detail",
        desc: "From engine bays to door jambs, our signature processes leave no surface untouched."
    },
    {
        icon: <Award size={28} />,
        title: "Certified Protection",
        desc: "Authorized installers of elite ceramic coatings with multi-year performance guarantees."
    }
];

const headerReveal = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    },
};

const containerReveal = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.12, delayChildren: 0.1 },
    },
};

const cardReveal = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    },
};

export default function ValueProps() {
    return (
        <section className={styles.section}>
            <div className="container">
                <motion.div
                    className={styles.header}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-80px' }}
                    variants={headerReveal}
                >
                    <span className={styles.badge}>Why Mr. Cleaner</span>
                    <h2 className={styles.title}>The Elite Difference</h2>
                </motion.div>
                <motion.div
                    className={styles.grid}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-80px' }}
                    variants={containerReveal}
                >
                    {props.map((prop, i) => (
                        <motion.div key={i} className={styles.card} variants={cardReveal}>
                            <div className={styles.iconWrapper}>{prop.icon}</div>
                            <h3>{prop.title}</h3>
                            <p>{prop.desc}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
