import React, { useState, useEffect } from 'react';
import DashboardView from './DashboardView';
import CreateBillView from './CreateBillView';
import HistoryView from './HistoryView';
import Invoice from './Invoice';
import ItemManager from './ItemManager';
import LoanManager from './LoanManager';
import * as API from '../api';

export default function Dashboard() {
    const [page, setPage] = useState('home'); // 'home', 'billing', 'items', 'history', 'loans', 'settings', 'invoice-preview'
    const [selectedBill, setSelectedBill] = useState(null);
    const [items, setItems] = useState([]);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    
    // Settings state
    const [settings, setSettings] = useState({ next_invoice_no: '1001', bill_count_offset: 0, total_db: 0, bill_count: 0 });
    const [customCountVal, setCustomCountVal] = useState('');
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

    useEffect(() => {
        loadItems();
        loadSettings();
    }, []);

    const showNotify = (msg, type = 'success') => {
        setNotification({ show: true, message: msg, type: type });
        setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 4000);
    };

    const loadItems = async () => {
        try {
            const data = await API.getItems();
            setItems(data);
        } catch (e) {
            console.error("Failed to load items", e);
        }
    };

    const loadSettings = async () => {
        try {
            const data = await API.getSettings();
            setSettings(data);
            setCustomCountVal(data.bill_count.toString());
        } catch (e) {
            console.error("Failed to load settings", e);
        }
    };

    const handleSaveSettings = async () => {
        try {
            const desiredCount = parseInt(customCountVal) || 0;
            const calculatedOffset = Math.max(0, desiredCount - settings.total_db);
            
            await API.saveSettings({
                next_invoice_no: settings.next_invoice_no,
                bill_count_offset: calculatedOffset
            });
            
            showNotify("Settings saved successfully!");
            await loadSettings();
            setPage('home');
        } catch (e) {
            showNotify("Failed to save settings: " + e.message, "error");
        }
    };

    const handleBillGenerated = (billData) => {
        setSelectedBill(billData);
        setPage('invoice-preview');
        showNotify("Invoice generated successfully!");
    };

    const handleViewInvoiceFromHistory = (billData) => {
        setSelectedBill(billData);
        setPage('invoice-preview');
    };

    const toggleDrawer = () => {
        setIsDrawerOpen(!isDrawerOpen);
    };

    return (
        <div className="min-h-screen bg-soft-ivory flex flex-col font-body antialiased relative">
            {/* Top App Bar - Hidden during printing */}
            <header className="no-print flex justify-between items-center px-4 h-16 w-full fixed top-0 z-40 bg-soft-ivory border-b border-border-gold shadow-sm">
                <button 
                    onClick={toggleDrawer}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors text-primary active:opacity-80 cursor-pointer"
                >
                    <span className="material-symbols-outlined">menu</span>
                </button>
                <h1 className="font-headline text-lg font-bold text-deep-gold tracking-widest uppercase">ALANKAR JEWELLERS</h1>
                <button 
                    onClick={() => setPage('settings')}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors text-primary active:opacity-80 cursor-pointer"
                >
                    <span className="material-symbols-outlined">settings</span>
                </button>
            </header>

            {/* Sidebar Navigation Drawer backdrop */}
            {isDrawerOpen && (
                <div 
                    onClick={toggleDrawer}
                    className="no-print fixed inset-0 bg-black/40 z-45 transition-opacity duration-300 ease-out"
                />
            )}

            {/* Sidebar Navigation Drawer content */}
            <aside 
                className={`no-print h-full w-72 fixed left-0 top-0 z-50 transition-transform duration-300 ease-in-out bg-soft-ivory shadow-xl flex flex-col py-6 border-r border-border-gold ${
                    isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="px-6 mb-6 flex flex-col items-start border-b border-border-gold/30 pb-6">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-border-gold mb-3">
                        <img 
                            alt="Store Manager" 
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQlCB-kmxUBZx7O88jYd4sqSjLDdatqrA1pIHuixK4h-Scz2X2ohmS6twkZC-mqFos8aFuVz_OMgqRSi_SrVoXHuSyDCmeACjHe5PltrsUCZAX58UdVibNz9x2lHnTUzRr17a6BBeHwp-lnT2bGqMcaIcJ_7e2RSx1hP-b3LuXV4QtAGSJj7bzrktFnetB5DDQAzs8Vx2c_90_kbNc6Tg3rEXTu8lH0G4mbydxlB9pzxbBAjjGPI-1KP9Xk217CSS5F29KwZdJfmEy"
                        />
                    </div>
                    <h4 className="font-headline text-md font-bold text-on-surface">Alankar Admin</h4>
                    <p className="font-body text-xs text-on-surface-variant">Authorized Personnel Only</p>
                </div>
                
                <nav className="flex-grow space-y-1">
                    <button 
                        onClick={() => { setPage('items'); setIsDrawerOpen(false); }}
                        className={`w-full flex items-center gap-4 px-6 py-4 text-left transition-colors cursor-pointer ${page === 'items' ? 'bg-primary/10 text-primary font-bold border-r-4 border-primary' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
                    >
                        <span className="material-symbols-outlined">inventory_2</span>
                        <span className="font-body text-sm font-semibold">Inventory Manager</span>
                    </button>
                    <button 
                        onClick={() => { setPage('loans'); setIsDrawerOpen(false); }}
                        className={`w-full flex items-center gap-4 px-6 py-4 text-left transition-colors cursor-pointer ${page === 'loans' ? 'bg-primary/10 text-primary font-bold border-r-4 border-primary' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
                    >
                        <span className="material-symbols-outlined">account_balance</span>
                        <span className="font-body text-sm font-semibold">Rent &amp; Loans Ledger</span>
                    </button>
                    <button 
                        onClick={() => { setPage('settings'); setIsDrawerOpen(false); }}
                        className={`w-full flex items-center gap-4 px-6 py-4 text-left transition-colors cursor-pointer ${page === 'settings' ? 'bg-primary/10 text-primary font-bold border-r-4 border-primary' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
                    >
                        <span className="material-symbols-outlined">settings</span>
                        <span className="font-body text-sm font-semibold">Billing Settings</span>
                    </button>
                </nav>
                
                <div className="px-6 mt-auto border-t border-border-gold/30 pt-4 flex flex-col gap-1">
                    <p className="font-body text-[10px] text-on-surface-variant font-bold">ALANKAR BILLING MOBILE</p>
                    <p className="font-body text-[9px] text-on-surface-variant/60">v3.0.0 • STANDALONE OFFLINE</p>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className={`flex-grow px-4 pt-20 ${page === 'invoice-preview' ? 'pb-24 print:pt-0' : 'pb-24 print:hidden'}`}>
                
                {/* 1. Home Dashboard */}
                {page === 'home' && (
                    <DashboardView 
                        onNavigate={(destPage) => {
                            setPage(destPage);
                        }} 
                    />
                )}

                {/* 2. New Bill Form */}
                {page === 'billing' && (
                    <CreateBillView 
                        onBillGenerated={handleBillGenerated}
                        onNavigate={(destPage) => setPage(destPage)}
                    />
                )}

                {/* 3. Billing History */}
                {page === 'history' && (
                    <HistoryView 
                        onViewInvoice={handleViewInvoiceFromHistory}
                    />
                )}

                {/* 4. Invoice Detail/Print Preview */}
                {page === 'invoice-preview' && selectedBill && (
                    <Invoice 
                        billData={selectedBill} 
                        onClose={() => setPage('history')} 
                    />
                )}

                {/* 5. Inventory Manager */}
                {page === 'items' && (
                    <ItemManager 
                        items={items} 
                        onAddItem={loadItems} 
                        onDeleteItem={loadItems} 
                    />
                )}

                {/* 6. Rent & Loans */}
                {page === 'loans' && (
                    <LoanManager />
                )}

                {/* 7. Settings Page */}
                {page === 'settings' && (
                    <div className="fade-in max-w-md mx-auto space-y-6">
                        <div className="border-b border-border-gold/30 pb-3">
                            <h2 className="font-headline text-2xl font-bold text-primary mb-0.5">Billing Settings</h2>
                            <p className="font-body text-xs text-on-surface-variant">Configure receipt number counters and database settings.</p>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-border-gold/60 shadow-sm space-y-5">
                            <div>
                                <label className="block font-body text-xs font-bold text-on-surface-variant uppercase mb-1">Next Invoice Number</label>
                                <p className="text-[11px] text-on-surface-variant mb-2">
                                    Set the sequence number for the next generated invoice.
                                </p>
                                <input 
                                    type="text" 
                                    value={settings.next_invoice_no} 
                                    onChange={e => setSettings({ ...settings, next_invoice_no: e.target.value })} 
                                    className="w-full bg-soft-ivory/50 border border-border-gold px-4 py-3 rounded-lg focus:border-primary text-sm focus:ring-0 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block font-body text-xs font-bold text-on-surface-variant uppercase mb-1">Desired Bill Count (Total)</label>
                                <p className="text-[11px] text-on-surface-variant mb-2">
                                    Total number of bills to display. We automatically calculate the offset from database count (currently <strong>{settings.total_db}</strong> bills).
                                </p>
                                <input 
                                    type="number" 
                                    value={customCountVal} 
                                    onChange={e => setCustomCountVal(e.target.value)} 
                                    className="w-full bg-soft-ivory/50 border border-border-gold px-4 py-3 rounded-lg focus:border-primary text-sm focus:ring-0 focus:outline-none"
                                />
                            </div>

                            <div className="bg-surface-container/40 p-4 rounded-xl space-y-1.5 border border-border-gold/20 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-on-surface-variant">Bills in Local DB:</span>
                                    <strong className="text-on-surface">{settings.total_db}</strong>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-on-surface-variant">Calculated Offset:</span>
                                    <strong className="text-on-surface">{settings.bill_count_offset}</strong>
                                </div>
                                <div className="flex justify-between border-t border-border-gold/20 pt-2 font-bold text-primary text-sm mt-2">
                                    <span>Total Display Count:</span>
                                    <span>{settings.bill_count}</span>
                                </div>
                            </div>

                            <button 
                                onClick={handleSaveSettings}
                                className="w-full py-3 bg-primary hover:bg-deep-gold text-white font-bold rounded-lg shadow transition-colors cursor-pointer"
                            >
                                Save Settings
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* Bottom Navigation Bar - Hidden during printing */}
            <nav className="no-print fixed bottom-0 left-0 w-full z-40 flex justify-around items-center h-20 bg-soft-ivory px-2 pb-2 border-t border-border-gold shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
                <button 
                    onClick={() => setPage('home')}
                    className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-xl transition-all cursor-pointer ${
                        page === 'home' ? 'bg-primary text-white scale-[1.03] shadow-sm' : 'text-on-surface-variant hover:text-primary'
                    }`}
                >
                    <span className="material-symbols-outlined text-lg">dashboard</span>
                    <span className="font-body text-[9px] font-bold mt-0.5">Home</span>
                </button>
                
                <button 
                    onClick={() => setPage('billing')}
                    className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-xl transition-all cursor-pointer ${
                        page === 'billing' ? 'bg-primary text-white scale-[1.03] shadow-sm' : 'text-on-surface-variant hover:text-primary'
                    }`}
                >
                    <span className="material-symbols-outlined text-lg">receipt_long</span>
                    <span className="font-body text-[9px] font-bold mt-0.5">New Bill</span>
                </button>

                <button 
                    onClick={() => setPage('items')}
                    className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-xl transition-all cursor-pointer ${
                        page === 'items' ? 'bg-primary text-white scale-[1.03] shadow-sm' : 'text-on-surface-variant hover:text-primary'
                    }`}
                >
                    <span className="material-symbols-outlined text-lg">diamond</span>
                    <span className="font-body text-[9px] font-bold mt-0.5">Catalog</span>
                </button>

                <button 
                    onClick={() => setPage('history')}
                    className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-xl transition-all cursor-pointer ${
                        page === 'history' || page === 'invoice-preview' ? 'bg-primary text-white scale-[1.03] shadow-sm' : 'text-on-surface-variant hover:text-primary'
                    }`}
                >
                    <span className="material-symbols-outlined text-lg">history</span>
                    <span className="font-body text-[9px] font-bold mt-0.5">History</span>
                </button>

                <button 
                    onClick={() => setPage('loans')}
                    className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-xl transition-all cursor-pointer ${
                        page === 'loans' ? 'bg-primary text-white scale-[1.03] shadow-sm' : 'text-on-surface-variant hover:text-primary'
                    }`}
                >
                    <span className="material-symbols-outlined text-lg">account_balance</span>
                    <span className="font-body text-[9px] font-bold mt-0.5">Loans</span>
                </button>
            </nav>

            {/* Notification UI */}
            {notification.show && (
                <div className="fixed bottom-24 right-4 p-4 bg-primary text-white rounded-xl shadow-lg z-50 flex items-center gap-2 font-semibold text-xs border border-border-gold animate-bounce">
                    <span>{notification.type === 'error' ? '❌' : '✅'}</span>
                    {notification.message}
                </div>
            )}
        </div>
    );
}
