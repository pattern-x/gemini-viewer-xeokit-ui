/* eslint-disable @typescript-eslint/no-explicit-any */
import * as dat from "dat.gui";
import { BimViewer, NavControlConfig } from "@pattern-x/gemini-viewer";
// import { Mesh, Node } from "@xeokit/xeokit-sdk/dist/xeokit-sdk.es.js";
import { store } from "../store/Store";
import { setVisibility as setViewpointsVisible } from "../store/ViewpointsSlice";
import { setAnnotationActive } from "../store/AnnotationsSlice";

// After opacity is set, entities' opacity and transparent properties will be changed.
// Espetially when original opacity is not 1, and transparent is false. Thus we'll cache these cases,
// when opacity is set back to 1, we'll need to revert to the original settings.
// interface OpacitySettings {
//     [modelId: string]: {
//         nodes: {
//             [id: string]: {
//                 opacity: number;
//                 transparent?: boolean;
//                 meshIndexNotTransparent?: number[]; // only store the mesh's index with transprent equals false
//             };
//         };
//         meshes: {
//             [id: string]: {
//                 opacity: number;
//                 transparent?: boolean;
//             };
//         };
//     };
// }

export class DatGuiHelper {
    private _bimViewer?: BimViewer;
    private _gui?: dat.GUI;
    private _navControlCfg: NavControlConfig;
    // private _originalOpacitySettings: OpacitySettings = {};
    private _unwatchViewpointsVisibility: any; // eslint-disable-line
    private _unwatchAnnotationsVisibility: any; // eslint-disable-line

    /**
     * dat.gui wrapper class
     */
    constructor(bimViewer: BimViewer) {
        this._bimViewer = bimViewer;
        //TODO:Cannot recognize initialization in function
        this._navControlCfg = {};
        this.init();
    }

    /**
     * Defined all controls here, which will be displyed in dat.GUI
     * Color should follow these formats:
     * '#ffffff', [0, 0, 0], [0, 0, 0, 0.5], { h: 100, s: 0.9, v: 0.3 }
     * While, we need to use it in format of [0, 0, 0, 0.5] here.
     */
    readonly controls = {
        // Viewer settings
        // viewFitAll: Function,
        // singleSelection: true,
        viewpoints: false,
        annotations: false,
        // orthoMode: false,
        planView: false,
        sectionPlane: false,
        // distanceMeasure: false,
        // bimTree: false,
        skybox: false,
        // fullScreen: false,
        //盒剖切
        sectionBoxEnabled: false, //是否开启
        boxVisible: false, //剖切盒是否可视
        fillColor: [0, 0, 0, 1],
        fillAlpha: 1,
        edgeColor: [0, 0, 0, 1],
        edgeAlpha: 1,
        edgeWidth: 1,
        hightlightedFillColor: [0, 0, 0, 1],
        hightlightedFillAlpha: 1,
        hightlightedEdgeColor: [0, 0, 0, 1],
        hightlightedEdgeAlpha: 1,
        hightlightedEdgeWidth: 1,
        // 地面网格
        grid: false,
        positionX: 0,
        positionY: 0,
        positionZ: 0,
        // 效果设置
        backgroundColor: [0, 0, 0, 1],
        // SAO 参数设置
        saoEnabled: true,
        kernelRadius: 100, // 内核半径，10 - 500
        intensity: 0.15, // 强度 0-1
        bias: 0.5, // 偏差，0 - 5
        scale: 1.0, // 0.01 - 5
        minResolution: 0.0, // 最小精度，0 - 1
        numSamples: 10, // 采样数，0 - 30
        blendCutoff: 0.1, // 混合分界，0-1
        blendFactor: 1.0, // 混合因子，0-2
        blur: true, // 高斯模糊
        // Lights
        pbrEnabled: true,
        // xrayed: false,
        edgesEnabled: true,
        opacity: 1.0,
    };

