import React, { useState } from 'react';
import * as API from '../api';

export default function ItemManager({ items, onAddItem, onDeleteItem }) {
    const [newItem, setNewItem] = useState({
        name: '',
        category: 'Gold',
        hsn_code: '7113',
        default_rate: '',
        default_weight: '',
        default_making_charge: ''
    });

    const [showAddForm, setShowAddForm] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const parsedItem = {
                ...newItem,
                default_rate: parseFloat(newItem.default_rate) || 0,
                default_weight: parseFloat(newItem.default_weight) || 0,
                default_making_charge: parseFloat(newItem.default_making_charge) || 0
            };
            const added = await API.addItem(parsedItem);
            onAddItem(added);
            setNewItem({
                name: '',
                category: 'Gold',
                hsn_code: '7113',
                default_rate: '',
                default_weight: '',
                default_making_charge: ''
            });
            setShowAddForm(false);
            alert("Product added to master list!");
        } catch (error) {
            console.error("Failed to add item:", error);
            alert("Error adding item");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        try {
            await API.deleteItem(id);
            onDeleteItem(id);
        } catch (error) {
            console.error("Failed to delete item:", error);
        }
    };

    return (
        <div className="fade-in space-y-6 pb-20">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-border-gold/30 pb-3">
                <div>
                    <h2 className="font-headline text-2xl font-bold text-primary mb-0.5">Product Catalog</h2>
                    <p className="font-body text-xs text-on-surface-variant">Master list of jewelry ornaments.</p>
                </div>
                <button 
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="bg-primary text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow hover:bg-deep-gold transition-colors flex items-center gap-1 cursor-pointer"
                >
                    <span className="material-symbols-outlined text-sm">{showAddForm ? 'close' : 'add'}</span> 
                    {showAddForm ? 'Cancel' : 'New Product'}
                </button>
            </div>

            {/* Add New Product Form */}
            {showAddForm && (
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-border-gold/60 shadow-md space-y-4 fade-in">
                    <h4 className="font-headline text-md font-bold text-primary pb-2 border-b border-border-gold/20">Add Master Product</h4>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block font-body text-xs font-bold text-on-surface-variant uppercase mb-1">Product Name</label>
                            <input 
                                required 
                                type="text"
                                placeholder="e.g. Gold Ring 22K"
                                value={newItem.name} 
                                onChange={e => setNewItem({ ...newItem, name: e.target.value })} 
                                className="w-full bg-soft-ivory/50 border border-border-gold px-4 py-3 rounded-lg focus:border-primary text-sm focus:ring-0 focus:outline-none"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block font-body text-xs font-bold text-on-surface-variant uppercase mb-1">Category</label>
                                <select 
                                    value={newItem.category} 
                                    onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                                    className="w-full bg-soft-ivory/50 border border-border-gold px-3 py-3 rounded-lg focus:border-primary text-sm focus:ring-0"
                                >
                                    <option value="Gold">Gold</option>
                                    <option value="Silver">Silver</option>
                                </select>
                            </div>
                            <div>
                                <label className="block font-body text-xs font-bold text-on-surface-variant uppercase mb-1">HSN Code</label>
                                <input 
                                    type="text"
                                    value={newItem.hsn_code} 
                                    onChange={e => setNewItem({ ...newItem, hsn_code: e.target.value })} 
                                    className="w-full bg-soft-ivory/50 border border-border-gold px-4 py-3 rounded-lg focus:border-primary text-sm focus:ring-0"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block font-body text-xs font-bold text-on-surface-variant uppercase mb-1">Default Rate (₹/10g)</label>
                                <input 
                                    type="number" 
                                    placeholder="e.g. 72000"
                                    value={newItem.default_rate} 
                                    onChange={e => setNewItem({ ...newItem, default_rate: e.target.value })} 
                                    className="w-full bg-soft-ivory/50 border border-border-gold px-4 py-3 rounded-lg focus:border-primary text-sm focus:ring-0"
                                />
                            </div>
                            <div>
                                <label className="block font-body text-xs font-bold text-on-surface-variant uppercase mb-1">Est. Making Charge (₹)</label>
                                <input 
                                    type="number" 
                                    placeholder="e.g. 500"
                                    value={newItem.default_making_charge} 
                                    onChange={e => setNewItem({ ...newItem, default_making_charge: e.target.value })} 
                                    className="w-full bg-soft-ivory/50 border border-border-gold px-4 py-3 rounded-lg focus:border-primary text-sm focus:ring-0"
                                />
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="w-full py-3 bg-primary hover:bg-deep-gold text-white font-bold rounded-lg shadow mt-4 transition-colors cursor-pointer">
                        Add to Catalog
                    </button>
                </form>
            )}

            {/* Total Items Tracker */}
            <div className="flex justify-between items-center text-xs font-body font-bold text-on-surface-variant">
                <span>CATALOG LIST</span>
                <span>TOTAL: {items.length} PRODUCTS</span>
            </div>

            {/* Catalog Items List (Mobile optimized card system) */}
            <div className="space-y-3">
                {items.map(item => (
                    <div key={item.id} className="bg-white p-4 rounded-xl border border-border-gold/50 shadow-sm flex justify-between items-center hover:border-primary transition-all">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h4 className="font-body text-sm font-bold text-on-surface">{item.name}</h4>
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                                    item.category === 'Gold' 
                                        ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                                        : 'bg-slate-50 text-slate-700 border border-slate-100'
                                }`}>
                                    {item.category}
                                </span>
                            </div>
                            <p className="font-body text-xs text-on-surface-variant">
                                HSN: <span className="font-semibold">{item.hsn_code}</span>
                                {item.default_rate > 0 && ` • Rate: ₹${item.default_rate.toLocaleString('en-IN')}/10g`}
                            </p>
                            {item.default_making_charge > 0 && (
                                <p className="font-body text-[10px] text-on-surface-variant italic">
                                    Making Charge: ₹{item.default_making_charge}
                                </p>
                            )}
                        </div>
                        <button 
                            onClick={() => handleDelete(item.id)}
                            className="text-red-500 hover:text-red-700 p-2 flex items-center justify-center cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                    </div>
                ))}

                {items.length === 0 && (
                    <div className="bg-white border border-dashed border-border-gold/60 p-12 text-center rounded-xl">
                        <span className="material-symbols-outlined text-4xl text-border-gold mb-2">diamond</span>
                        <p className="font-body text-sm text-on-surface-variant italic">No products in catalog. Add your first above.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
