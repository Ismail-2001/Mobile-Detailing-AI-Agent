'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import BookingsTable from '@/components/dashboard/BookingsTable';
import Analytics from '@/components/dashboard/Analytics';
import CalendarGrid from '@/components/dashboard/CalendarGrid';
import styles from './Dashboard.module.css';
import { Lock } from 'lucide-react';

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState('bookings');
    const [isConnected, setIsConnected] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        if (password === 'cleaner2026') {
            setIsAuthenticated(true);
            localStorage.setItem('dash_auth', 'true');
        } else {
            setError('Unauthorized. Please check your credentials.');
        }
    };

    useEffect(() => {
        if (localStorage.getItem('dash_auth') === 'true') {
            setIsAuthenticated(true);
        }

        const checkStatus = async () => {
            try {
                const res = await fetch('/api/bookings');
                const data = await res.json();
                if (data.availability) setIsConnected(true);
            } catch (e) {
                console.error("Connection check failed:", e);
            }
        };
        checkStatus();
    }, []);

    if (!isAuthenticated) {
        return (
            <div className={styles.lockScreen}>
                <div className={styles.lockCard}>
                    <div className={styles.lockIcon}><Lock size={40} /></div>
                    <h2>Intelligence Portal</h2>
                    <p>Enter your executive credentials to access the Mr. Cleaner Intelligence Dashboard.</p>
                    <form onSubmit={handleLogin}>
                        <input
                            type="password"
                            placeholder="Access Code"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={styles.lockInput}
                        />
                        {error && <p className={styles.error}>{error}</p>}
                        <button type="submit" className={styles.lockBtn}>Initialize Access</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.wrapper}>
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            <main className={styles.content}>
                <header className={styles.header}>
                    <div>
                        <h1>Owner Dashboard</h1>
                        <p>Welcome back, Mr. Cleaner</p>
                    </div>
                    <div className={styles.status}>
                        <div className={styles.dot}></div>
                        Maya AI Assistant Active
                    </div>
                </header>

                <div className={styles.container}>
                    {activeTab === 'bookings' && <BookingsTable />}
                    {activeTab === 'analytics' && <Analytics />}
                    {activeTab === 'calendar' && (
                        isConnected ? (
                            <CalendarGrid />
                        ) : (
                            <div className={styles.placeholder}>
                                <h3>Calendar Sync</h3>
                                <p>Connect your business calendar to enable Maya to check your availability in real-time.</p>
                                <a
                                    href="/api/auth/google"
                                    className={styles.connectBtn}
                                    target="_blank"
                                >
                                    Connect Google Calendar
                                </a>
                            </div>
                        )
                    )}
                </div>
            </main>
        </div>
    );
}