    private initNavConfig(): void {
        const bv = this._bimViewer;
        if (!bv) {
            return;
        }
        const ncc = this._navControlCfg;
        ncc.followPointer = !!bv.getNavValueByName("followPointer");
        ncc.doublePickFlyTo = !!bv.getNavValueByName("doublePickFlyTo");
        ncc.panRightClick = !!bv.getNavValueByName("panRightClick");
        // Rotation
        ncc.dragRotationRate = bv.getNavValueByName("dragRotationRate") as number;
        ncc.keyboardRotationRate = bv.getNavValueByName("keyboardRotationRate") as number;
        ncc.rotationInertia = bv.getNavValueByName("rotationInertia") as number;
        // Pan
        ncc.keyboardPanRate = bv.getNavValueByName("keyboardPanRate") as number;
        ncc.panInertia = bv.getNavValueByName("panInertia") as number;
        // Dolly
        ncc.keyboardDollyRate = bv.getNavValueByName("keyboardDollyRate") as number;
        ncc.mouseWheelDollyRate = bv.getNavValueByName("mouseWheelDollyRate") as number;
        ncc.dollyInertia = bv.getNavValueByName("dollyInertia") as number;
        ncc.dollyMinSpeed = bv.getNavValueByName("dollyMinSpeed") as number;
    }

