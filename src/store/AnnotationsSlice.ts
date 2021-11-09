import { Annotation, AnnotationDBParam } from "../constant/Annotation";
import { AnnotationTable } from "../indexeddb/AnnotationTable";
import { AppDispatch } from "./Store";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
// import type { RootState } from './store'

// Define a type for the slice state
interface AnnotationState {
    active: boolean;
    data: Annotation[];
}

// Define the initial state using that type
const initialState: AnnotationState = {
    active: false,
    data: [],
};

export const slice = createSlice({
    name: "annotation",
    // `createSlice` will infer the state type from the `initialState` argument
    initialState,
    reducers: {
        // Use the PayloadAction type to declare the contents of `action.payload`
        setActive: (state, action: PayloadAction<boolean>) => ({
            ...state,
            active: action.payload,
        }),
        setAnnotations: (state, action: PayloadAction<any[]>) => ({
            ...state,
            data: action.payload,
        }),
    },
});

export const { setActive: setAnnotationActive, setAnnotations } = slice.actions;

// Other code such as selectors can use the imported `RootState` type
// export const selectCount = (state: RootState) => state.viewpoints.value

export default slice.reducer;

export const fetchAnnotations =
    (projectId: string): any =>
    (dispatch: AppDispatch) =>
        AnnotationTable.instance().query(projectId, (records: Annotation[]) => {
            console.log("[UI] Annotation records fetched:", records, projectId);
            dispatch(setAnnotations(records));
        });

export const deleteAnnotation = (record: Annotation) => (dispatch: AppDispatch) =>
    AnnotationTable.instance().delete(record.annotationId, () => dispatch(fetchAnnotations(record.projectId)));

export const insertAnnotation = (record: AnnotationDBParam) => (dispatch: AppDispatch) =>
    AnnotationTable.instance().add(record, (event: any) => {
        const annotationId = event.target.result;
        console.log(`[UI] Annotation saved to indexeddb with id: ${annotationId}`);
        dispatch(fetchAnnotations(record.projectId));
        return annotationId;
    });
