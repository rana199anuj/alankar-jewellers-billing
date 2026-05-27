// Smart Offline API wrapper mapping all backend operations to local IndexedDB storage
import * as DB from './db';

// Initialize the database connection immediately
DB.initDB().then(() => {
    console.log("Offline Database Initialized");
}).catch(err => {
    console.error("Offline Database Failed to Initialize", err);
});

export const getItems = async () => {
    return await DB.getItemsDB();
};

export const addItem = async (item) => {
    return await DB.addItemDB(item);
};

export const deleteItem = async (id) => {
    return await DB.deleteItemDB(id);
};

export const getNextInvoice = async () => {
    const settings = await DB.getSettingsDB();
    return {
        invoice_no: settings.next_invoice_no,
        bill_count: settings.bill_count,
        total_db: settings.total_db,
        bill_count_offset: settings.bill_count_offset
    };
};

export const saveBillToDB = async (billData) => {
    // Add default status of 'Paid' if not present
    if (!billData.status) {
        billData.status = 'Paid';
    }
    return await DB.addBillDB(billData);
};

export const getBills = async () => {
    return await DB.getBillsDB();
};

export const savePDF = async (data) => {
    // Client-side local HTML file download
    try {
        const fileContent = data.htmlContent;
        const fileName = `${data.fileName || 'invoice'}.html`;
        
        // On browser / Android WebView, we can generate a download link and click it
        const blob = new Blob([fileContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        return { success: true, filePath: 'Saved to Downloads' };
    } catch (err) {
        console.error("Local file save failed", err);
        throw err;
    }
};

export const getLoans = async () => {
    return await DB.getLoansDB();
};

export const addLoan = async (loan) => {
    return await DB.addLoanDB(loan);
};

export const updateLoanStatus = async (id, status) => {
    return await DB.updateLoanStatusDB(id, status);
};

export const deleteLoan = async (id) => {
    return await DB.deleteLoanDB(id);
};

export const getSettings = async () => {
    return await DB.getSettingsDB();
};

export const saveSettings = async (settingsData) => {
    return await DB.saveSettingsDB(settingsData);
};
