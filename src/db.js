// Client-side Offline IndexedDB Database Manager for Alankar Jewellers Billing
const DB_NAME = 'AlankarBillingDB';
const DB_VERSION = 1;

let dbPromise = null;

export const initDB = () => {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Items store (Inventory)
            if (!db.objectStoreNames.contains('items')) {
                db.createObjectStore('items', { keyPath: 'id', autoIncrement: true });
            }

            // Loans store
            if (!db.objectStoreNames.contains('loans')) {
                db.createObjectStore('loans', { keyPath: 'id', autoIncrement: true });
            }

            // Bills store
            if (!db.objectStoreNames.contains('bills')) {
                const billStore = db.createObjectStore('bills', { keyPath: 'id', autoIncrement: true });
                billStore.createIndex('invoice_no', 'invoice_no', { unique: true });
            }

            // Settings store
            if (!db.objectStoreNames.contains('settings')) {
                db.createObjectStore('settings', { keyPath: 'key' });
            }
        };

        request.onsuccess = async (event) => {
            const db = event.target.result;
            // Seed default values
            try {
                await seedDatabase(db);
            } catch (err) {
                console.error('Seeding database failed', err);
            }
            resolve(db);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });

    return dbPromise;
};

// Database helper functions
const getStore = async (storeName, mode = 'readonly') => {
    const db = await initDB();
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
};

// Seeding Default Master Data
const seedDatabase = async (db) => {
    const transaction = db.transaction(['settings', 'items'], 'readwrite');
    const settingsStore = transaction.objectStore('settings');
    const itemsStore = transaction.objectStore('items');

    // 1. Seed default settings
    const checkSetting = (key, defaultValue) => {
        return new Promise((resolve) => {
            const req = settingsStore.get(key);
            req.onsuccess = () => {
                if (!req.result) {
                    settingsStore.put({ key, value: defaultValue });
                }
                resolve();
            };
        });
    };

    await checkSetting('next_invoice_no', '1001');
    await checkSetting('bill_count_offset', '0');

    // 2. Seed default items if empty
    const checkItems = () => {
        return new Promise((resolve) => {
            const req = itemsStore.count();
            req.onsuccess = () => {
                if (req.result === 0) {
                    const defaultItems = [
                        { name: 'Gold Ring 22K (Temple Design)', category: 'Gold', hsn_code: '7113', default_rate: 72000, default_weight: 4.5, default_making_charge: 500 },
                        { name: 'Gold Chain 22K (Classic Link)', category: 'Gold', hsn_code: '7113', default_rate: 72000, default_weight: 12.8, default_making_charge: 450 },
                        { name: 'Gold Necklace Set (Bridal)', category: 'Gold', hsn_code: '7113', default_rate: 72000, default_weight: 45.2, default_making_charge: 600 },
                        { name: 'Gold Bangles 22K (Pair)', category: 'Gold', hsn_code: '7113', default_rate: 72000, default_weight: 24.5, default_making_charge: 400 },
                        { name: 'Silver Anklet (Fancy Payal)', category: 'Silver', hsn_code: '7113', default_rate: 800, default_weight: 32.0, default_making_charge: 60 },
                        { name: 'Silver Ring (925 Sterling)', category: 'Silver', hsn_code: '7113', default_rate: 950, default_weight: 3.5, default_making_charge: 50 }
                    ];
                    for (const item of defaultItems) {
                        itemsStore.add(item);
                    }
                }
                resolve();
            };
        });
    };

    await checkItems();
};

// CRUD Operations

// --- ITEMS ---
export const getItemsDB = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const store = await getStore('items', 'readonly');
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        } catch (e) {
            reject(e);
        }
    });
};

export const addItemDB = (item) => {
    return new Promise(async (resolve, reject) => {
        try {
            const store = await getStore('items', 'readwrite');
            const req = store.add(item);
            req.onsuccess = (e) => resolve({ id: e.target.result, ...item });
            req.onerror = () => reject(req.error);
        } catch (e) {
            reject(e);
        }
    });
};

export const deleteItemDB = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const store = await getStore('items', 'readwrite');
            const req = store.delete(id);
            req.onsuccess = () => resolve(true);
            req.onerror = () => reject(req.error);
        } catch (e) {
            reject(e);
        }
    });
};

// --- LOANS ---
export const getLoansDB = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const store = await getStore('loans', 'readonly');
            const req = store.getAll();
            req.onsuccess = () => {
                // Sort by date descending
                const sorted = req.result.sort((a, b) => new Date(b.date) - new Date(a.date));
                resolve(sorted);
            };
            req.onerror = () => reject(req.error);
        } catch (e) {
            reject(e);
        }
    });
};

