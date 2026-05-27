import React, { useState, useEffect } from 'react';
import * as API from '../api';

export default function DashboardView({ onNavigate }) {
    const [stats, setStats] = useState({
        todaySales: 0,
        pendingBills: 0,
        goldRate: 7200 // Rs. per gram (default for 24K)
    });

    useEffect(() => {
        loadDashboardStats();
    }, []);

    const loadDashboardStats = async () => {
        try {
            const bills = await API.getBills();
            const loans = await API.getLoans();
            
            // Calculate Today's Sales
            const todayStr = new Date().toLocaleDateString();
            const todayTotal = bills
                .filter(b => b.date === todayStr)
                .reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);
            
            // Calculate Pending items (bills with status 'Pending' + loans with status 'Pending')
            const pendingCount = bills.filter(b => b.status === 'Pending').length + 
                                 loans.filter(l => l.status === 'Pending').length;

            // Fetch settings to see if there is any custom gold rate, or default to 7200
            const settings = await API.getSettings();
            // Default rate: 7200 per gram (or 72000 per 10g)
            let currentGoldRate = 7200; 

            setStats({
                todaySales: todayTotal,
                pendingBills: pendingCount,
                goldRate: currentGoldRate
            });
        } catch (e) {
            console.error("Failed to load dashboard stats", e);
        }
    };

    return (
        <div className="fade-in space-y-6">
            {/* Welcome Header */}
            <section class="py-2">
                <h2 class="font-headline text-2xl text-on-surface font-bold">Good Morning, Admin</h2>
                <p class="font-body text-sm text-on-surface-variant">Here is your store overview for today.</p>
            </section>

            {/* Live Gold Rate Card */}
            <div class="relative overflow-hidden luxury-card-border bg-white p-6 rounded-xl shadow-sm">
                <div class="absolute top-0 right-0 p-4 opacity-10">
                    <span class="material-symbols-outlined text-7xl text-primary">trending_up</span>
                </div>
                <p class="font-body text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Live Market Rate</p>
                <div class="flex items-baseline gap-2">
                    <span class="font-headline text-3xl font-bold text-deep-gold">₹{stats.goldRate.toLocaleString('en-IN')}/g</span>
                    <span class="font-body text-xs text-success-emerald flex items-center font-bold">
                        <span class="material-symbols-outlined text-sm">arrow_upward</span> +0.4%
                    </span>
                </div>
                <p class="font-body text-xs text-on-surface-variant mt-1">24K Gold Price per gram • Noorpur Market</p>
            </div>

            {/* Quick Stats Bento Grid */}
            <div class="grid grid-cols-2 gap-4">
                {/* Today's Sales */}
                <div class="luxury-card-border bg-white p-4 rounded-xl shadow-sm flex flex-col justify-between">
                    <span class="material-symbols-outlined text-primary text-2xl mb-2">payments</span>
                    <div>
                        <p class="font-body text-xs font-bold text-on-surface-variant mb-1">Today's Sales</p>
                        <p class="font-headline text-xl font-bold text-on-surface">₹{stats.todaySales.toLocaleString('en-IN')}</p>
                    </div>
                </div>
                {/* Pending Bills/Loans */}
                <div class="luxury-card-border bg-white p-4 rounded-xl shadow-sm flex flex-col justify-between">
                    <span class="material-symbols-outlined text-red-600 text-2xl mb-2">pending_actions</span>
                    <div>
                        <p class="font-body text-xs font-bold text-on-surface-variant mb-1">Pending Actions</p>
                        <p class="font-headline text-xl font-bold text-on-surface">{stats.pendingBills.toString().padStart(2, '0')}</p>
                    </div>
                </div>
            </div>

            {/* Quick Operations */}
            <section class="space-y-3">
                <h3 class="font-body text-xs font-bold text-primary tracking-widest uppercase">Quick Operations</h3>
                <div class="flex flex-col gap-3">
                    <button 
                        onClick={() => onNavigate('billing')}
                        class="w-full flex items-center justify-between bg-primary p-5 rounded-xl text-white active:scale-[0.98] hover:bg-deep-gold transition-all shadow-md group text-left cursor-pointer"
                    >
                        <div class="flex items-center gap-4">
                            <span class="material-symbols-outlined text-2xl">add_shopping_cart</span>
                            <span class="font-body text-md font-semibold">Generate New Bill</span>
                        </div>
                        <span class="material-symbols-outlined opacity-50 group-hover:opacity-100 transition-opacity">chevron_right</span>
                    </button>
                    <button 
                        onClick={() => onNavigate('items')}
                        class="w-full flex items-center justify-between bg-white border border-border-gold p-5 rounded-xl text-primary active:scale-[0.98] hover:bg-surface-container-low transition-all shadow-sm group text-left cursor-pointer"
                    >
                        <div class="flex items-center gap-4">
                            <span class="material-symbols-outlined text-2xl">inventory_2</span>
                            <span class="font-body text-md font-semibold">Check Inventory</span>
                        </div>
                        <span class="material-symbols-outlined opacity-50 group-hover:opacity-100 transition-opacity">chevron_right</span>
                    </button>
                </div>
            </section>

            {/* Visual Anchor: Collection Preview */}
            <section class="space-y-3 pb-8">
                <div class="flex justify-between items-end">
                    <h3 class="font-body text-xs font-bold text-primary tracking-widest uppercase">Showroom Highlights</h3>
                    <span class="text-xs font-semibold text-deep-gold hover:underline cursor-pointer" onClick={() => onNavigate('items')}>View Catalog</span>
                </div>
                <div class="relative h-44 w-full rounded-xl overflow-hidden group shadow-md">
                    <img 
                        alt="Gold Necklace Display" 
                        class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBykM2hALDuQN9zB1yLthkSdcr72TQ3Xp75G9arGvFJZFN-wcqL1RzI6m4-WYaJzmHJJ3C6lOl090SvI73L8RdkDMMEbI4Y1TulngCxDwEfv0DnSJyAWCG6vyb7_obruUzSl4HTMhN_V4ehC_37BzhIh9V5zjP8VWVaxbI4APhWmQgSNoafYZPpnEhDwkviKopQ_W_s4lpfj_i-eOpaB0SDb0MFHcm-1ZdCx-HC81o6JaDjzGFMFo9r2RQI5eUf9pBCDtfb0gcI96ta"
                    />
                    <div class="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent flex flex-col justify-end p-4">
                        <p class="text-white font-headline text-lg font-bold">Autumn Heirloom Collection</p>
                        <p class="text-white/80 font-body text-xs">Exquisite 24K Handcrafted Filigree Work</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