    /**
     * Init dat.GUI
     */
    init() {
        if (!this._bimViewer) {
            throw new Error("Need to initialize viewer first!");
        }

        this.initNavConfig();
        const bimViewer = this._bimViewer;
        const viewer = bimViewer.viewer;
        // const scene = this.viewer.scene;
        const controls = this.controls;
        this._gui = new dat.GUI({
            name: "controls",
            autoPlace: true,
            width: 300,
            closed: true,
        });
        // uncomment it if we want to save values into localStorage
        // gui.remember(controls)
        // this.gui.close() // collapse the panel by default
        const dom = this._gui.domElement;
        dom.style.opacity = "0.6";
        if (dom.parentElement) {
            dom.parentElement.style.zIndex = "1";
        }
        // Viewer settings folder
        const vsf = this._gui.addFolder("常规设置");
        // vsf.add(controls, "viewFitAll")
        //     .name("缩放视口到所有模型")
        //     .onChange(() => {
        //         bimViewer.viewFitAll();
        //     });

        // vsf.add(controls, "singleSelection")
        //     .name("允许选中构件")
        //     .onChange((e: boolean) => {
        //         bimViewer.singleSelectionPlugin.setActive(e);
        //     });

        const viewpointsController = vsf.add(controls, "viewpoints", controls.viewpoints).name("视点管理");
        // viewpointsController.onChange((e: boolean) => store.commit(Types.MUTATION_SHOW_VIEWPOINTS, e));
        // when panel is closed/opened itself, update DatGui here. So, need to watch and unwatch this.
        // this._unwatchViewpointsVisibility = store.watch(
        //     (state, getters) => getters.getShowViewpoints,
        //     (visible: boolean) => {
        //         // only 'setValue' in case changed, because it triggers onChange again!
        //         if (viewpointsController.getValue() !== visible) {
        //             viewpointsController.setValue(visible);
        //         }
        //     }
        // );
        viewpointsController.onChange((e: boolean) => store.dispatch(setViewpointsVisible(e)));
        this._unwatchViewpointsVisibility = store.subscribe(() => {
            const state = store.getState();
            if (state.viewpoints.value !== viewpointsController.getValue()) {
                viewpointsController.setValue(state.viewpoints.value);
            }
        });

        const annoController = vsf.add(controls, "annotations", controls.annotations).name("批注管理");
        // annoController.onChange((e: boolean) => store.commit(Types.MUTATION_SHOW_ANNOTATIONS, e));
        // when panel is closed/opened itself, update DatGui here. So, need to watch and unwatch this.
        // this._unwatchAnnotationsVisibility = store.watch(
        //     (state, getters) => getters.getShowAnnotations,
        //     (visible: boolean) => {
        //         // only 'setValue' in case changed, because it triggers onChange again!
        //         if (annoController.getValue() !== visible) {
        //             annoController.setValue(visible);
        //         }
        //     }
        // );
        annoController.onChange((e: boolean) => store.dispatch(setAnnotationActive(e)));
        this._unwatchAnnotationsVisibility = store.subscribe(() => {
            const state = store.getState();
            if (state.annotations.active !== annoController.getValue()) {
                annoController.setValue(state.annotations.active);
            }
        });

        // vsf.add(controls, "orthoMode")
        //     .name("正交视图")
        //     .onChange((e: boolean) => {
        //         bimViewer.orthoModePlugin.setActive(e);
        //     });

        vsf.add(controls, "planView")
            .name("二维视图")
            .onChange((e: boolean) => {
                bimViewer.planViewPlugin.setActive(e);
            });

        // vsf.add(controls, "distanceMeasure")
        //     .name("距离测量")
        //     .onChange((e: boolean) => bimViewer.activeDistanceMeasurement(e));

        // vsf.add(controls, "bimTree")
        //     .name("构件树")
        //     .onChange((e: boolean) => {
        //         bimViewer.treeViewPlugin?.setActive(e);
        //     });

        vsf.add(controls, "skybox")
            .name("天空盒")
            .onChange((e: boolean) => {
                bimViewer.skybox.active = e;
            });
        // const dataControl = vsf
        //     .add(controls, "fullScreen")
        //     .name("全屏")
        //     .onChange((e: boolean) => bimViewer.activeFullScreen(e));
        // //Other operations control full screen.
        // document.addEventListener("fullscreenchange", () => {
        //     dataControl.setValue(!!document.fullscreenElement);
        // });

        // vsf.add(controls, "sectionPlane")
        //     .name("面剖切")
        //     .onChange((e: boolean) => {
        //         bimViewer.sectionPlanePlugin.active = e;
        //         bimViewer.sectionPlanePlugin.visible = e;
        //     });

        const gridSetting = this._gui.addFolder("地面网格");
        gridSetting
            .add(controls, "grid")
            .name("显示地面网格")
            .onChange((e: boolean) => {
                bimViewer.girdPlugin.setActive(e);
            });
        const position = [0, 0, 0];
        gridSetting
            .add(controls, "positionX")
            .name("X方向偏移量")
            .onChange((value: number) => {
                position[0] = value;
                bimViewer.girdPlugin.setMeshConfig({ position: position });
            });
        gridSetting
            .add(controls, "positionY")
            .name("Y方向偏移量")
            .onChange((value: number) => {
                position[1] = value;
                bimViewer.girdPlugin.setMeshConfig({ position: position });
            });
        gridSetting
            .add(controls, "positionZ")
            .name("Z方向偏移量")
            .onChange((value: number) => {
                position[2] = value;
                bimViewer.girdPlugin.setMeshConfig({ position: position });
            });

        const esf = this._gui.addFolder("效果设置"); // effect settings folder
        const ssf = esf.addFolder("SAO 参数设置"); // sao settings folder
        const sao = viewer.scene.sao;
        ssf.add(controls, "saoEnabled")
            .name("启用 SAO")
            .onChange((e: boolean) => {
                bimViewer.fastNavPlugin.saoEnabled = e;
                viewer.scene.sao.enabled = e;
            });
        ssf.add(controls, "kernelRadius", 10, 500, 10)
            .name("半径(kernelRadius)")
            .onChange((e: number) => {
                sao.kernelRadius = e;
            });
        ssf.add(controls, "intensity", 0, 1, 0.01)
            .name("强度(intensity)")
            .onChange((e: number) => {
                sao.intensity = e;
            });
        ssf.add(controls, "bias", 0, 1, 0.05)
            .name("偏差(bias)")
            .onChange((e: number) => {
                sao.bias = e;
            });
        ssf.add(controls, "scale", 0.01, 5, 0.01)
            .name("缩放(scale)")
            .onChange((e: number) => {
                sao.scale = e;
            });
        ssf.add(controls, "minResolution", 0, 1, 0.01)
            .name("最小精度(minResolution)")
            .onChange((e: number) => {
                sao.minResolution = e;
            });
        ssf.add(controls, "numSamples", 0, 50, 1)
            .name("采样数(numSamples)")
            .onChange((e: number) => {
                sao.numSamples = e;
            });
        ssf.add(controls, "blendCutoff", 0, 1, 0.05)
            .name("混合分界(blendCutoff)")
            .onChange((e: number) => {
                sao.blendCutoff = e;
            });
        ssf.add(controls, "blendFactor", 0, 2, 0.01)
            .name("混合因子(blendFactor)")
            .onChange((e: number) => {
                sao.blendFactor = e;
            });
        ssf.add(controls, "blur")
            .name("高斯模糊(blur)")
            .onChange((e: boolean) => {
                sao.blur = e;
            });
        const lsf = esf.addFolder("光源设置"); // light settings folder
        const lights = Object.values(viewer.scene.lights);
        lights.forEach((light: any) => {
            // eslint-disable-line
            lsf.add(light, "intensity", 0, 2, 0.05)
                .name(`${light.type} 强度`)
                .onChange((e: number) => {
                    light.intensity = e;
                });
        });
        esf.addColor(controls, "backgroundColor")
            .name("背景色")
            .onChange((e: number[] | string) => {
                bimViewer.backgroundColorPlugin.setBackgroundColor(this.datGuiColor2XeokitColor(e));
            });
        esf.add(controls, "pbrEnabled")
            .name("启用 PBR")
            .onChange((e: boolean) => {
                bimViewer.fastNavPlugin.pbrEnabled = e;
                viewer.scene.pbrEnabled = e;
            });
        // esf.add(controls, "xrayed")
        //     .name("X光模式")
        //     .onChange((e: boolean) => {
        //         Object.values(viewer.scene.models).forEach((model: any) => { // eslint-disable-line
        //             model.xrayed = e;
        //         });
        //     });
        esf.add(controls, "edgesEnabled")
            .name("显示轮廓")
            .onChange((e: boolean) => {
                bimViewer.fastNavPlugin.edgesEnabled = e; // don't know why this doesn't refresh scene automatically!
                // as a workaround, still need to call this to update scene
                Object.values(viewer.scene.models).forEach((model: any) => {
                    // eslint-disable-line
                    model.edges = e;
                });
            });
        esf.add(controls, "opacity", 0.0, 1.0, 0.05)
            .name("透明度")
            .onChange((e: number) => {
                this.handleOpacityChange(e);
            });

        const navSetting = this._gui.addFolder("操作设置");
        const navControlCfg = this._navControlCfg;
        navSetting
            .add(navControlCfg, "followPointer")
            .name("鼠标跟随")
            .onChange((e: boolean) => {
                bimViewer.setNavConfig({ followPointer: e });
            });
        navSetting
            .add(navControlCfg, "panRightClick")
            .name("右键平移")
            .onChange((e: boolean) => {
                bimViewer.setNavConfig({ panRightClick: e });
            });
        navSetting
            .add(navControlCfg, "doublePickFlyTo")
            .name("双击缩放至")
            .onChange((e: boolean) => {
                bimViewer.setNavConfig({ doublePickFlyTo: e });
            });

        navSetting
            .add(navControlCfg, "dragRotationRate", 36, 720, 1)
            .name("鼠标旋转灵敏度")
            .onChange((value: number) => {
                bimViewer.setNavConfig({ dragRotationRate: value });
            });
        navSetting
            .add(navControlCfg, "keyboardRotationRate", 30, 360, 1)
            .name("键盘旋转灵敏度")
            .onChange((value: number) => {
                bimViewer.setNavConfig({ keyboardRotationRate: value });
            });
        navSetting
            .add(navControlCfg, "rotationInertia", 0.0, 1.0, 0.05)
            .name("旋转惯性因子")
            .onChange((value: number) => {
                bimViewer.setNavConfig({ rotationInertia: value });
            });

        navSetting
            .add(navControlCfg, "keyboardPanRate", 1, 100, 1)
            .name("键盘平移灵敏度")
            .onChange((value: number) => {
                bimViewer.setNavConfig({ keyboardPanRate: value });
            });
        navSetting
            .add(navControlCfg, "panInertia", 0.0, 1.0, 0.05)
            .name("平移惯性因子")
            .onChange((value: number) => {
                bimViewer.setNavConfig({ panInertia: value });
            });

        navSetting
            .add(navControlCfg, "mouseWheelDollyRate", 30, 300, 1)
            .name("鼠标缩放灵敏度")
            .onChange((value: number) => {
                bimViewer.setNavConfig({ mouseWheelDollyRate: value });
            });
        navSetting
            .add(navControlCfg, "keyboardDollyRate", 10, 100, 1)
            .name("键盘缩放灵敏度")
            .onChange((value: number) => {
                bimViewer.setNavConfig({ keyboardDollyRate: value });
            });
        navSetting
            .add(navControlCfg, "dollyInertia", 0.0, 1.0, 0.05)
            .name("缩放惯性因子")
            .onChange((value: number) => {
                bimViewer.setNavConfig({ dollyInertia: value });
            });

        navSetting
            .add(navControlCfg, "dollyMinSpeed", 0.01, 1.0, 0.01)
            .name("缩放最小速度")
            .onChange((value: number) => {
                bimViewer.setNavConfig({ dollyMinSpeed: value });
            });
    }

