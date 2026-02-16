'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './ChatInterface.module.css';
import { Send, X, Bot } from 'lucide-react';
import BookingSummary from './BookingSummary';
import { supabase } from '@/lib/supabase';

export default function ChatInterface({ onClose, initialMessage }) {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "Hi! This is Maya with Mr. Cleaner Mobile Detailing. Are you looking to schedule a detail today?" }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [bookingData, setBookingData] = useState(null);
    const [showSummary, setShowSummary] = useState(false);
    const [sessionId] = useState(() => 'sess_' + (typeof window !== 'undefined' ? window.crypto.randomUUID() : Math.random().toString(36).substr(2, 9)));
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    useEffect(() => {
        // --- STATE SOVEREIGNTY FIX ---
        const initSession = async () => {
            if (supabase) {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    await supabase.auth.signInAnonymously();
                }
            }
        };
        initSession();

        if (initialMessage) {
            handleSend(initialMessage);
        }
    }, []);

    const handleSend = async (text) => {
        const messageText = text || input;
        if (!messageText.trim()) return;

        const newUserMessage = {
            role: 'user',
            content: messageText
        };

        const updatedMessages = [...messages, newUserMessage];
        setMessages(updatedMessages);
        setInput('');
        setIsTyping(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-session-id': sessionId
                },
                body: JSON.stringify({
                    messages: updatedMessages.map(m => ({
                        role: m.role,
                        content: m.content
                    }))
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to get response");
            }

            const data = await response.json();
            setIsTyping(false);

            if (data.content) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
            }

            if (data.bookingData) {
                setBookingData(prev => ({ ...prev, ...data.bookingData }));
                if (data.bookingData.vehicle_type && data.bookingData.service) {
                    setShowSummary(true);
                }
            }
        } catch (error) {
            console.error("Chat error:", error);
            setIsTyping(false);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "I'm having a little trouble connecting to my brain right now."
            }]);
        }
    };

    const confirmBooking = async () => {
        try {
            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingData),
            });
            if (response.ok) {
                setMessages(prev => [...prev, { role: 'assistant', content: "Perfect! You're all set. I've sent a confirmation text to your phone. We'll see you soon!" }]);
                setShowSummary(false);
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={`${styles.container} animate-fade-in`}>
                <div className={styles.header}>
                    <div className={styles.botProfile}>
                        <div className={styles.avatar}><Bot size={24} /></div>
                        <div>
                            <h3>Maya</h3>
                            <span>Online • AI Booking Assistant</span>
                        </div>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}><X size={24} /></button>
                </div>

                <div className={styles.messageList}>
                    {messages.map((msg, i) => (
                        <div key={i} className={`${styles.messageRow} ${msg.role === 'user' ? styles.userRow : styles.botRow}`}>
                            <div className={styles.messageBubble}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className={styles.messageRow}>
                            <div className={`${styles.messageBubble} ${styles.typing}`}>
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                    )}
                    {showSummary && (
                        <BookingSummary
                            data={bookingData}
                            onConfirm={confirmBooking}
                            onCancel={() => setShowSummary(false)}
                        />
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className={styles.inputArea}>
                    <input
                        type="text"
                        placeholder={isTyping ? "Maya is thinking..." : "Type your message..."}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !isTyping && handleSend()}
                        disabled={isTyping}
                    />
                    <button
                        onClick={() => handleSend()}
                        className={styles.sendBtn}
                        disabled={!input.trim() || isTyping}
                    >
                        {isTyping ? <div className={styles.spinner}></div> : <Send size={20} />}
                    </button>
                </div>
            </div>
        </div>
    );
}
