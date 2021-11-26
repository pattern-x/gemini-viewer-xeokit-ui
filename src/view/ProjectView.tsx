import React, { ReactElement, useEffect, useState } from "react";
import { Annotations } from "../components/Annotations";
import { BimViewer, KeyBoardRotatePlugin, ToolbarMenuId } from "@pattern-x/gemini-viewer";
import { DatGuiHelper } from "../helper/DatGuiHelper";
import { PathParam } from "./../App";
import { Project } from "../constant/Project";
import { setAnnotationActive } from "../store/AnnotationsSlice";
import { useAppDispatch } from "../store/Hooks";
import { useParams } from "react-router-dom";
import { Viewpoints } from "../components/Viewpoints";

import "../css/preset.scss";

export const ProjectView: React.FC = (): ReactElement => {
    const { projectId } = useParams<PathParam>();
    const [bimViewer, setBimViewer] = useState<BimViewer | undefined>(undefined);

    const dispatch = useAppDispatch();

    useEffect(() => {
        const initBimViewer = (project: Project): BimViewer => {
            const bimViewer = new BimViewer(
                {
                    canvasId: "myCanvas",
                },
                project.camera
            );

            new KeyBoardRotatePlugin(bimViewer.viewer);

            const handleActivate = () => dispatch(setAnnotationActive(true));
            const handleDeactivate = () => dispatch(setAnnotationActive(false));

            bimViewer.toolbar.updateMenu(ToolbarMenuId.Annotation, {
                visible: true,
                onActive: handleActivate,
                onDeactive: handleDeactivate,
            });

            return bimViewer;
        };

        const loadProjectModels = (project: Project, bimViewer: BimViewer) => {
            let fontLoading = false;
            let counter = 0; // to indicate how many models are loading
            project.models.forEach(async (modelCfg: any) => {
                if (modelCfg.visible === false) {
                    // visible is true by default
                    return; // only load visible ones
                }

                // add font
                const { src } = modelCfg;
                const format = src.substring(src.lastIndexOf(".") + 1);
                if (format.toLowerCase() === "dxf" && !fontLoading) {
                    fontLoading = true;
                    await bimViewer.loadFont("/fonts/Microsoft YaHei_Regular.typeface.json");
                }

                counter++;
                bimViewer.loadModel(modelCfg, () => {
                    counter--;
                    if (counter === 0) {
                        if (bimViewer.has2dModel && !bimViewer.has3dModel) {
                            bimViewer.active2dMode();
                        }
                    }
                });
            });
        };

        const initDatGui = (bimViewer: BimViewer) => {
            if (!bimViewer) {
                return;
            }
            const datGuiHelper = new DatGuiHelper(bimViewer);
            datGuiHelper.close(); // collapse it by default
        };

        let bimViewer: BimViewer;

        fetch("/config/projects.json")
            .then((res) => res.json())
            .then((projects: Project[]) => projects.find((project: Project) => project.id === projectId))
            .then((project) => {
                project && (bimViewer = initBimViewer(project));
                if (bimViewer) {
                    setBimViewer(bimViewer);
                }
                return { project, bimViewer };
            })
            .then(({ project, bimViewer }) => {
                project && loadProjectModels(project, bimViewer);
                initDatGui(bimViewer);
            })
            .catch((err) => console.error(err));

        return () => {
            bimViewer && bimViewer.destroy();
        };
    }, [projectId, dispatch]);

    return (
        <div>
            <canvas id="myCanvas" className="canvas" />
            <div id="pivotMarker" className="camera-pivot-marker" />
            <div id="treeViewContainer" />
            <Viewpoints projectId={projectId} bimViewer={bimViewer} />
            <Annotations bimViewer={bimViewer} />
        </div>
    );
};
