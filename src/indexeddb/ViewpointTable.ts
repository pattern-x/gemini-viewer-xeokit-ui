import { BaseTable } from "./BaseTable";

/**
 * Table is known as ObjectStore in IndexedDb
 * ViewpointTable in IndexedDb
 */
export class ViewpointTable extends BaseTable {
    tableName() {
        return "viewpoint";
    }

    /**
     * Singleton design pattern
     */
    private static _instance: ViewpointTable | undefined = undefined;
    static instance(): ViewpointTable {
        if (!ViewpointTable._instance) {
            ViewpointTable._instance = new ViewpointTable();
        }
        return ViewpointTable._instance;
    }

    /**
     * Queries viewpoints by projectId
     */
    query(projectId: string, okFunc?: any, errorFunc?: any) { // eslint-disable-line
        const viewpoints: any[] = [] // eslint-disable-line
        super.query(
            (cursor: any) => { // eslint-disable-line
                if (!cursor) {
                    okFunc && okFunc(viewpoints);
                    return; // end of iteration
                }
                if (!cursor.value || cursor.value.projectId !== projectId) {
                    return; // filter out viewpoint from other projects
                }
                // indexedDb put the 'key' into value automatically, so we don't need to store cursor.key any more.
                viewpoints.push(cursor.value);
            },
            (error: any) => { // eslint-disable-line
                console.log(error);
            }
        );
    }
}
