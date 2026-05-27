import sqlite3
import os
import datetime
import sys
import webbrowser
import logging
from threading import Timer
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# PyInstaller path adjustment
if getattr(sys, 'frozen', False):
    base_dir = sys._MEIPASS
    static_dir = os.path.join(base_dir, 'dist')
else:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    static_dir = os.path.abspath(os.path.join(base_dir, '../dist'))

logger.info(f"Static Dir: {static_dir}")
app = Flask(__name__, static_folder=static_dir, static_url_path='/')
CORS(app)

# Persistent Database Path
app_data_dir = os.path.join(os.environ.get('APPDATA') or os.path.expanduser('~'), 'AlankarBilling')
os.makedirs(app_data_dir, exist_ok=True)
DB_PATH = os.path.join(app_data_dir, 'alankar_billing.db')
logger.info(f"Using Database at: {DB_PATH}")

def init_db():
    try:
        conn = sqlite3.connect(DB_PATH, timeout=20)
        c = conn.cursor()
        c.execute('''
            CREATE TABLE IF NOT EXISTS items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category TEXT NOT NULL CHECK(category IN ('Gold', 'Silver')),
                hsn_code TEXT,
                default_rate REAL, 
                default_weight REAL,
                default_making_charge REAL
            )
        ''')
        c.execute('''
            CREATE TABLE IF NOT EXISTS loans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                person_name TEXT NOT NULL,
                amount REAL NOT NULL,
                date TEXT NOT NULL,
                type TEXT CHECK(type IN ('Given', 'Taken')),
                status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'Settled')),
                remarks TEXT
            )
        ''')

        c.execute('''
            CREATE TABLE IF NOT EXISTS bills (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                invoice_no TEXT,
                customer_name TEXT, 
                father_name TEXT,
                contact_number TEXT,
                date TEXT,
                total_amount REAL,
                UNIQUE(invoice_no)
            )
        ''')
        c.execute('''
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT
            )
        ''')
        c.execute("INSERT OR IGNORE INTO settings (key, value) VALUES ('next_invoice_no', '1')")
        c.execute("INSERT OR IGNORE INTO settings (key, value) VALUES ('bill_count_offset', '0')")
        
        # Migration for existing DB
        c.execute("PRAGMA table_info(bills)")
        columns = [row[1] for row in c.fetchall()]
        if 'father_name' not in columns:
            c.execute("ALTER TABLE bills ADD COLUMN father_name TEXT")
        if 'contact_number' not in columns:
            c.execute("ALTER TABLE bills ADD COLUMN contact_number TEXT")
        
        conn.commit()
        conn.close()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"DB Init Error: {e}")

init_db()

@app.route('/health')
def health():
    return jsonify({'status': 'ok'})

@app.route('/')
def serve():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/items', methods=['GET'])
def get_items():
    conn = sqlite3.connect(DB_PATH, timeout=20)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute('SELECT * FROM items ORDER BY name')
    rows = c.fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])

@app.route('/api/items', methods=['POST'])
def add_item():
    data = request.json
    conn = sqlite3.connect(DB_PATH, timeout=20)
    c = conn.cursor()
    c.execute('INSERT INTO items (name, category, hsn_code, default_rate, default_weight, default_making_charge) VALUES (?, ?, ?, ?, ?, ?)',
              (data.get('name'), data.get('category'), data.get('hsn_code', ''), data.get('default_rate', 0), data.get('default_weight', 0), data.get('default_making_charge', 0)))
    conn.commit()
    new_id = c.lastrowid
    conn.close()
    return jsonify({'id': new_id, **data}), 201

