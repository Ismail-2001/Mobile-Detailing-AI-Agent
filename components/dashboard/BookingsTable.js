'use client';

import { useState, useEffect } from 'react';
import styles from './BookingsTable.module.css';
import { MoreVertical, RefreshCw } from 'lucide-react';

export default function BookingsTable() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/bookings');
            const data = await response.json();
            setBookings(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch bookings:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'confirmed': return '#10b981';
            case 'pending': return '#f59e0b';
            case 'cancelled': return '#ef4444';
            default: return '#6b7280';
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>All Bookings</h2>
                <div className={styles.filters}>
                    <button onClick={fetchBookings} className={styles.refreshBtn}>
                        <RefreshCw size={16} className={loading ? styles.spinning : ''} />
                    </button>
                    <select className={styles.filterSelect}>
                        <option>All Status</option>
                        <option>Pending</option>
                        <option>Confirmed</option>
                    </select>
                </div>
            </div>

            {loading && bookings.length === 0 ? (
                <div className={styles.loading}>Loading bookings...</div>
            ) : (
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Customer</th>
                            <th>Service</th>
                            <th>Vehicle</th>
                            <th>Date & Time</th>
                            <th>Status</th>
                            <th>Price</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.map((booking) => (
                            <tr key={booking.id}>
                                <td>
                                    <div className={styles.customerInfo}>
                                        <strong>{booking.customer_name || 'Inquiry'}</strong>
                                        <span>{booking.phone || 'No phone'}</span>
                                    </div>
                                </td>
                                <td>{booking.service}</td>
                                <td><span className={styles.badge}>{booking.vehicle_type}</span></td>
                                <td>
                                    <div className={styles.dateTime}>
                                        <div className={styles.date}>
                                            {booking.scheduled_at
                                                ? new Date(booking.scheduled_at).toLocaleDateString()
                                                : booking.booking_date}
                                        </div>
                                        <div className={styles.time}>
                                            {booking.scheduled_at
                                                ? new Date(booking.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                : booking.booking_time}
                                        </div>
                                    </div>
                                </td>

                                <td>
                                    <div className={styles.statusRow}>
                                        <div
                                            className={styles.statusDot}
                                            style={{ backgroundColor: getStatusColor(booking.status) }}
                                        ></div>
                                        {booking.status}
                                    </div>
                                </td>
                                <td className={styles.price}>${booking.service_price || booking.price}</td>
                                <td className={styles.actions}>
                                    <button className={styles.actionBtn}><MoreVertical size={16} /></button>
                                </td>
                            </tr>
                        ))}
                        {bookings.length === 0 && (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                    No bookings found. Try booking one with Maya!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );
}