    open() {
        this._gui && this._gui.open();
    }

    close() {
        this._gui && this._gui.close();
    }

    destroy() {
        this._bimViewer = undefined;
        this._gui && this._gui.destroy();
        this._gui = undefined;
        this._unwatchViewpointsVisibility();
        this._unwatchViewpointsVisibility = undefined;
        this._unwatchAnnotationsVisibility();
        this._unwatchAnnotationsVisibility = undefined;
    }

    /**
     * We shouldn't simply change model.opacity when opacity is set, because
     * 1. An entity could already has an opacity (e.g., a window has opacity=0.2)
     * 2. An entity's mesh.transparent can be false, while entity's opacity < 1, in this case, we should revert transparent to false when opacity is set to 1
     */
    private handleOpacityChange(opacity: number) {
        // const bimViewer = this._bimViewer;
        // if (!bimViewer) {
        //     return;
        // }
        // const viewer = bimViewer.viewer;
        // const originalOpacitySettings = this._originalOpacitySettings;
        // let originalOpacitySettingsForModelExists = false;
        // Object.values(viewer.scene.models).forEach((model: any) => { // eslint-disable-line
        //     originalOpacitySettingsForModelExists = !!originalOpacitySettings[model.id]; // only cache once for a model
        //     if (!originalOpacitySettingsForModelExists) {
        //         originalOpacitySettings[model.id] = { nodes: {}, meshes: {} /*, performanceMeshes: {}*/ };
        //     }
        //     // function to cache opacity settings
        //     const tryCacheOpacitySettings = (nodeOrMesh: any) => { // eslint-disable-line
        //         if (nodeOrMesh.opacity >= 1) {
        //             return;
        //         }
        //         const obj: { opacity: number; transparent?: boolean } = { opacity: nodeOrMesh.opacity };
        //         if (nodeOrMesh.transparent !== undefined) {
        //             obj.transparent = nodeOrMesh.transparent;
        //         }
        //         if (nodeOrMesh instanceof Node) {
        //             originalOpacitySettings[model.id].nodes[nodeOrMesh.id] = obj;
        //         } else if (nodeOrMesh instanceof Mesh) {
        //             originalOpacitySettings[model.id].meshes[nodeOrMesh.id] = obj;
        //         } else {
        //             // could be PermormanceNode, but we cannot check this type as it is not exported!
        //             originalOpacitySettings[model.id].nodes[nodeOrMesh.id] = obj;
        //         }
        //         if (Array.isArray(nodeOrMesh.meshes)) {
        //             const index: number[] = [];
        //             for (let i = 0; i < nodeOrMesh.meshes.length; ++i) {
        //                 if (!nodeOrMesh.meshes[i]._transparent) {
        //                     index.push(i);
        //                 }
        //             }
        //             if (index.length > 0) {
        //                 originalOpacitySettings[model.id].nodes[nodeOrMesh.id].meshIndexNotTransparent = index;
        //             }
        //         }
        //     };
        //     // function to set/revert opacity settings
        //     const trySetOpacitySettings = (nodeOrMesh: any) => { // eslint-disable-line
        //         const node = originalOpacitySettings[model.id].nodes[nodeOrMesh.id] as any; // eslint-disable-line
        //         const mesh = originalOpacitySettings[model.id].meshes[nodeOrMesh.id];
        //         // const performanceMesh = originalOpacitySettings[model.id].performanceMeshes[nodeOrMesh.id];
        //         if (node) {
        //             // when opacity is 1, set 'transparent' back to false if necessary
        //             if (opacity >= 1) {
        //                 if (node.transparent !== undefined) {
        //                     nodeOrMesh.transparent = node.transparent;
        //                 }
        //                 if (Array.isArray(node.meshIndexNotTransparent) && Array.isArray(nodeOrMesh.meshes)) {
        //                     node.meshIndexNotTransparent.forEach((i: number) => {
        //                         nodeOrMesh.meshes[i]._transparent = false;
        //                     });
        //                 }
        //             }
        //             nodeOrMesh.opacity = node.opacity * opacity;
        //         } else if (mesh) {
        //             // when opacity is 1, set 'transparent' back to false if necessary
        //             if (opacity >= 1) {
        //                 if (mesh.transparent !== undefined) {
        //                     nodeOrMesh.transparent = mesh.transparent;
        //                 }
        //             }
        //             nodeOrMesh.opacity = mesh.opacity * opacity;
        //         } else {
        //             nodeOrMesh.opacity = opacity;
        //         }
        //     };
        //     if (!originalOpacitySettingsForModelExists) {
        //         // for Node/Mesh
        //         if (Array.isArray(model.children)) {
        //             model.children.forEach((nodeOrMesh: any) => { // eslint-disable-line
        //                 tryCacheOpacitySettings(nodeOrMesh);
        //             });
        //         }
        //         // for PerformancedModel's PerformancedNode
        //         if (model._nodes) {
        //             Object.values(model._nodes).forEach((nodeOrMesh: any) => { // eslint-disable-line
        //                 tryCacheOpacitySettings(nodeOrMesh);
        //             });
        //         }
        //     }
        //     if (Array.isArray(model.children)) {
        //         model.children.forEach((nodeOrMesh: any) => { // eslint-disable-line
        //             trySetOpacitySettings(nodeOrMesh);
        //         });
        //     }
        //     if (model._nodes) {
        //         Object.values(model._nodes).forEach((nodeOrMesh: any) => { // eslint-disable-line
        //             trySetOpacitySettings(nodeOrMesh);
        //         });
        //     }
        // });
        // if (opacity >= 1) {
        //     // this doesn't really fix the issue described upper
        //     viewer.scene.render(true);
        // }
    }

    // converts datgui color to xeokit color
    datGuiColor2XeokitColor(color: number[] | string) {
        if (Array.isArray(color) && color.length >= 3) {
            return [color[0] / 255.0, color[1] / 255.0, color[2] / 255.0];
        } else if (typeof color === "string") {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
            if (result) {
                const r = parseInt(result[1], 16);
                const g = parseInt(result[2], 16);
                const b = parseInt(result[3], 16);
                return [r, g, b];
            }
        }
        return [0, 0, 0]; // use default color
    }
}
