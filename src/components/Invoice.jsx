import React from 'react';
import * as API from '../api';

export default function Invoice({ billData, onClose }) {
    const {
        invoice_no,
        customer_name,
        father_name,
        contact_number,
        date,
        total_amount,
        items = [],
        customer_address = '',
        customer_state = 'Uttar Pradesh',
        customer_code = '09',
        subtotal = 0,
        sgst = 0,
        cgst = 0,
        igst = 0,
        discount = 0,
        payment_mode = 'CASH'
    } = billData;

    // Helper to format currency
    const formatCurrency = (amount) => {
        return (parseFloat(amount) || 0).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    // Number to words helper for Indian Rupees
    const numberToWords = (num) => {
        const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
        const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        function inWords(n) {
            if (n < 20) return a[n];
            if (n < 100) return b[Math.floor(n / 10)] + ' ' + a[n % 10];
            if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + inWords(n % 100);
            if (n < 100000) return inWords(Math.floor(n / 1000)) + 'Thousand ' + inWords(n % 1000);
            if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'Lakh ' + inWords(n % 100000);
            return 'Large Amount';
        }

        const main = Math.floor(num);
        const paisa = Math.round((num - main) * 100);
        let res = inWords(main) + 'Rupees ';
        if (paisa > 0) res += 'and ' + inWords(paisa) + 'Paise ';
        return res + 'Only';
    };

    const handlePrint = () => {
        window.print();
    };

    const handleShare = async () => {
        const shareText = `*Alankar Jewellers Tax Invoice*\n*Invoice No:* #${invoice_no}\n*Date:* ${date}\n*Customer:* ${customer_name}\n*Total Amount:* ₹${formatCurrency(total_amount)}\n*Payment:* ${payment_mode}\nThank you for shopping with us!`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Invoice #${invoice_no}`,
                    text: shareText
                });
            } catch (e) {
                console.error("Native share failed", e);
            }
        } else {
            // Fallback to WhatsApp URL
            const cleanPhone = contact_number ? contact_number.replace(/\D/g, '') : '';
            const url = `https://api.whatsapp.com/send?phone=${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}&text=${encodeURIComponent(shareText)}`;
            window.open(url, '_blank');
        }
    };

    const handleDownloadHTML = async () => {
        const paperElement = document.getElementById('printable-bill-paper');
        if (!paperElement) return;

        const htmlContent = `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Invoice #${invoice_no}</title>
                    <link href="https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:wght@400;600;700&family=Hanken+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
                    <style>
                        body { margin: 0; padding: 10px; font-family: 'Hanken Grotesk', sans-serif; background-color: #ffffff; color: #000000; }
                        .bill-paper { max-width: 750px; margin: 0 auto; border: 1px solid #D4C4A8; padding: 16px; box-sizing: border-box; page-break-inside: avoid; }
                        .text-center { text-align: center; }
                        .flex { display: flex; }
                        .justify-between { justify-content: space-between; }
                        .items-end { align-items: flex-end; }
                        .grid { display: grid; }
                        .grid-cols-2 { grid-template-cols: 1fr 1fr; }
                        .gap-4 { gap: 16px; }
                        .border-t { border-top: 1px solid rgba(212, 196, 168, 0.3); }
                        .border-b { border-bottom: 1px solid rgba(212, 196, 168, 0.3); }
                        .py-4 { padding-top: 10px; padding-bottom: 10px; }
                        .mb-8 { margin-bottom: 15px; }
                        .w-full { width: 100%; }
                        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                        th, td { border: 1px solid #D4C4A8; padding: 5px 6px; text-align: center; font-size: 12px; }
                        th { background-color: #fff8f2; color: #8E733E; font-weight: bold; }
                        .text-right { text-align: right; }
                        .bg-light { background-color: #fff8f2; }
                        @media print {
                            body, html { margin: 0; padding: 0; }
                            @page { size: portrait; margin: 6mm; }
                        }
                    </style>
                </head>
                <body>
                    <div class="bill-paper">
                        ${paperElement.innerHTML}
                    </div>
                </body>
            </html>
        `;

        try {
            await API.savePDF({
                fileName: `Bill-${invoice_no}-${customer_name.replace(/\s+/g, '_')}`,
                htmlContent: htmlContent
            });
            alert("Bill saved to device Downloads successfully!");
        } catch (e) {
            console.error(e);
            alert("Failed to download: " + e.message);
        }
    };

    return (
        <div className="fade-in space-y-6 pb-28">
            {/* Top Navigation Component */}
            <div className="no-print flex justify-between items-center border-b border-border-gold/30 pb-3">
                <button onClick={onClose} className="p-2 text-primary hover:bg-surface-container rounded-full active:opacity-80 transition-all cursor-pointer">
                    <span className="material-symbols-outlined">close</span>
                </button>
                <h1 className="font-headline font-bold text-lg text-deep-gold tracking-widest uppercase">Invoice Details</h1>
                <button onClick={handlePrint} className="p-2 text-primary hover:bg-surface-container rounded-full active:opacity-80 transition-all cursor-pointer">
                    <span className="material-symbols-outlined">print</span>
                </button>
            </div>

            {/* The Physical Bill Layout Container (Canvas for print/download) */}
            <div id="printable-bill-paper" className="bill-paper border border-border-gold p-6 shadow-md mb-8 relative overflow-hidden bg-white">
                {/* Gold Trim Corner Accent (Hidden in Print) */}
                <div className="absolute top-0 right-0 w-12 h-12 bg-deep-gold/5 -translate-y-6 translate-x-6 rotate-45 border-b border-border-gold no-print"></div>

                {/* Print Header Details (Visible in Print only, hidden on screen) */}
                <div className="hidden print:flex justify-between items-center text-[10px] font-bold border-b border-black pb-2 mb-4 font-body">
                    <span>GSTIN: 09BNZPK7511F1ZI</span>
                    <span>TAX INVOICE</span>
                    <span>Mob: 9411042260</span>
                </div>

                {/* Store Branding */}
                <div className="text-center mb-6">
                    <h2 className="font-headline text-2xl font-bold text-deep-gold mb-1 print:text-black">ALANKAR JEWELLERS</h2>
                    <p className="font-body text-xs text-on-surface-variant italic mb-1 print:text-black">Crafting Heritage Since 1974</p>
                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold print:text-black">Budh Bazar, Noorpur (Bijnor) U.P.</p>
                </div>

                {/* Invoice Metadata Row (Visible both on screen and in print) */}
                <div className="flex justify-between items-center mb-6 border-t border-b border-border-gold/30 print:border-black py-3 text-xs">
                    <div>
                        <span className="text-on-surface-variant block print:text-black font-semibold text-[10px] tracking-wider uppercase">Invoice No.</span>
                        <span className="font-bold text-primary print:text-black text-sm">#AJ-{invoice_no}</span>
                    </div>
                    <div className="text-right">
                        <span className="text-on-surface-variant block print:text-black font-semibold text-[10px] tracking-wider uppercase">Date</span>
                        <span className="font-bold text-primary print:text-black text-sm">{date}</span>
                    </div>
                </div>

                {/* Customer Details */}
                <div className="mb-6 border-b border-border-gold/30 print:border-black pb-3">
                    <p className="font-body text-[10px] font-bold text-on-surface-variant mb-2 tracking-wider print:text-black">CUSTOMER DETAILS</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                        <div>
                            <span className="text-on-surface-variant block print:text-black font-semibold">Name</span>
                            <span className="font-bold">{customer_name}</span>
                        </div>
                        <div>
                            <span className="text-on-surface-variant block print:text-black font-semibold">S/o or W/o</span>
                            <span>{father_name || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="text-on-surface-variant block print:text-black font-semibold">Phone</span>
                            <span>{contact_number || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="text-on-surface-variant block print:text-black font-semibold">Address</span>
                            <span>{customer_address || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="text-on-surface-variant block print:text-black font-semibold">State</span>
                            <span>{customer_state} ({customer_code})</span>
                        </div>
                        <div>
                            <span className="text-on-surface-variant block print:text-black font-semibold">Payment Mode</span>
                            <span className="font-bold">{payment_mode}</span>
                        </div>
                    </div>
                </div>

                {/* Itemized Table */}
                <div className="mb-6">
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            <tr className="bg-surface border-b-2 border-deep-gold print:border-black">
                                <th className="p-2 font-body font-bold text-deep-gold text-left print:text-black">ITEM DESCRIPTION</th>
                                <th className="p-2 font-body font-bold text-deep-gold print:text-black">WT(G)</th>
                                <th className="p-2 font-body font-bold text-deep-gold print:text-black">RATE</th>
                                <th className="p-2 font-body font-bold text-deep-gold text-right print:text-black">TOTAL</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr key={item.id || index} className="border-b border-border-gold/20 print:border-black/20">
                                    <td className="p-2 text-left font-semibold">
                                        <div>{item.itemName}</div>
                                        <div className="text-[10px] text-on-surface-variant print:text-black font-normal">{item.category} • HSN {item.hsn}</div>
                                    </td>
                                    <td className="p-2">{parseFloat(item.weight).toFixed(3)}g</td>
                                    <td className="p-2">₹{formatCurrency(item.rate)}</td>
                                    <td className="p-2 text-right font-bold">₹{formatCurrency(item.amount)}</td>
                                </tr>
                            ))}
                            {/* Empty rows to simulate paper receipt if small number of items */}
                            {items.length < 3 && [...Array(3 - items.length)].map((_, i) => (
                                <tr key={i} className="border-b border-border-gold/5 opacity-20 print:hidden">
                                    <td className="p-2 text-left">&nbsp;</td>
                                    <td className="p-2"></td>
                                    <td className="p-2"></td>
                                    <td className="p-2"></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Financial Breakdowns */}
                <div className="bg-surface/50 p-4 rounded-xl space-y-2 mb-6 border border-border-gold/20 print:border-black print:bg-white text-xs">
                    <div className="flex justify-between">
                        <span className="text-on-surface-variant print:text-black">Subtotal</span>
                        <span>₹{formatCurrency(subtotal)}</span>
                    </div>
                    {sgst > 0 && (
                        <div className="flex justify-between">
                            <span className="text-on-surface-variant print:text-black">SGST (1.5%)</span>
                            <span>₹{formatCurrency(sgst)}</span>
                        </div>
                    )}
                    {cgst > 0 && (
                        <div className="flex justify-between">
                            <span className="text-on-surface-variant print:text-black">CGST (1.5%)</span>
                            <span>₹{formatCurrency(cgst)}</span>
                        </div>
                    )}
                    {igst > 0 && (
                        <div className="flex justify-between">
                            <span className="text-on-surface-variant print:text-black">IGST (3.0%)</span>
                            <span>₹{formatCurrency(igst)}</span>
                        </div>
                    )}
                    {discount > 0 && (
                        <div className="flex justify-between text-red-600 print:text-black">
                            <span>Discount</span>
                            <span>- ₹{formatCurrency(discount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between border-t border-border-gold pt-2 mt-2 print:border-black font-bold">
                        <span className="font-body text-xs text-deep-gold print:text-black">GRAND TOTAL</span>
                        <span className="text-sm text-primary print:text-black">₹{formatCurrency(total_amount)}</span>
                    </div>
                </div>

                {/* Footer Notes & Stamp */}
                <div className="space-y-4">
                    <div className="text-[11px] italic font-body text-on-surface-variant print:text-black">
                        <strong>In Words:</strong> {numberToWords(total_amount)}
                    </div>
                    
                    <div className="flex justify-between items-end pt-4 border-t border-border-gold/30 print:border-black/30">
                        <div className="max-w-[60%]">
                            <p className="text-[9px] text-on-surface-variant print:text-black leading-tight">
                                Thank you for shopping with Alankar Jewellers. Subject to return policy rules.
                            </p>
                        </div>
                        {/* Stamp image */}
                        <div className="text-right">
                            <div className="flex justify-end opacity-60 mb-1">
                                <img 
                                    alt="Jeweler Stamp" 
                                    className="h-12 w-auto grayscale" 
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBbgCuw7eUYGmf1MMh8KTiqaymsspvDZnblbrf0je0JYnipAqI-yMjq7sxNWAGISiF3QnFpUv3zHssdm-Dw_g9xNyY1UEnHabfFGHvzFgI_2I6As4GACuZIRkdSRBsNC1yHSjQh7I4YFpiAwj02ksbpnitoFzY7bMt9TuJCApVzt-84Prwj8yuKrxp3ufCO-HfXdz8Pewfjef9BYZ1FYx-G1E0npA9sFrKtCXQY5C-ySvVKFXZEnw1izptjRp8KZDKMK0Q6Am5qzNds"
                                />
                            </div>
                            <p className="text-[9px] text-on-surface-variant font-bold print:text-black">Authorised Signatory</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Banner */}
            <div className="no-print flex items-center gap-3 bg-emerald-50 border border-emerald-200 p-4 rounded-xl shadow-sm">
                <span className="material-symbols-outlined text-emerald-600">verified_user</span>
                <p className="text-xs text-emerald-800 font-bold">Bill saved offline to database successfully!</p>
            </div>

            {/* Sticky Action Footer Bar */}
            <div className="no-print fixed bottom-0 left-0 w-full bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] border-t border-border-gold flex gap-3 z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] invoice-actions-bar">
                <button 
                    onClick={handleDownloadHTML}
                    className="flex-1 flex flex-col items-center justify-center bg-charcoal-grey text-white rounded-xl py-3 active:scale-[0.97] transition-all cursor-pointer"
                >
                    <span className="material-symbols-outlined mb-1">download</span>
                    <span className="font-body text-[9px] font-bold tracking-wider">SAVE HTML</span>
                </button>
                <button 
                    onClick={handleShare}
                    className="flex-[2] flex items-center justify-center gap-2 bg-primary hover:bg-deep-gold text-white rounded-xl py-3 active:scale-[0.97] transition-all shadow-md cursor-pointer"
                >
                    <span className="material-symbols-outlined text-lg">share</span>
                    <span className="font-body text-xs font-bold uppercase tracking-wider">SHARE BILL</span>
                </button>
            </div>
        </div>
    );
}
