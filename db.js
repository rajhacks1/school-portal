// Database management
let db = null;

function initDB() {
    return new Promise((resolve) => {
        const req = indexedDB.open('SchoolPortalDB', 1);

        req.onerror = () => {
            console.error('DB error:', req.error);
            resolve();
        };

        req.onsuccess = () => {
            db = req.result;
            console.log('Database initialized');
            resolve();
        };

        req.onupgradeneeded = (event) => {
            db = event.target.result;

            const stores = ['users', 'subjects', 'classes', 'attendance', 'results', 'pending_registrations'];
            stores.forEach(store => {
                if (!db.objectStoreNames.contains(store)) {
                    db.createObjectStore(store, { keyPath: 'id' });
                }
            });
        };
    });
}

function dbAdd(store, data) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction([store], 'readwrite');
        const st = tx.objectStore(store);
        const req = st.add(data);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve(req.result);
    });
}

function dbGetAll(store) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction([store], 'readonly');
        const st = tx.objectStore(store);
        const req = st.getAll();
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve(req.result || []);
    });
}

function dbGet(store, key) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction([store], 'readonly');
        const st = tx.objectStore(store);
        const req = st.get(key);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve(req.result);
    });
}

function dbUpdate(store, data) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction([store], 'readwrite');
        const st = tx.objectStore(store);
        const req = st.put(data);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve(req.result);
    });
}

function dbDelete(store, key) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction([store], 'readwrite');
        const st = tx.objectStore(store);
        const req = st.delete(key);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve();
    });
}

function dbClear(store) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction([store], 'readwrite');
        const st = tx.objectStore(store);
        const req = st.clear();
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve();
    });
}
