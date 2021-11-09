import Icon, { DeleteOutlined, EyeInvisibleOutlined, EyeOutlined, PlusOutlined } from "@ant-design/icons";
import React, { ReactElement, useEffect, useMemo, useRef, useState } from "react";
import { Annotation, AnnotationDBParam } from "./../constant/Annotation";
import { BasePanel } from "./BasePanel";
import { BimViewer, math, ToolbarMenuId } from "@pattern-x/gemini-viewer";
import { Button, Form, Input, List, message, Modal } from "antd";
import { deleteAnnotation, fetchAnnotations, insertAnnotation, setAnnotationActive } from "../store/AnnotationsSlice";
import { get, remove, size, slice, some } from "lodash";
import { PathParam } from "../App";
import { prefix } from "../utils/commonUtils";
import { ReactComponent as MoonNightSvg } from "../assets/svg/moon-night.svg";
import { ReactComponent as MoonSvg } from "../assets/svg/moon.svg";
import { RootState } from "../store/Store";
import { useAppDispatch, useAppSelector } from "../store/Hooks";
import { useParams } from "react-router";

const { TextArea } = Input;

const PREFIX_ID = "Annotation";
const PREFIX_GLYPH = "A";

const prefixId = prefix(PREFIX_ID);
const prefixGlyph = prefix(PREFIX_GLYPH);

interface AnnotationsProps {
    bimViewer?: BimViewer;
}

