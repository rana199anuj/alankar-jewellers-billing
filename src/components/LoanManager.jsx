import React, { useState, useEffect } from 'react';
import * as API from '../api';

export default function LoanManager() {
    const [loans, setLoans] = useState([]);
    const [formData, setFormData] = useState({ 
        person_name: '', 
        amount: '', 
        type: 'Given', 
        remarks: '', 
        date: new Date().toISOString().split('T')[0] 
    });
    const [search, setSearch] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);

    useEffect(() => {
        loadLoans();
    }, []);

    const loadLoans = async () => {
        try {
            const data = await API.getLoans();
            setLoans(data);
        } catch (e) {
            console.error("Failed to load loans:", e);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const parsedData = {
                ...formData,
                amount: parseFloat(formData.amount) || 0
            };
            await API.addLoan(parsedData);
            setFormData({ 
                person_name: '', 
                amount: '', 
                type: 'Given', 
                remarks: '', 
                date: new Date().toISOString().split('T')[0] 
            });
            setShowAddForm(false);
            loadLoans();
            alert("Ledger entry added successfully!");
        } catch (e) {
            alert("Error: " + e.message);
        }
    };

    const handleToggleStatus = async (loan) => {
        try {
            const newStatus = loan.status === 'Pending' ? 'Settled' : 'Pending';
            await API.updateLoanStatus(loan.id, newStatus);
            loadLoans();
        } catch (e) {
            alert(e.message);
        }
    };

    const handleDelete = async (id) => {
        if (confirm("Are you sure you want to delete this entry?")) {
            try {
                await API.deleteLoan(id);
                loadLoans();
            } catch (e) {
                alert(e.message);
            }
        }
    };

    const filteredLoans = loans.filter(l =>
        l.person_name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="fade-in space-y-6 pb-20">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-border-gold/30 pb-3">
                <div>
                    <h2 className="font-headline text-2xl font-bold text-primary mb-0.5">Loans Ledger</h2>
                    <p className="font-body text-xs text-on-surface-variant">Credits and debts tracker.</p>
                </div>
                <button 
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="bg-primary text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow hover:bg-deep-gold transition-colors flex items-center gap-1 cursor-pointer"
                >
                    <span className="material-symbols-outlined text-sm">{showAddForm ? 'close' : 'add'}</span> 
                    {showAddForm ? 'Cancel' : 'New Entry'}
                </button>
            </div>

            {/* Add Entry Form */}
            {showAddForm && (
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-border-gold/60 shadow-md space-y-4 fade-in">
                    <h4 className="font-headline text-md font-bold text-primary pb-2 border-b border-border-gold/20">Add Ledger Entry</h4>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block font-body text-xs font-bold text-on-surface-variant uppercase mb-1">Person Name</label>
                            <input 
                                required 
                                type="text"
                                placeholder="Enter full name"
                                value={formData.person_name} 
                                onChange={e => setFormData({ ...formData, person_name: e.target.value })} 
                                className="w-full bg-soft-ivory/50 border border-border-gold px-4 py-3 rounded-lg focus:border-primary text-sm focus:ring-0 focus:outline-none"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block font-body text-xs font-bold text-on-surface-variant uppercase mb-1">Amount (₹)</label>
                                <input 
                                    required 
                                    type="number" 
                                    placeholder="0.00"
                                    value={formData.amount} 
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })} 
                                    className="w-full bg-soft-ivory/50 border border-border-gold px-4 py-3 rounded-lg focus:border-primary text-sm focus:ring-0 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block font-body text-xs font-bold text-on-surface-variant uppercase mb-1">Type</label>
                                <select 
                                    value={formData.type} 
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full bg-soft-ivory/50 border border-border-gold px-3 py-3 rounded-lg focus:border-primary text-sm focus:ring-0"
                                >
                                    <option value="Given">Given (उधार दिया)</option>
                                    <option value="Taken">Taken (उधार लिया)</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block font-body text-xs font-bold text-on-surface-variant uppercase mb-1">Date</label>
                            <input 
                                type="date" 
                                value={formData.date} 
                                onChange={e => setFormData({ ...formData, date: e.target.value })} 
                                className="w-full bg-soft-ivory/50 border border-border-gold px-4 py-3 rounded-lg focus:border-primary text-sm focus:ring-0"
                            />
                        </div>
                        <div>
                            <label className="block font-body text-xs font-bold text-on-surface-variant uppercase mb-1">Remarks (Optional)</label>
                            <input 
                                type="text"
                                placeholder="e.g. Gold security, cash back"
                                value={formData.remarks} 
                                onChange={e => setFormData({ ...formData, remarks: e.target.value })} 
                                className="w-full bg-soft-ivory/50 border border-border-gold px-4 py-3 rounded-lg focus:border-primary text-sm focus:ring-0 focus:outline-none"
                            />
                        </div>
                    </div>

                    <button type="submit" className="w-full py-3 bg-primary hover:bg-deep-gold text-white font-bold rounded-lg shadow mt-4 transition-colors cursor-pointer">
                        Save Ledger Entry
                    </button>
                </form>
            )}

            {/* Search bar */}
            <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-60">search</span>
                <input 
                    type="text"
                    placeholder="Search ledger by name..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-white border border-border-gold rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-body text-sm text-on-surface shadow-sm"
                />
            </div>

            {/* List */}
            <div className="space-y-3">
                {filteredLoans.map(loan => (
                    <div 
                        key={loan.id} 
                        style={{ opacity: loan.status === 'Settled' ? 0.6 : 1 }}
                        className={`bg-white p-4 rounded-xl border shadow-sm flex justify-between items-center transition-opacity hover:border-border-gold ${
                            loan.status === 'Settled' ? 'border-border-gold/30' : 'border-border-gold/60'
                        }`}
                    >
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h4 className="font-body text-sm font-bold text-on-surface">{loan.person_name}</h4>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                    loan.type === 'Given' 
                                        ? 'bg-red-50 text-red-700 border border-red-100' 
                                        : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                }`}>
                                    {loan.type === 'Given' ? 'GIVEN' : 'TAKEN'}
                                </span>
                            </div>
                            <p className="font-body text-xs text-on-surface-variant">
                                Date: {loan.date}
                            </p>
                            {loan.remarks && (
                                <p className="font-body text-[11px] text-on-surface-variant italic">
                                    Notes: {loan.remarks}
                                </p>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className={`font-headline text-sm font-bold ${
                                    loan.type === 'Given' ? 'text-red-600' : 'text-emerald-700'
                                }`}>
                                    {loan.type === 'Given' ? '-' : '+'} ₹{parseFloat(loan.amount).toLocaleString('en-IN')}
                                </p>
                                <button
                                    onClick={() => handleToggleStatus(loan)}
                                    className={`px-2.5 py-0.5 mt-1 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                                        loan.status === 'Pending' 
                                            ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    }`}
                                >
                                    {loan.status ? loan.status.toUpperCase() : 'PENDING'}
                                </button>
                            </div>
                            <button 
                                onClick={() => handleDelete(loan.id)}
                                className="text-on-surface-variant hover:text-red-500 p-2 flex items-center justify-center cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                        </div>
                    </div>
                ))}

                {filteredLoans.length === 0 && (
                    <div className="bg-white border border-dashed border-border-gold/60 p-12 text-center rounded-xl">
                        <span className="material-symbols-outlined text-4xl text-border-gold mb-2">account_balance</span>
                        <p className="font-body text-sm text-on-surface-variant italic">No ledger entries found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
