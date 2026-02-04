import { openDB } from 'idb';

const dbName = 'editorDB';
const storeName = 'configStore';

export async function initDB() {
    return openDB(dbName, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName);
            }
        },
    });
}

let dbState = null;

export async function initDBOnLoad() {
    const db = dbState || (dbState = await initDB());
    return db;
}

export async function saveData(value) {
    const db = dbState || (dbState = await initDB());

    return db.put(storeName, value, 'music_clicker');
}

export async function getData() {
    const db = dbState || (dbState = await initDB());
    return db.get(storeName, 'music_clicker');
}
