'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Clock, AlertCircle } from 'lucide-react';
import styles from './profile.module.css';
import { historyService } from '@/services/api';
import { HistoryRecord, VerificationStats } from '@/types/history';

export default function UserProfile() {
    const [stats, setStats] = useState<VerificationStats | null>(null);
    const [recentActivity, setRecentActivity] = useState<HistoryRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;

    useEffect(() => {
        loadData(currentPage);
    }, [currentPage]);

    /* -------------------------
       Helpers (DO NOT TOUCH UI)
    ------------------------- */

    const isTrue = (v: any) => v === true || v === 1;

    const getRelativeTime = (timestamp: string) => {
        const now = new Date();
        const past = new Date(timestamp);
        const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 30) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
        
        const diffInMonths = Math.floor(diffInDays / 30);
        return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
    };

    const loadData = async (page: number) => {
        try {
            setLoading(true);
            const offset = (page - 1) * pageSize;
            const [statsRes, historyRes] = await Promise.all([
                historyService.getVerificationStats(),
                historyService.getRecentActivity(pageSize, offset)
            ]);

            setStats(statsRes.stats);
            setRecentActivity(historyRes.verifications);
        } catch (error) {
            console.error('Failed to load profile data:', error);
        } finally {
            setLoading(false);
        }
    };



    if (loading) {
        return (
            <div className={styles.container}>
                <main className={styles.mainContainer}>
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
                        <p className="mt-4 text-slate-600">Loading profile...</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <main className={styles.mainContainer}>

                {/* Candidate Info Block */}
                <div className={styles.candidateInfoBlock}>
                    <div className={styles.avatar}>R</div>
                    <div className={styles.candidateDetails}>
                        <div className={styles.candidateNameLarge}>Roopak Krishna</div>
                        <div className={styles.candidateDobLarge}>
                            Certificate Verification System
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className={styles.statsGrid}>
                    <div className={`${styles.statCard} border-2 border-orange-600 rounded-xl p-6 flex flex-col items-center justify-center bg-white shadow-sm`}>
                        <div className="text-xs font-bold text-slate-400 tracking-wider mb-2">VERIFIED</div>
                        <div className="text-5xl font-extrabold text-slate-900">{stats?.verified_count || 0}</div>
                    </div>

                    <div className={`${styles.statCard} border-2 border-slate-100 rounded-xl p-6 flex flex-col items-center justify-center bg-white shadow-sm`}>
                        <div className="text-xs font-bold text-slate-400 tracking-wider mb-2">PENDING</div>
                        <div className="text-5xl font-extrabold text-slate-900">{stats?.unverified_count || 0}</div>
                    </div>

                    <div className={`${styles.statCard} border-2 border-slate-100 rounded-xl p-6 flex flex-col items-center justify-center bg-white shadow-sm`}>
                        <div className="text-xs font-bold text-slate-400 tracking-wider mb-2">EXPIRED</div>
                        <div className="text-5xl font-extrabold text-slate-900">{stats?.high_risk_count || 0}</div>
                    </div>

                    <div className={`${styles.statCard} border-2 border-orange-600 bg-orange-600 rounded-xl p-6 flex flex-col items-center justify-center shadow-md`}>
                        <div className="text-xs font-bold text-orange-100 tracking-wider mb-2">TOTAL CERTIFICATES</div>
                        <div className="text-5xl font-extrabold text-white">{stats?.total_verifications || 0}</div>
                    </div>
                </div>

                {/* Recent Activity Table (UI SAME + SERIAL NUMBERS) */}
                <div className={styles.tableContainer}>
                    <div className={styles.tableHeader}>
                        <h3 className={styles.tableTitle}>Recent User Activity Logs</h3>
                        <a href="/recent-activity" className={styles.viewAllBtn}>View All</a>
                    </div>

                    <table className={styles.table}>
                        <thead>
                            <tr className={styles.tr}>
                                <th className={`${styles.th} text-slate-400 font-bold uppercase tracking-wider text-xs`}>#</th>
                                <th className={`${styles.th} text-slate-400 font-bold uppercase tracking-wider text-xs`}>CERTIFICATE</th>
                                <th className={`${styles.th} ${styles.colDesc} text-slate-400 font-bold uppercase tracking-wider text-xs`}>ISSUER ORGANISATION</th>
                                <th className={`${styles.th} text-slate-400 font-bold uppercase tracking-wider text-xs`}>ISSUE DATE</th>
                                <th className={`${styles.th} text-slate-400 font-bold uppercase tracking-wider text-xs`}>ACTIVITY</th>
                                <th className={`${styles.th} text-slate-400 font-bold uppercase tracking-wider text-xs`} style={{ textAlign: 'center' }}>STATUS</th>
                                <th className={`${styles.th} text-slate-400 font-bold uppercase tracking-wider text-xs`} style={{ textAlign: 'center' }}>VALIDATION CERTIFICATE</th>
                            </tr>
                        </thead>

                        <tbody>
                            {recentActivity.length === 0 ? (
                                <tr className={styles.tr}>
                                    <td colSpan={7} className={styles.td} style={{ textAlign: 'center', padding: '2rem' }}>
                                        No recent activity
                                    </td>
                                </tr>
                            ) : (
                                recentActivity.map((record, index) => (
                                    <tr key={record.id} className={styles.tr}>
                                        
                                        {/* SERIAL NUMBER */}
                                        <td className={`${styles.td} text-slate-400 font-medium`}>
                                            {(currentPage - 1) * pageSize + index + 1}
                                        </td>

                                        <td className={`${styles.td} font-bold text-slate-900`}>
                                            {record.course_name || record.filename || 'Unknown Certificate'}
                                        </td>

                                        <td className={`${styles.td} ${styles.colDesc} text-slate-600`}>
                                            {record.issuer || 'Unknown Issuer'}
                                        </td>

                                        <td className={`${styles.td} text-slate-600`}>
                                            {record.issue_date || 'N/A'}
                                        </td>

                                        <td className={`${styles.td} text-slate-500 italic text-sm`}>
                                            {getRelativeTime(record.timestamp)}
                                        </td>

                                        <td className={styles.td} style={{ textAlign: 'center' }}>
                                            <div className="flex flex-col items-center justify-center gap-1.5 py-2">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-bold ${
                                                    isTrue(record.is_verified) 
                                                        ? 'bg-green-100 text-green-600' 
                                                        : isTrue(record.is_high_risk)
                                                            ? 'bg-red-100 text-red-600'
                                                            : 'bg-yellow-100 text-yellow-600'
                                                }`}>
                                                    {isTrue(record.is_verified) ? (
                                                        <><CheckCircle className="w-3.5 h-3.5 stroke-[3]" /> Verified</>
                                                    ) : isTrue(record.is_high_risk) ? (
                                                        <><AlertCircle className="w-3.5 h-3.5 stroke-[3]" /> Expired</>
                                                    ) : (
                                                        <><Clock className="w-3.5 h-3.5 stroke-[3]" /> Pending</>
                                                    )}
                                                </span>
                                            </div>
                                        </td>

                                        <td className={styles.td} style={{ textAlign: 'center' }}>
                                            {isTrue(record.is_verified) && (
                                                <a 
                                                    href={record.validation_certificate_link || '#'} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 font-bold transition-colors"
                                                >
                                                    Download
                                                </a>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between mt-6 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <div className="text-sm text-slate-500">
                        Showing <span className="font-bold text-slate-900">{recentActivity.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> to <span className="font-bold text-slate-900">{(currentPage - 1) * pageSize + recentActivity.length}</span> of <span className="font-bold text-slate-900">{stats?.total_verifications || 0}</span> certificates
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1 || loading}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                currentPage === 1 || loading
                                    ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                            }`}
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            disabled={(stats?.total_verifications || 0) <= currentPage * pageSize || loading}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                (stats?.total_verifications || 0) <= currentPage * pageSize || loading
                                    ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                            }`}
                        >
                            Next
                        </button>
                    </div>
                </div>

            </main>
        </div>
    );
}