export const addLoanDB = (loan) => {
    return new Promise(async (resolve, reject) => {
        try {
            const store = await getStore('loans', 'readwrite');
            const req = store.add(loan);
            req.onsuccess = (e) => resolve({ id: e.target.result, ...loan });
            req.onerror = () => reject(req.error);
        } catch (e) {
            reject(e);
        }
    });
};

export const updateLoanStatusDB = (id, status) => {
    return new Promise(async (resolve, reject) => {
        try {
            const store = await getStore('loans', 'readwrite');
            const getReq = store.get(id);
            getReq.onsuccess = () => {
                const loan = getReq.result;
                if (!loan) {
                    reject(new Error('Loan not found'));
                    return;
                }
                loan.status = status;
                const updateReq = store.put(loan);
                updateReq.onsuccess = () => resolve(true);
                updateReq.onerror = () => reject(updateReq.error);
            };
            getReq.onerror = () => reject(getReq.error);
        } catch (e) {
            reject(e);
        }
    });
};

export const deleteLoanDB = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const store = await getStore('loans', 'readwrite');
            const req = store.delete(id);
            req.onsuccess = () => resolve(true);
            req.onerror = () => reject(req.error);
        } catch (e) {
            reject(e);
        }
    });
};

// --- BILLS ---
export const getBillsDB = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const store = await getStore('bills', 'readonly');
            const req = store.getAll();
            req.onsuccess = () => {
                // Sort by date/id descending
                const sorted = req.result.sort((a, b) => b.id - a.id);
                resolve(sorted);
            };
            req.onerror = () => reject(req.error);
        } catch (e) {
            reject(e);
        }
    });
};

export const addBillDB = (bill) => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await initDB();
            const transaction = db.transaction(['bills', 'settings'], 'readwrite');
            const billsStore = transaction.objectStore('bills');
            const settingsStore = transaction.objectStore('settings');

            // Add the bill
            const addReq = billsStore.add(bill);

            addReq.onsuccess = (e) => {
                const billId = e.target.result;
                
                // Automatically increment the next invoice number if it is a number
                const invoiceNo = bill.invoice_no;
                try {
                    const parsedNo = parseInt(invoiceNo, 10);
                    if (!isNaN(parsedNo)) {
                        settingsStore.put({ key: 'next_invoice_no', value: String(parsedNo + 1) });
                    }
                } catch (err) {
                    console.error('Failed to auto-increment setting next_invoice_no', err);
                }
                
                resolve({ id: billId, ...bill });
            };

            addReq.onerror = (e) => {
                reject(e.target.error);
            };
        } catch (e) {
            reject(e);
        }
    });
};

// --- SETTINGS ---
export const getSettingsDB = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await initDB();
            const transaction = db.transaction(['settings', 'bills'], 'readonly');
            const settingsStore = transaction.objectStore('settings');
            const billsStore = transaction.objectStore('bills');

            const result = {
                next_invoice_no: '1001',
                bill_count_offset: 0,
                total_db: 0,
                bill_count: 0
            };

            // Get next invoice number
            const reqNext = settingsStore.get('next_invoice_no');
            reqNext.onsuccess = () => {
                if (reqNext.result) result.next_invoice_no = reqNext.result.value;
                
                // Get offset
                const reqOffset = settingsStore.get('bill_count_offset');
                reqOffset.onsuccess = () => {
                    if (reqOffset.result) result.bill_count_offset = parseInt(reqOffset.result.value, 10) || 0;
                    
                    // Get bill count
                    const reqCount = billsStore.count();
                    reqCount.onsuccess = () => {
                        result.total_db = reqCount.result;
                        result.bill_count = result.total_db + result.bill_count_offset;
                        resolve(result);
                    };
                    reqCount.onerror = () => reject(reqCount.error);
                };
                reqOffset.onerror = () => reject(reqOffset.error);
            };
            reqNext.onerror = () => reject(reqNext.error);
        } catch (e) {
            reject(e);
        }
    });
};

export const saveSettingsDB = (settingsData) => {
    return new Promise(async (resolve, reject) => {
        try {
            const store = await getStore('settings', 'readwrite');
            
            if ('next_invoice_no' in settingsData) {
                store.put({ key: 'next_invoice_no', value: String(settingsData.next_invoice_no) });
            }
            if ('bill_count_offset' in settingsData) {
                store.put({ key: 'bill_count_offset', value: String(settingsData.bill_count_offset) });
            }
            
            resolve({ success: true });
        } catch (e) {
            reject(e);
        }
    });
};
