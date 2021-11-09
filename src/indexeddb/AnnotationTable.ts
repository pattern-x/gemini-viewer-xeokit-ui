import { BaseTable } from "./BaseTable";

/**
 * Table is known as ObjectStore in IndexedDb
 * AnnotationTable in IndexedDb
 */
export class AnnotationTable extends BaseTable {
    tableName() {
        return "annotation";
    }

    /**
     * Singleton design pattern
     */
    private static _instance: AnnotationTable | undefined = undefined;
    static instance(): AnnotationTable {
        if (!AnnotationTable._instance) {
            AnnotationTable._instance = new AnnotationTable();
        }
        return AnnotationTable._instance;
    }

    /**
     * Queries annotations by projectId
     */
    query(projectId: string, okFunc?: any, errorFunc?: any) { // eslint-disable-line
        const annotations: any[] = [] // eslint-disable-line
        super.query(
            (cursor: any) => { // eslint-disable-line
                if (!cursor) {
                    okFunc && okFunc(annotations);
                    return; // end of iteration
                }
                if (!cursor.value || cursor.value.projectId !== projectId) {
                    return; // filter out annotation from other projects
                }
                // indexedDb put the 'key' into value automatically, so we don't need to store cursor.key any more.
                annotations.push(cursor.value);
            },
            (error: any) => { // eslint-disable-line
                console.log(error);
            }
        );
    }
}
