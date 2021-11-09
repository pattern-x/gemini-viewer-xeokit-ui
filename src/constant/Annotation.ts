export interface Annotation {
    annotationId: string; // keyPath for DB
    id: string;
    labelHTML: string;
    labelShown: boolean;
    eye: number[];
    look: number[];
    up: number[];
    markerHTML: string;
    markerShown: boolean;
    occludable: boolean;
    projectId: string;
    values: { markerBGColor: string; labelBGColor: string; glyph: string; title: string; description: string };
    worldPos: number[];
}
export type AnnotationDBParam = Omit<Annotation, "annotationId">;
