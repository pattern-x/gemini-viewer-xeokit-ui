export class IndexedDbManager {
    private readonly DATABASE_NAME = "bim_viewer_db";
    readonly TABLES = [
        {
            name: "viewpoint",
            options: { keyPath: "id", autoIncrement: true },
            indexArray: [],
        },
        {
            name: "annotation",
            options: { keyPath: "annotationId", autoIncrement: true },
            indexArray: [],
        },
    ];

    private db?: IDBDatabase;

    /**
     * Singleton design pattern
     */
    private static _instance: IndexedDbManager | undefined = undefined;
    static instance(): IndexedDbManager {
        if (!IndexedDbManager._instance) {
            IndexedDbManager._instance = new IndexedDbManager();
        }
        return IndexedDbManager._instance;
    }

    /**
     * Make sure to open database, and the table is already created before add/put/delete, etc.
     */
    async getDatabase(): Promise<IDBDatabase> {
        if (!this.db) {
            // for the first time to open db, trigger upgrade event and create tables
            let db = await this.getDB(this.DATABASE_NAME);
            db.close();
            db = await this.getUpgradedDB(db);
            db.onclose = (e: Event) => {
                this.db = undefined;
                console.log(`[IndexedDb] Db ${db.name} is closed. ${e}`);
            };
            db.onerror = (e: Event) => {
                this.db = undefined;
                console.error(`[IndexedDb] Db ${db.name} encountered error. ${e}`);
            };
            db.onabort = (e: Event) => {
                this.db = undefined;
                console.error(`[IndexedDb] Db ${db.name} aborted. ${e}`);
            };
            this.db = db;
        }
        return Promise.resolve(this.db);
    }

    /**
     * Close database.
     */
    closeDatabase() {
        this.db && this.db.close();
    }

    private async getDB(dbName: string): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = window.indexedDB.open(dbName);
            request.onerror = reject;
            request.onsuccess = (e: any) => {// eslint-disable-line
                const db = e.target.result;
                console.log(`[IndexedDb] Db ${db.name} opened (version ${db.version}).`);
                resolve(db);
            };
        });
    }

    private async getUpgradedDB(db: IDBDatabase): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            console.log(`[IndexedDb] Upgrading db ${db.name} (version ${db.version})`);
            const request = window.indexedDB.open(db.name, db.version + 1);
            request.onerror = reject;
            request.onupgradeneeded = (e: any) => { // eslint-disable-line
                const transaction = e.target.transaction;
                transaction.oncomplete = () => {
                    // need to return until transaction is completed!
                    console.log(`[IndexedDb] Upgrade is done (new version: ${db.version}).`);
                    resolve(db);
                };
                const db = e.target.result;
                const promises: Promise<any>[] = []; // eslint-disable-line
                for (let i = 0; i < this.TABLES.length; ++i) {
                    const table = this.TABLES[i];
                    if (!db.objectStoreNames.contains(table.name)) {
                        console.log(`[IndexedDb] Creating table ${table.name}...`);
                        const p = this.createTable(db, table.name, table.options, table.indexArray);
                        promises.push(p);
                    }
                }
                if (promises.length > 0) {
                    Promise.all(promises).then((results) => { // eslint-disable-line
                        console.log(`[IndexedDb] All(${promises.length}) tables created.`);
                    });
                }
            };
        });
    }

    private async createTable(
        db: IDBDatabase,
        tableName: string,
        options?: IDBObjectStoreParameters,
        indexArray?: { name: string; fields: string[]; unique: boolean }[]
    ) {
        return new Promise((resolve, reject) => { // eslint-disable-line
            const store = db.createObjectStore(tableName, options);
            indexArray &&
                indexArray.forEach((indexObj) => {
                    store.createIndex(indexObj.name, indexObj.fields, { unique: indexObj.unique });
                });
            // store.transaction.onerror = reject
            // store.transaction.oncomplete = (e: any) => {
            //   console.log(`[IndexedDb] Table ${tableName} created.`)
            //   resolve(e.target.db)
            // }
            console.log(`[IndexedDb] Table ${tableName} created.`);
            resolve(db);
        });
    }
}
