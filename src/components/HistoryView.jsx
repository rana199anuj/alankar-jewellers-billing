import React, { useState, useEffect } from 'react';
import * as API from '../api';

export default function HistoryView({ onViewInvoice }) {
    const [bills, setBills] = useState([]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('ALL'); // ALL, TODAY, PENDING, PAID

    useEffect(() => {
        loadBills();
    }, []);

    const loadBills = async () => {
        try {
            const data = await API.getBills();
            setBills(data);
        } catch (e) {
            console.error("Failed to load bills", e);
        }
    };

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
    };

    // Filter bills based on search query and chip filters
    const filteredBills = bills.filter(bill => {
        // 1. Search filter
        const query = search.toLowerCase();
        const matchesSearch = 
            (bill.customer_name && bill.customer_name.toLowerCase().includes(query)) ||
            (bill.invoice_no && bill.invoice_no.toLowerCase().includes(query));
        
        if (!matchesSearch) return false;

        // 2. Chip filter
        if (filter === 'TODAY') {
            const todayStr = new Date().toLocaleDateString();
            return bill.date === todayStr;
        }
        if (filter === 'PENDING') {
            return bill.status === 'Pending';
        }
        if (filter === 'PAID') {
            return bill.status === 'Paid';
        }

        return true;
    });

    return (
        <div className="fade-in space-y-6 pb-20">
            {/* Header & Subtitle */}
            <div>
                <h2 className="font-headline text-2xl font-bold text-primary mb-1">Bill History</h2>
                <p className="font-body text-xs text-on-surface-variant">Review and manage your latest transactions.</p>
            </div>

            {/* Search Bar */}
            <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-60">search</span>
                <input 
                    type="text"
                    placeholder="Search by customer or invoice ID..."
                    value={search}
                    onChange={handleSearchChange}
                    className="w-full bg-white border border-border-gold rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-body text-sm text-on-surface shadow-sm"
                />
            </div>

            {/* Filter Chips */}
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                <button 
                    onClick={() => setFilter('ALL')}
                    className={`whitespace-nowrap px-4 py-2 rounded-full font-body text-xs font-bold transition-all active:scale-95 cursor-pointer ${filter === 'ALL' ? 'bg-primary text-white shadow-md' : 'bg-white border border-border-gold text-on-surface-variant hover:bg-surface-container-low'}`}
                >
                    ALL BILLS
                </button>
                <button 
                    onClick={() => setFilter('TODAY')}
                    className={`whitespace-nowrap px-4 py-2 rounded-full font-body text-xs font-bold transition-all active:scale-95 cursor-pointer ${filter === 'TODAY' ? 'bg-primary text-white shadow-md' : 'bg-white border border-border-gold text-on-surface-variant hover:bg-surface-container-low'}`}
                >
                    TODAY
                </button>
                <button 
                    onClick={() => setFilter('PAID')}
                    className={`whitespace-nowrap px-4 py-2 rounded-full font-body text-xs font-bold transition-all active:scale-95 cursor-pointer ${filter === 'PAID' ? 'bg-primary text-white shadow-md' : 'bg-white border border-border-gold text-on-surface-variant hover:bg-surface-container-low'}`}
                >
                    PAID
                </button>
                <button 
                    onClick={() => setFilter('PENDING')}
                    className={`whitespace-nowrap px-4 py-2 rounded-full font-body text-xs font-bold transition-all active:scale-95 cursor-pointer ${filter === 'PENDING' ? 'bg-primary text-white shadow-md' : 'bg-white border border-border-gold text-on-surface-variant hover:bg-surface-container-low'}`}
                >
                    PENDING
                </button>
            </div>

            {/* Billing List */}
            <div className="space-y-4">
                {filteredBills.map(bill => (
                    <div 
                        key={bill.id} 
                        onClick={() => onViewInvoice(bill)}
                        className="bg-white border border-border-gold rounded-xl p-4 shadow-sm hover:border-primary transition-all active:scale-[0.98] cursor-pointer group flex flex-col justify-between"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex flex-col">
                                <span className="font-body text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                                    INV-{bill.invoice_no}
                                </span>
                                <h3 className="font-headline text-lg font-bold text-on-surface group-hover:text-primary transition-colors">
                                    {bill.customer_name}
                                </h3>
                            </div>
                            <span className={`px-3 py-1 rounded-full font-body text-[10px] font-bold ${
                                bill.status === 'Paid' 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                    : 'bg-red-50 text-red-700 border border-red-100'
                            }`}>
                                {bill.status ? bill.status.toUpperCase() : 'PAID'}
                            </span>
                        </div>
                        
                        <div className="flex justify-between items-end border-t border-border-gold/20 pt-3">
                            <div className="flex items-center gap-1.5 text-on-surface-variant">
                                <span className="material-symbols-outlined text-sm">calendar_today</span>
                                <span className="font-body text-xs">{bill.date}</span>
                            </div>
                            <div className="text-right">
                                <span className="font-body text-[10px] text-on-surface-variant block uppercase tracking-wider">Total Amount</span>
                                <span className="font-headline text-md font-bold text-deep-gold">₹{parseFloat(bill.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredBills.length === 0 && (
                    <div className="bg-white border border-dashed border-border-gold/60 p-12 text-center rounded-xl">
                        <span className="material-symbols-outlined text-4xl text-border-gold mb-2">history</span>
                        <p className="font-body text-sm text-on-surface-variant italic">No bills match your current filters.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
