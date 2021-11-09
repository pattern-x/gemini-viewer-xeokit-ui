import React, { ReactElement, useState } from "react";
import { Button, Card, Typography } from "antd";
import { CloseOutlined } from "@ant-design/icons";

const { Title } = Typography;

export interface BasePanelProps {
    title: string;
    show?: boolean;
    children?: ReactElement;
    onClose: any;
    actions?: ReactElement;
}

export const BasePanel: React.FC<BasePanelProps> = ({ title, show, children, actions, onClose }): ReactElement => {
    const [panelPosition, setPanelPosition] = useState<[number, number]>([10, 100]);
    const [dragStartCoord, setDragStartCoord] = useState<[number, number]>([0, 0]);

    return (
        <>
            {show && (
                <Card
                    className="base-panel"
                    headStyle={{ cursor: "move" }}
                    title={
                        <div draggable="true">
                            <Title level={4} style={{ marginBottom: 0 }}>
                                {title}
                            </Title>
                        </div>
                    }
                    size="small"
                    extra={<Button type="text" icon={<CloseOutlined />} onClick={onClose} />}
                    style={{ width: 300, left: panelPosition[0], top: panelPosition[1] }}
                    bordered
                    onDragStart={(e) => {
                        setDragStartCoord([e.clientX, e.clientY]);
                    }}
                    onDragEnd={(e) => {
                        setPanelPosition([
                            panelPosition[0] + e.clientX - dragStartCoord[0],
                            panelPosition[1] + e.clientY - dragStartCoord[1],
                        ]);
                    }}
                    bodyStyle={{ padding: 0, display: "flex", flexDirection: "column" }}
                >
                    <div style={{ display: "flex", justifyContent: "right" }}>{actions}</div>
                    {children}
                </Card>
            )}
        </>
    );
};