@app.route('/api/items/<int:item_id>', methods=['DELETE'])
def delete_item(item_id):
    conn = sqlite3.connect(DB_PATH, timeout=20)
    c = conn.cursor()
    c.execute('DELETE FROM items WHERE id = ?', (item_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/next-invoice', methods=['GET'])
def get_next_invoice():
    conn = sqlite3.connect(DB_PATH, timeout=20)
    c = conn.cursor()
    
    # Get total bills in DB
    c.execute('SELECT COUNT(*) FROM bills')
    total_db = c.fetchone()[0]
    
    # Get bill count offset from settings
    c.execute("SELECT value FROM settings WHERE key='bill_count_offset'")
    row_offset = c.fetchone()
    offset = 0
    if row_offset:
        try:
            offset = int(row_offset[0])
        except ValueError:
            pass
            
    # Get next invoice number from settings
    c.execute("SELECT value FROM settings WHERE key='next_invoice_no'")
    row_next = c.fetchone()
    
    if row_next and row_next[0]:
        next_invoice = row_next[0]
    else:
        c.execute('SELECT invoice_no FROM bills ORDER BY id DESC LIMIT 1')
        row = c.fetchone()
        if row:
            try:
                last_no = int(row[0])
                next_invoice = str(last_no + 1)
            except ValueError:
                next_invoice = '1'
        else:
            next_invoice = '1'
            
    conn.close()
    return jsonify({
        'invoice_no': next_invoice,
        'bill_count': total_db + offset,
        'total_db': total_db,
        'bill_count_offset': offset
    })

@app.route('/api/bills', methods=['POST'])
def save_bill_to_db():
    data = request.json
    invoice_no = data.get('invoice_no')
    conn = sqlite3.connect(DB_PATH, timeout=20)
    c = conn.cursor()
    c.execute('INSERT INTO bills (invoice_no, customer_name, father_name, contact_number, date, total_amount) VALUES (?, ?, ?, ?, ?, ?)',
              (invoice_no, data.get('customer_name'), data.get('father_name'), data.get('contact_number'), data.get('date'), data.get('total_amount')))
              
    # Automatically update next_invoice_no setting to invoice_no + 1
    if invoice_no:
        try:
            next_no = int(invoice_no) + 1
            c.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('next_invoice_no', ?)", (str(next_no),))
        except ValueError:
            pass
            
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/settings', methods=['GET', 'POST'])
def handle_settings():
    conn = sqlite3.connect(DB_PATH, timeout=20)
    c = conn.cursor()
    if request.method == 'POST':
        data = request.json
        if 'next_invoice_no' in data:
            c.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('next_invoice_no', ?)", (str(data['next_invoice_no']),))
        if 'bill_count_offset' in data:
            c.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('bill_count_offset', ?)", (str(data['bill_count_offset']),))
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    else:
        c.execute("SELECT value FROM settings WHERE key='next_invoice_no'")
        row_next = c.fetchone()
        next_invoice_no = row_next[0] if row_next else '1'
        
        c.execute("SELECT value FROM settings WHERE key='bill_count_offset'")
        row_offset = c.fetchone()
        bill_count_offset = int(row_offset[0]) if row_offset else 0
        
        c.execute('SELECT COUNT(*) FROM bills')
        total_db = c.fetchone()[0]
        
        conn.close()
        return jsonify({
            'next_invoice_no': next_invoice_no,
            'bill_count_offset': bill_count_offset,
            'total_db': total_db,
            'bill_count': total_db + bill_count_offset
        })


@app.route('/api/loans', methods=['GET'])
def get_loans():
    conn = sqlite3.connect(DB_PATH, timeout=20)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute('SELECT * FROM loans ORDER BY date DESC')
    rows = c.fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])

@app.route('/api/loans', methods=['POST'])
def add_loan():
    data = request.json
    conn = sqlite3.connect(DB_PATH, timeout=20)
    c = conn.cursor()
    c.execute('INSERT INTO loans (person_name, amount, date, type, status, remarks) VALUES (?, ?, ?, ?, ?, ?)',
              (data.get('person_name'), data.get('amount'), data.get('date'), data.get('type'), data.get('status', 'Pending'), data.get('remarks', '')))
    conn.commit()
    new_id = c.lastrowid
    conn.close()
    return jsonify({'id': new_id, **data}), 201

@app.route('/api/loans/<int:loan_id>', methods=['PATCH'])
def update_loan_status(loan_id):
    data = request.json
    conn = sqlite3.connect(DB_PATH, timeout=20)
    c = conn.cursor()
    c.execute('UPDATE loans SET status = ? WHERE id = ?', (data.get('status'), loan_id))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/loans/<int:loan_id>', methods=['DELETE'])
def delete_loan(loan_id):
    conn = sqlite3.connect(DB_PATH, timeout=20)
    c = conn.cursor()
    c.execute('DELETE FROM loans WHERE id = ?', (loan_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/save-pdf', methods=['POST'])
def save_pdf():
    try:
        data = request.json
        file_name = data.get('fileName', f'invoice_{datetime.datetime.now().timestamp()}')
        html_content = data.get('htmlContent', '<h1>Invoice</h1>')
        
        # More robust user path
        home_path = os.path.expanduser('~')
        docs_path = os.path.join(home_path, 'Documents', 'AlankarBills')
        
        today = datetime.datetime.now().strftime('%Y-%m-%d')
        save_dir = os.path.join(docs_path, today)
        os.makedirs(save_dir, exist_ok=True)
        
        # Clean filename
        file_name = "".join([c for c in file_name if c.isalnum() or c in (' ', '.', '_', '-')]).strip()
        file_path = os.path.join(save_dir, f"{file_name}.html")
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        logger.info(f"File saved successfully at: {file_path}")
        return jsonify({'success': True, 'filePath': file_path})
    except Exception as e:
        logger.error(f"Save PDF Error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.errorhandler(Exception)
def handle_error(e):
    logger.error(f"Global Error: {str(e)}")
    return jsonify({'success': False, 'error': str(e)}), 500

def open_browser():
    webbrowser.open_new('http://localhost:5000/')

if __name__ == '__main__':
    if os.environ.get('WERKZEUG_RUN_MAIN') != 'true':
        Timer(1, open_browser).start()
    app.run(host='0.0.0.0', port=5000)
