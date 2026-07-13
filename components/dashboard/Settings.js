'use client';

import { useState, useEffect } from 'react';
import styles from './Settings.module.css';
import {
    Building2,
    Smartphone,
    Globe,
    ShieldCheck,
    Database,
    Calendar,
    MessageCircle,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';

export default function Settings() {
    const [status, setStatus] = useState({
        supabase: 'checking',
        google: 'checking',
        gemini: 'checking',
    });
    const [saveMessage, setSaveMessage] = useState('');
    const [settings, setSettings] = useState({
        business_name: 'Mr. Cleaner Mobile Detailing',
        location: 'Texas, USA',
        timezone: 'America/Chicago',
        twilio_phone: '+1 (507) 479-7804',
        whatsapp_number: '+1 (507) 479-7804',
        ai_personality: 'maya',
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                const [healthRes, settingsRes] = await Promise.all([
                    fetch('/api/health'),
                    fetch('/api/dashboard/settings'),
                ]);
                const health = await healthRes.json();
                setStatus({
                    supabase: health.checks?.supabase === 'healthy' ? 'connected' : 'disconnected',
                    google: health.checks?.google_calendar === 'configured' ? 'connected' : 'disconnected',
                    gemini: health.checks?.gemini === 'configured' ? 'connected' : 'disconnected',
                });
                const settingsData = await settingsRes.json();
                if (settingsData.settings) {
                    setSettings(prev => ({ ...prev, ...settingsData.settings }));
                }
            } catch {
                setStatus({ supabase: 'disconnected', google: 'disconnected', gemini: 'disconnected' });
            }
        };
        init();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setSaveMessage('');
        try {
            const res = await fetch('/api/dashboard/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings }),
            });
            if (res.ok) {
                setSaveMessage('Settings saved successfully!');
            } else {
                setSaveMessage('Failed to save settings.');
            }
        } catch {
            setSaveMessage('Connection failed.');
        } finally {
            setSaving(false);
            setTimeout(() => setSaveMessage(''), 3000);
        }
    };

    const update = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const StatusBadge = ({ state }) => {
        if (state === 'connected') return <span className={styles.statusConnected}><CheckCircle2 size={14} /> Systems Online</span>;
        if (state === 'disconnected') return <span className={styles.statusError}><AlertCircle size={14} /> Action Required</span>;
        return <span className={styles.statusChecking}>Checking...</span>;
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h3>Internal Configuration</h3>
                    <p>Manage your business infrastructure and AI parameters.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {saveMessage && <span style={{ color: '#30D158', fontSize: '14px' }}>{saveMessage}</span>}
                    <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save All Changes'}</button>
                </div>
            </header>

            <div className={styles.grid}>
                {/* Section 1: Business Identity */}
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <Building2 size={20} />
                        <h4>Business Identity</h4>
                    </div>
                    <div className={styles.formGroup}>
                        <label>Business Legal Name</label>
                        <input type="text" value={settings.business_name} onChange={e => update('business_name', e.target.value)} />
                    </div>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label>Base Operations</label>
                            <input type="text" value={settings.location} onChange={e => update('location', e.target.value)} />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Primary Timezone</label>
                            <select value={settings.timezone} onChange={e => update('timezone', e.target.value)}>
                                <option value="America/Chicago">Central Time (CST)</option>
                                <option value="America/New_York">Eastern Time (EST)</option>
                                <option value="America/Los_Angeles">Pacific Time (PST)</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* Section 2: Concierge Channels */}
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <Smartphone size={20} />
                        <h4>Concierge Channels</h4>
                    </div>
                    <div className={styles.formGroup}>
                        <label>Business SMS Line (Twilio)</label>
                        <input type="text" value={settings.twilio_phone} onChange={e => update('twilio_phone', e.target.value)} />
                    </div>
                    <div className={styles.formGroup}>
                        <label>WhatsApp Specialist Number</label>
                        <input type="text" value={settings.whatsapp_number} onChange={e => update('whatsapp_number', e.target.value)} />
                    </div>
                    <div className={styles.formGroup}>
                        <label>AI Assistant Personality</label>
                        <select value={settings.ai_personality} onChange={e => update('ai_personality', e.target.value)}>
                            <option value="maya">Maya (Elite Concierge)</option>
                            <option value="bruno">Bruno (Rugged Specialist)</option>
                        </select>
                    </div>
                </section>

                {/* Section 3: Neural Link Status */}
                <section className={`${styles.section} ${styles.fullWidth}`}>
                    <div className={styles.sectionHeader}>
                        <ShieldCheck size={20} />
                        <h4>Neural Link & Provider Integrity</h4>
                    </div>
                    <div className={styles.statusGrid}>
                        <div className={styles.statusItem}>
                            <div className={styles.providerInfo}>
                                <Database size={18} />
                                <div>
                                    <h5>Supabase Cloud</h5>
                                    <p>Primary Data Persistence</p>
                                </div>
                            </div>
                            <StatusBadge state={status.supabase} />
                        </div>
                        <div className={styles.statusItem}>
                            <div className={styles.providerInfo}>
                                <Calendar size={18} />
                                <div>
                                    <h5>Google Calendar API</h5>
                                    <p>Real-time Availability Sync</p>
                                </div>
                            </div>
                            <StatusBadge state={status.google} />
                        </div>
                        <div className={styles.statusItem}>
                            <div className={styles.providerInfo}>
                                <Globe size={18} />
                                <div>
                                    <h5>Gemini AI</h5>
                                    <p>Primary Reasoning Engine</p>
                                </div>
                            </div>
                            <StatusBadge state={status.gemini} />
                        </div>
                        <div className={styles.statusItem}>
                            <div className={styles.providerInfo}>
                                <MessageCircle size={18} />
                                <div>
                                    <h5>Twilio SMS</h5>
                                    <p>Owner Lead Notifications</p>
                                </div>
                            </div>
                            <span className={styles.statusConnected}><CheckCircle2 size={14} /> Available</span>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
