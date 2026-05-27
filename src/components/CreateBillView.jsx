import React, { useState, useEffect } from 'react';
import * as API from '../api';

export default function CreateBillView({ onBillGenerated, onNavigate }) {
    const [currentStep, setCurrentStep] = useState(1);
    const [invoiceNo, setInvoiceNo] = useState('');
    const [itemsMaster, setItemsMaster] = useState([]);

    // Step 1: Customer State
    const [customer, setCustomer] = useState({
        name: '',
        fatherName: '',
        address: '',
        contact: '',
        state: 'Uttar Pradesh',
        code: '09'
    });

    // Step 2: Items in current bill
    const [billItems, setBillItems] = useState([]);
    
    // Add Item Modal/Form State
    const [newItem, setNewItem] = useState({
        name: '',
        category: 'Gold',
        hsn: '7113',
        weight: '',
        rate: '',
        purity: '22',
        makingCharge: '',
        makingChargeType: 'perGram'
    });
    
    const [showAddItemForm, setShowAddItemForm] = useState(false);

    // Step 3: Tax and Discount State
    const [taxType, setTaxType] = useState('local'); // 'local' (CGST+SGST), 'interstate' (IGST), 'exempt' (None)
    const [discount, setDiscount] = useState('');
    const [paymentMode, setPaymentMode] = useState('CASH'); // CASH, CARD, UPI

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const invData = await API.getNextInvoice();
            setInvoiceNo(invData.invoice_no);

            const items = await API.getItems();
            setItemsMaster(items);
        } catch (e) {
            console.error("Failed to load bill config", e);
        }
    };

    // Auto fill properties when selecting product from list
    const handleItemNameChange = (name) => {
        const matchingItem = itemsMaster.find(i => i.name === name);
        if (matchingItem) {
            setNewItem(prev => ({
                ...prev,
                name: name,
                category: matchingItem.category,
                hsn: matchingItem.hsn_code || '7113',
                rate: matchingItem.default_rate || '',
                makingCharge: matchingItem.default_making_charge || ''
            }));
        } else {
            setNewItem(prev => ({ ...prev, name }));
        }
    };

    const handleAddItem = (e) => {
        e.preventDefault();
        if (!newItem.name || !newItem.weight || !newItem.rate) {
            alert("Please fill in Name, Weight, and Rate");
            return;
        }

        const w = parseFloat(newItem.weight) || 0;
        const r = parseFloat(newItem.rate) || 0;
        const mc = parseFloat(newItem.makingCharge) || 0;
        
        let itemAmount = 0;
        if (newItem.makingChargeType === 'perGram') {
            itemAmount = (w * (r / 10)) + (w * mc);
        } else {
            itemAmount = (w * (r / 10)) + mc;
        }

        const added = {
            id: Date.now(),
            itemName: newItem.name,
            category: newItem.category,
            hsn: newItem.hsn,
            weight: w,
            rate: r,
            purity: newItem.purity,
            makingCharge: mc,
            makingChargeType: newItem.makingChargeType,
            amount: itemAmount
        };

        setBillItems([...billItems, added]);
        
        // Reset form
        setNewItem({
            name: '',
            category: 'Gold',
            hsn: '7113',
            weight: '',
            rate: '',
            purity: '22',
            makingCharge: '',
            makingChargeType: 'perGram'
        });
        setShowAddItemForm(false);
    };

    const handleDeleteItem = (id) => {
        setBillItems(billItems.filter(item => item.id !== id));
    };

    // Calculate totals
    const calculateSubtotal = () => {
        return billItems.reduce((sum, item) => sum + item.amount, 0);
    };

    const subtotal = calculateSubtotal();
    
    let sgst = 0;
    let cgst = 0;
    let igst = 0;

    if (taxType === 'local') {
        sgst = subtotal * 0.015;
        cgst = subtotal * 0.015;
    } else if (taxType === 'interstate') {
        igst = subtotal * 0.03;
    }

    const discountVal = parseFloat(discount) || 0;
    const grandTotal = subtotal + sgst + cgst + igst - discountVal;

    const handleSaveBill = async () => {
        if (billItems.length === 0) {
            alert("Please add at least one item to generate a bill.");
            return;
        }

        try {
            const billData = {
                invoice_no: invoiceNo,
                customer_name: customer.name || 'Walk-in Customer',
                father_name: customer.fatherName,
                contact_number: customer.contact,
                date: new Date().toLocaleDateString(),
                total_amount: grandTotal,
                status: 'Paid', // Default status
                payment_mode: paymentMode,
                // Pass items along for invoice rendering
                items: billItems,
                customer_address: customer.address,
                customer_state: customer.state,
                customer_code: customer.code,
                subtotal: subtotal,
                sgst: sgst,
                cgst: cgst,
                igst: igst,
                discount: discountVal
            };

            await API.saveBillToDB(billData);
            
            // Pass bill details back to dashboard to display Invoice Component
            onBillGenerated(billData);
        } catch (e) {
            console.error(e);
            alert("Error saving invoice: " + e.message);
        }
    };

    return (
        <div className="fade-in space-y-6 pb-28">
            {/* Header info */}
            <div className="flex justify-between items-end border-b border-border-gold/30 pb-4">
                <div>
                    <p className="font-body text-xs font-bold text-on-surface-variant uppercase tracking-wider">Invoice No.</p>
                    <div className="flex items-center gap-1 mt-1">
                        <span className="text-red-600 font-bold font-headline">#</span>
                        <input 
                            type="text" 
                            value={invoiceNo}
                            onChange={e => setInvoiceNo(e.target.value)}
                            className="bg-transparent border-b border-border-gold/40 text-on-surface font-headline font-bold text-lg w-20 focus:border-primary p-0 m-0 focus:ring-0"
                        />
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-body text-xs font-bold text-on-surface-variant uppercase tracking-wider">Date</p>
                    <p className="font-headline font-bold text-md text-primary mt-1">{new Date().toLocaleDateString()}</p>
                </div>
            </div>

            {/* Stepper Progress Indicator */}
            <div className="flex items-center justify-between px-2 py-1 bg-white border border-border-gold rounded-xl">
                <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-headline transition-colors ${currentStep >= 1 ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant'}`}>1</div>
                    <span className="font-body text-xs font-bold text-primary">Customer</span>
                </div>
                <div className="flex-grow h-0.5 bg-border-gold/30 mx-2"></div>
                <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-headline transition-colors ${currentStep >= 2 ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant'}`}>2</div>
                    <span className="font-body text-xs font-bold text-primary">Items</span>
                </div>
                <div className="flex-grow h-0.5 bg-border-gold/30 mx-2"></div>
                <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-headline transition-colors ${currentStep >= 3 ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant'}`}>3</div>
                    <span className="font-body text-xs font-bold text-primary">Summary</span>
                </div>
            </div>

            {/* Step 1: Customer Details */}
            {currentStep === 1 && (
                <section className="bg-white p-6 rounded-xl border border-border-gold/60 shadow-sm space-y-4">
                    <h3 className="font-headline text-lg font-bold text-primary mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined">person</span> Customer Information
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block font-body text-xs font-bold text-on-surface-variant uppercase mb-1">Full Name</label>
                            <input 
                                type="text"
                                placeholder="Enter customer name"
                                value={customer.name}
                                onChange={e => setCustomer({...customer, name: e.target.value})}
                                className="w-full bg-soft-ivory/50 border border-border-gold px-4 py-3 rounded-lg focus:border-primary text-sm focus:ring-0 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block font-body text-xs font-bold text-on-surface-variant uppercase mb-1">Phone Number</label>
                            <div className="flex">
                                <span className="inline-flex items-center px-3 border border-r-0 border-border-gold bg-surface-container text-on-surface-variant text-sm font-semibold rounded-l-lg">+91</span>
                                <input 
                                    type="tel"
                                    placeholder="98765 43210"
                                    value={customer.contact}
                                    onChange={e => setCustomer({...customer, contact: e.target.value})}
                                    className="w-full bg-soft-ivory/50 border border-border-gold px-4 py-3 rounded-r-lg focus:border-primary text-sm focus:ring-0 focus:outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block font-body text-xs font-bold text-on-surface-variant uppercase mb-1">Father's / Husband's Name</label>
                            <input 
                                type="text"
                                placeholder="S/o or W/o"
                                value={customer.fatherName}
                                onChange={e => setCustomer({...customer, fatherName: e.target.value})}
                                className="w-full bg-soft-ivory/50 border border-border-gold px-4 py-3 rounded-lg focus:border-primary text-sm focus:ring-0 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block font-body text-xs font-bold text-on-surface-variant uppercase mb-1">Address</label>
                            <input 
                                type="text"
                                placeholder="Street, City"
                                value={customer.address}
                                onChange={e => setCustomer({...customer, address: e.target.value})}
                                className="w-full bg-soft-ivory/50 border border-border-gold px-4 py-3 rounded-lg focus:border-primary text-sm focus:ring-0 focus:outline-none"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block font-body text-xs font-bold text-on-surface-variant uppercase mb-1">State</label>
                                <input 
                                    type="text"
                                    value={customer.state}
                                    onChange={e => setCustomer({...customer, state: e.target.value})}
                                    className="w-full bg-soft-ivory/50 border border-border-gold px-4 py-3 rounded-lg focus:border-primary text-sm focus:ring-0 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block font-body text-xs font-bold text-on-surface-variant uppercase mb-1">State Code</label>
                                <input 
                                    type="text"
                                    value={customer.code}
                                    onChange={e => setCustomer({...customer, code: e.target.value})}
                                    className="w-full bg-soft-ivory/50 border border-border-gold px-4 py-3 rounded-lg focus:border-primary text-sm focus:ring-0 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Step 2: Item List & Add item Form */}
            {currentStep === 2 && (
                <div className="space-y-4">
                    {/* Add Item Overlay/Form */}
                    {showAddItemForm ? (
                        <form onSubmit={handleAddItem} className="bg-white p-6 rounded-xl border-2 border-primary shadow-lg space-y-4 fade-in">
                            <div className="flex justify-between items-center border-b border-border-gold/30 pb-2">
                                <h4 className="font-headline text-md font-bold text-primary">Specify Ornament</h4>
                                <button type="button" onClick={() => setShowAddItemForm(false)} className="text-red-500 font-bold p-1">Cancel</button>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block font-body text-xs font-bold text-on-surface-variant uppercase mb-1">Ornament Name</label>
                                    <input 
                                        type="text"
                                        list="bill-product-suggestions"
                                        placeholder="e.g. Gold Ring, Silver Chain"
                                        value={newItem.name}
                                        onChange={e => handleItemNameChange(e.target.value)}
                                        className="w-full bg-soft-ivory/50 border border-border-gold px-4 py-3 rounded-lg focus:border-primary text-sm focus:ring-0 focus:outline-none"
                                        required
                                    />
                                    <datalist id="bill-product-suggestions">
                                        {itemsMaster.map(item => (
                                            <option key={item.id} value={item.name} />
                                        ))}
                                    </datalist>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block font-body text-xs font-bold text-on-surface-variant uppercase mb-1">Category</label>
                                        <select 
                                            value={newItem.category}
                                            onChange={e => setNewItem({...newItem, category: e.target.value})}
                                            className="w-full bg-soft-ivory/50 border border-border-gold px-3 py-3 rounded-lg focus:border-primary text-sm focus:ring-0 focus:outline-none"
                                        >
                                            <option value="Gold">Gold</option>
                                            <option value="Silver">Silver</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block font-body text-xs font-bold text-on-surface-variant uppercase mb-1">Purity</label>
                                        <select 
                                            value={newItem.purity}
                                            onChange={e => setNewItem({...newItem, purity: e.target.value})}
                                            className="w-full bg-soft-ivory/50 border border-border-gold px-3 py-3 rounded-lg focus:border-primary text-sm focus:ring-0 focus:outline-none"
                                        >
                                            {newItem.category === 'Gold' ? (
                                                <>
                                                    <option value="22">22K (916)</option>
                                                    <option value="18">18K (750)</option>
                                                    <option value="24">24K (999)</option>
                                                </>
                                            ) : (
                                                <>
                                                    <option value="Chandi">Silver (Pure)</option>
                                                    <option value="925">92.5 Sterling</option>
                                                </>
                                            )}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block font-body text-xs font-bold text-on-surface-variant uppercase mb-1">Weight (Grams)</label>
                                        <input 
                                            type="number"
                                            step="0.001"
                                            placeholder="0.000"
                                            value={newItem.weight}
                                            onChange={e => setNewItem({...newItem, weight: e.target.value})}
                                            className="w-full bg-soft-ivory/50 border border-border-gold px-4 py-3 rounded-lg focus:border-primary text-sm focus:ring-0"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-body text-xs font-bold text-on-surface-variant uppercase mb-1">Rate (₹/10g)</label>
                                        <input 
                                            type="number"
                                            placeholder="e.g. 72000"
                                            value={newItem.rate}
                                            onChange={e => setNewItem({...newItem, rate: e.target.value})}
                                            className="w-full bg-soft-ivory/50 border border-border-gold px-4 py-3 rounded-lg focus:border-primary text-sm focus:ring-0"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block font-body text-xs font-bold text-on-surface-variant uppercase mb-1">Making Charge</label>
                                        <input 
                                            type="number"
                                            placeholder="0.00"
                                            value={newItem.makingCharge}
                                            onChange={e => setNewItem({...newItem, makingCharge: e.target.value})}
                                            className="w-full bg-soft-ivory/50 border border-border-gold px-4 py-3 rounded-lg focus:border-primary text-sm focus:ring-0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-body text-xs font-bold text-on-surface-variant uppercase mb-1">Charge Unit</label>
                                        <select 
                                            value={newItem.makingChargeType}
                                            onChange={e => setNewItem({...newItem, makingChargeType: e.target.value})}
                                            className="w-full bg-soft-ivory/50 border border-border-gold px-3 py-3 rounded-lg focus:border-primary text-sm focus:ring-0"
                                        >
                                            <option value="perGram">Per Gram</option>
                                            <option value="perPiece">Per Piece</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block font-body text-xs font-bold text-on-surface-variant uppercase mb-1">HSN Code</label>
                                    <input 
                                        type="text"
                                        value={newItem.hsn}
                                        onChange={e => setNewItem({...newItem, hsn: e.target.value})}
                                        className="w-full bg-soft-ivory/50 border border-border-gold px-4 py-3 rounded-lg focus:border-primary text-sm focus:ring-0"
                                    />
                                </div>
                            </div>

                            <button type="submit" className="w-full py-3 bg-primary hover:bg-deep-gold text-white font-bold rounded-lg mt-4 shadow-md transition-colors cursor-pointer">
                                Add to Bill
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="font-headline text-lg font-bold text-primary">Ornament Cart</h3>
                                <button 
                                    onClick={() => setShowAddItemForm(true)} 
                                    className="bg-primary text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow hover:bg-deep-gold transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-sm">add</span> Add Ornament
                                </button>
                            </div>

                            {/* Cart List */}
                            <div className="space-y-3">
                                {billItems.map(item => (
                                    <div key={item.id} className="bg-white p-4 rounded-xl border border-border-gold/50 shadow-sm flex justify-between items-center group">
                                        <div className="space-y-1">
                                            <h4 className="font-body text-sm font-bold text-on-surface">{item.itemName}</h4>
                                            <p className="font-body text-xs text-on-surface-variant">
                                                {item.category} • {item.purity}K • {item.weight}g @ ₹{item.rate}/10g
                                            </p>
                                            {item.makingCharge > 0 && (
                                                <p className="font-body text-[11px] text-on-surface-variant italic">
                                                    Making: ₹{item.makingCharge} {item.makingChargeType === 'perGram' ? '/g' : '/pc'}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-headline font-bold text-sm text-deep-gold">₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            <button 
                                                onClick={() => handleDeleteDeleteItem(item.id)}
                                                className="text-red-500 hover:text-red-700 p-1 flex items-center justify-center cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {billItems.length === 0 && (
                                    <div className="bg-white border border-dashed border-border-gold/60 p-12 text-center rounded-xl">
                                        <span className="material-symbols-outlined text-4xl text-border-gold mb-2">shopping_bag</span>
                                        <p className="font-body text-sm text-on-surface-variant italic">No ornaments added yet. Add items above to start billing.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Step 3: Tax, Discount, Summary & Generate */}
            {currentStep === 3 && (
                <section className="bg-white p-6 rounded-xl border border-border-gold/60 shadow-sm space-y-6">
                    <h3 className="font-headline text-lg font-bold text-primary flex items-center gap-2">
                        <span className="material-symbols-outlined">receipt</span> Summary &amp; Taxes
                    </h3>

                    {/* Tax Selector */}
                    <div>
                        <label className="block font-body text-xs font-bold text-on-surface-variant uppercase mb-2">Tax Mode</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button 
                                onClick={() => setTaxType('local')}
                                className={`py-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${taxType === 'local' ? 'bg-primary text-white border-primary' : 'bg-soft-ivory/50 border-border-gold/60 text-on-surface-variant'}`}
                            >
                                Local (CGST+SGST 3%)
                            </button>
                            <button 
                                onClick={() => setTaxType('interstate')}
                                className={`py-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${taxType === 'interstate' ? 'bg-primary text-white border-primary' : 'bg-soft-ivory/50 border-border-gold/60 text-on-surface-variant'}`}
                            >
                                Inter-state (IGST 3%)
                            </button>
                            <button 
                                onClick={() => setTaxType('exempt')}
                                className={`py-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${taxType === 'exempt' ? 'bg-primary text-white border-primary' : 'bg-soft-ivory/50 border-border-gold/60 text-on-surface-variant'}`}
                            >
                                Exempted (0%)
                            </button>
                        </div>
                    </div>

                    {/* Discount */}
                    <div>
                        <label className="block font-body text-xs font-bold text-on-surface-variant uppercase mb-1">Flat Discount (₹)</label>
                        <input 
                            type="number"
                            placeholder="Enter discount amount"
                            value={discount}
                            onChange={e => setDiscount(e.target.value)}
                            className="w-full bg-soft-ivory/50 border border-border-gold px-4 py-3 rounded-lg focus:border-primary text-sm focus:ring-0 focus:outline-none"
                        />
                    </div>

                    {/* Payment Mode */}
                    <div>
                        <label className="block font-body text-xs font-bold text-on-surface-variant uppercase mb-2">Payment Mode</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button 
                                onClick={() => setPaymentMode('CASH')}
                                className={`py-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${paymentMode === 'CASH' ? 'bg-primary text-white border-primary' : 'bg-soft-ivory/50 border-border-gold/60 text-on-surface-variant'}`}
                            >
                                CASH
                            </button>
                            <button 
                                onClick={() => setPaymentMode('UPI')}
                                className={`py-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${paymentMode === 'UPI' ? 'bg-primary text-white border-primary' : 'bg-soft-ivory/50 border-border-gold/60 text-on-surface-variant'}`}
                            >
                                UPI (Online)
                            </button>
                            <button 
                                onClick={() => setPaymentMode('CARD')}
                                className={`py-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${paymentMode === 'CARD' ? 'bg-primary text-white border-primary' : 'bg-soft-ivory/50 border-border-gold/60 text-on-surface-variant'}`}
                            >
                                CARD
                            </button>
                        </div>
                    </div>

                    {/* Breakdowns */}
                    <div className="bg-surface-container/60 p-4 rounded-xl space-y-2 border border-border-gold/20">
                        <div className="flex justify-between text-sm">
                            <span className="text-on-surface-variant">Items Subtotal</span>
                            <span className="font-headline text-on-surface font-semibold">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        {taxType === 'local' && (
                            <>
                                <div className="flex justify-between text-xs text-on-surface-variant">
                                    <span>CGST (1.5%)</span>
                                    <span>₹{cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-xs text-on-surface-variant">
                                    <span>SGST (1.5%)</span>
                                    <span>₹{sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </>
                        )}
                        {taxType === 'interstate' && (
                            <div className="flex justify-between text-xs text-on-surface-variant">
                                <span>IGST (3.0%)</span>
                                <span>₹{igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                        )}
                        {discountVal > 0 && (
                            <div className="flex justify-between text-sm text-red-600 font-semibold">
                                <span>Discount</span>
                                <span>- ₹{discountVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                        )}
                        <div className="flex justify-between border-t border-border-gold/30 pt-3 mt-3">
                            <span className="font-body text-xs font-bold text-primary uppercase">Grand Total</span>
                            <span className="font-headline text-lg font-bold text-primary">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </section>
            )}

            {/* Wizard Sticky Bottom Actions */}
            <div className="fixed bottom-20 left-0 w-full bg-white border-t border-border-gold px-6 py-4 z-40 shadow-[0_-4px_25px_rgba(0,0,0,0.06)] flex justify-between items-center">
                <div>
                    <p className="font-body text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Estimated Total</p>
                    <p className="font-headline text-xl font-bold text-deep-gold">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="flex gap-2">
                    {currentStep > 1 && (
                        <button 
                            onClick={() => setCurrentStep(currentStep - 1)}
                            className="px-5 py-3 rounded-lg border border-primary text-primary text-xs font-bold hover:bg-soft-ivory transition-all cursor-pointer"
                        >
                            BACK
                        </button>
                    )}
                    {currentStep < 3 ? (
                        <button 
                            onClick={() => {
                                if (currentStep === 1 && !customer.name) {
                                    if(!confirm("Proceed with empty customer name? (Will default to Walk-in Customer)")) {
                                        return;
                                    }
                                }
                                if (currentStep === 2 && billItems.length === 0) {
                                    alert("Please add at least one ornament to proceed.");
                                    return;
                                }
                                setCurrentStep(currentStep + 1);
                            }}
                            className="px-8 py-3 rounded-lg bg-primary hover:bg-deep-gold text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                        >
                            NEXT STEP
                        </button>
                    ) : (
                        <button 
                            onClick={handleSaveBill}
                            className="px-8 py-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                        >
                            GENERATE BILL
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
