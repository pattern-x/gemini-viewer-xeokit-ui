import { IndexedDbManager } from "./IndexedDbManager";

/**
 * Table is known as ObjectStore in IndexedDb
 */
export class BaseTable {
    private _db?: IDBDatabase;
    private _isCreatingTable = false;

    constructor() {
        // When a new table is implemented, developer need to make sure to add it into IndexedDbManager
        const i = IndexedDbManager.instance().TABLES.findIndex((t) => t.name === this.tableName());
        if (i === -1) {
            throw new Error(`Make sure to add table '${this.tableName()}' to IndexedDbManager.TABLES!`);
        }
    }

    /**
     * Derived class have to override this method and return a table name!
     */
    tableName(): string {
        throw new Error("Derived class have to override 'tableName', and set a proper table name!");
    }

    /**
     * Adds a record to a table
     */
    add(record: any, okFunc?: any, errorFunc?: any) { // eslint-disable-line
        const table = this.tableName();
        IndexedDbManager.instance()
            .getDatabase()
            .then((db) => {
                const objectStore = db.transaction([table], "readwrite").objectStore(table);
                const request = objectStore.add(record);

                request.onsuccess = okFunc;
                request.onerror = errorFunc;
            });
    }

    /**
     * Saves a record
     */
    save(record: any, okFunc?: any, errorFunc?: any) { // eslint-disable-line
        const table = this.tableName();
        IndexedDbManager.instance()
            .getDatabase()
            .then((db) => {
                const objectStore = db.transaction([table], "readwrite").objectStore(table);
                const request = objectStore.put(record);

                request.onsuccess = okFunc;
                request.onerror = errorFunc;
            });
    }

    /**
     * Deletes a record
     */
    delete(key: string, okFunc?: any, errorFunc?: any) { // eslint-disable-line
        const table = this.tableName();
        IndexedDbManager.instance()
            .getDatabase()
            .then((db) => {
                const objectStore = db.transaction([table], "readwrite").objectStore(table);
                const request = objectStore.delete(key);

                request.onsuccess = okFunc;
                request.onerror = errorFunc;
            });
    }

    /**
     * Updates a record
     */
    update() {
        IndexedDbManager.instance()
            .getDatabase()
            .then((db) => { // eslint-disable-line
                // TODO
            });
    }

    /**
     * Queries records in a table
     * @param cursorHandler callback to handle records one by one
     */
    query(cursorHandler?: any, errorFunc?: any) { // eslint-disable-line
        const table = this.tableName();
        IndexedDbManager.instance()
            .getDatabase()
            .then((db) => {
                const objectStore = db.transaction([table], "readonly").objectStore(table);
                const cursor = objectStore.openCursor();
                cursor.onsuccess = (event: any) => { // eslint-disable-line
                    const csr = event.target.result; // cursor
                    if (csr) {
                        csr.continue();
                    }
                    cursorHandler && cursorHandler(csr);
                };

                cursor.onerror = errorFunc;
            });
    }
}