export const Annotations: React.FC<AnnotationsProps> = ({ bimViewer }): ReactElement => {
    const { projectId } = useParams<PathParam>();
    const active = useAppSelector((state: RootState) => state.annotations.active);
    const annotationData = useAppSelector((state: RootState) => state.annotations.data);
    const dispatch = useAppDispatch();

    const [annotationsVisible, setAnnotationsVisible] = useState(true);
    const [annotationsOccludable, setAnnotationsOccludable] = useState(true);
    const [enableCreation, setEnableCreation] = useState(false);

    const [annotationModalVisible, setAnnotationModalVisible] = useState(false);
    const [worldPos, setWorldPos] = useState<number[]>([]);

    const mouseClickEvent = useRef();
    const bimViewerRef = useRef(bimViewer);
    bimViewerRef.current = bimViewer;
    const annoInstances = useRef<any[]>([]);

    const [form] = Form.useForm();

    useEffect(() => {
        active && dispatch(fetchAnnotations(projectId));
    }, [projectId, active, dispatch]);

    useEffect(() => {
        if (bimViewerRef.current && size(annoInstances.current) === 0) {
            const plugin = bimViewerRef.current.annotationsPlugin;
            // click on marker to show/hide a label
            plugin.on("markerClicked", (anno: any) => {
                anno.setLabelShown(!anno.getLabelShown());
            });

            const annos = annotationData.map((annotation: Annotation) => {
                const params: Annotation = {
                    ...annotation,
                    markerShown: true,
                    labelShown: false,
                    occludable: false,
                };
                return bimViewerRef.current!.createAnnotation(params);
            });
            annoInstances.current = annos;
        }
    }, [annotationData]);

    const handleAnnotationCreate = () => {
        // click on entity to create an annotation
        mouseClickEvent.current = bimViewer?.viewer.scene.input.on("mouseclicked", pickPoint);
        message.info("单击图中的点添加批注");
        setEnableCreation(true);
    };

    const pickPoint = (coords: [number, number]) => {
        const pickResult = bimViewer?.viewer.scene.pick({
            canvasPos: coords,
            pickSurface: true, // This causes picking to find the intersection point on the entity
        });

        if (!pickResult?.entity) {
            console.log("[UI] (Annotation) scene pick failed.");
            message.warn("拾取失败，请重新选择一个点");
            return;
        }

        setWorldPos(slice(pickResult.worldPos, 0, 3) || slice(math.getAABB3Center(pickResult.entity.aabb), 0, 3));
        setAnnotationModalVisible(true);
        bimViewer?.viewer.scene.input.off(mouseClickEvent.current);
    };

    const getUniqulCounter = (i = 1): number => {
        const exists = some(
            annotationData,
            (annotation: Annotation) => annotation.id === prefixId(i) || annotation.values.glyph === prefixGlyph(i)
        );
        return exists ? getUniqulCounter(i + 1) : i;
    };

    const createAnnotation = (title: string, description: string, worldPos: number[]) => {
        const viewer = bimViewer?.viewer;

        const uniqId = getUniqulCounter();
        const newAnnotationData: AnnotationDBParam = {
            projectId,
            id: prefixId(uniqId), // the id in viewer.scene.components[id]
            worldPos: worldPos,
            occludable: annotationsOccludable, // Optional, default is true
            markerShown: true, // Optional, default is true
            labelShown: true, // Optional, default is true
            eye: [...viewer.camera.eye] as number[],
            look: [...viewer.camera.look] as number[],
            up: [...viewer.camera.up] as number[],
            values: {
                markerBGColor: "red",
                labelBGColor: "white",
                glyph: prefixGlyph(uniqId),
                title,
                description,
            },
            markerHTML: "<div class='annotation-marker' style='background-color: {{markerBGColor}};'>{{glyph}}</div>",
            labelHTML: `<div class='annotation-label' style='background-color: {{labelBGColor}};'>\
                <div class='annotation-title'>{{title}}</div>\
                <div class='annotation-desc'>{{description}}</div>\
                </div>`,
        };
        dispatch(insertAnnotation(newAnnotationData));

        const params: AnnotationDBParam = {
            ...newAnnotationData,
            markerShown: true,
            labelShown: true,
            occludable: false,
        };
        const anno = bimViewer!.createAnnotation(params);
        annoInstances.current.push(anno);
    };

    const toggleAnnotationsVisibility = () => {
        setAnnotationsVisible(!annotationsVisible);
        annoInstances.current.forEach((anno: any) => {
            anno.setMarkerShown(!annotationsVisible);
        });
    };

    const toggleAnnotationsOccludable = () => {
        setAnnotationsOccludable(!annotationsOccludable);
        annoInstances.current.forEach((anno: any) => {
            anno.occludable = !annotationsOccludable;
        });
        // TODO: need to refresh canvas to take effect, but following method doesn't work!
        // this.bimViewer?.viewer.scene.render(true);
    };

    const MoonIcon = (props: any) => <Icon component={MoonSvg} {...props} />;

    const MoonNightIcon = (props: any) => <Icon component={MoonNightSvg} {...props} />;

    const getActions = () => (
        <>
            <Button
                type="link"
                icon={annotationsVisible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                onClick={toggleAnnotationsVisibility}
                title={annotationsVisible ? "点击隐藏所有批注" : "点击显示所有批注"}
            />
            <Button
                type="link"
                icon={annotationsOccludable ? <MoonIcon /> : <MoonNightIcon />}
                onClick={toggleAnnotationsOccludable}
                title={annotationsOccludable ? "点击使得所有批注不可被遮挡" : "点击使得所有批注可被遮挡"}
            />
            <Button
                type="link"
                icon={<PlusOutlined />}
                onClick={handleAnnotationCreate}
                title="添加批注"
                disabled={enableCreation}
            />
        </>
    );

    const AnnotationContent = useMemo(() => {
        const handleAnnotationDelete = (record: Annotation) => {
            if (!bimViewer) {
                return;
            }

            bimViewer.destroyAnnotation(record.id);
            remove(annoInstances.current, { id: record.id });
            dispatch(deleteAnnotation(record));
        };

        const handleAnnotationItemClick = (record: Annotation) => {
            if (!bimViewer) {
                return;
            }

            annoInstances.current.forEach((annotation: any) => {
                if (annotation.id === record.id) {
                    bimViewer.viewer.cameraFlight.flyTo(annotation, () => {
                        console.log(`[UI] Flied to annotation "${record.values.title}"`);
                    });

                    annotation.setLabelShown(true);
                    annotation.occludable = false; // make it not occludable, thus make sure user can see it
                } else {
                    annotation.setLabelShown(false); // hide label for all others
                    annotation.occludable = annotationsOccludable; // allign occludable property
                }
            });
        };

        return (
            <List
                className="annotation-list"
                size="small"
                style={{ width: "100%", overflow: "auto", height: "200px" }}
                itemLayout="horizontal"
                dataSource={annotationData}
                renderItem={(record: Annotation) => (
                    <List.Item
                        actions={[
                            <Button
                                type="link"
                                icon={<DeleteOutlined />}
                                onClick={() => {
                                    handleAnnotationDelete(record);
                                }}
                                title="删除"
                            />,
                        ]}
                        onClick={() => {
                            handleAnnotationItemClick(record);
                        }}
                        title={"Id: " + get(record, "id")}
                    >
                        {`(${get(record, "values.glyph")}) ${get(record, "values.title")}`}
                    </List.Item>
                )}
            />
        );
    }, [annotationData, annotationsOccludable, bimViewer, dispatch]);

    const handleCreateAnnotationSubmit = () => {
        form.validateFields()
            .then(({ title, description }) => {
                createAnnotation(title, description, worldPos);
                setAnnotationModalVisible(false);
                form.resetFields();
                setEnableCreation(false);
            })
            .catch((info) => {
                console.log("[UI] Validate Failed:", info);
            });
    };

    const handleClose = () => {
        bimViewer?.toolbar.controllers[ToolbarMenuId.Annotation].fire("click", undefined);
        dispatch(setAnnotationActive(false));
    };

    return (
        <>
            <Modal
                title="新增批注"
                visible={annotationModalVisible}
                maskClosable={false}
                onCancel={() => {
                    setAnnotationModalVisible(false);
                    setEnableCreation(false);
                }}
                onOk={handleCreateAnnotationSubmit}
                okText="确认"
                cancelText="取消"
                zIndex={99999}
            >
                <Form labelCol={{ span: 4 }} wrapperCol={{ span: 18 }} form={form}>
                    <Form.Item name="title" label="标题" rules={[{ required: true, message: "批注标题不能为空!" }]}>
                        <Input placeholder="请输入批注标题" />
                    </Form.Item>
                    <Form.Item name="description" label="内容" rules={[{ required: true, message: "批注内容不能为空" }]}>
                        <TextArea placeholder="请输入批注内容"></TextArea>
                    </Form.Item>
                </Form>
            </Modal>

            <BasePanel title={"批注"} show={active} onClose={handleClose} actions={getActions()}>
                {AnnotationContent}
            </BasePanel>
        </>
    );
};
