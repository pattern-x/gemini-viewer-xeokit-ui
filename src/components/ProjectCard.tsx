import React from "react";
import { Card } from "antd";
import { Project } from "../constant/Project";
import { useHistory } from "react-router-dom";
const { Meta } = Card;

interface ProjectCardProps {
    project: Project;
}

export const ProjectCard = ({ project }: ProjectCardProps) => {
    const history = useHistory();
    const { id, name, thumbnail } = project;
    const handleClick = () => {
        history.push(`/projects/${id}`);
    };
    return (
        <div onClick={handleClick}>
            <Card
                hoverable
                style={{ width: 300, marginRight: 20 }}
                cover={
                    <div
                        style={{
                            height: 180,
                            backgroundImage: `url(${thumbnail})`,
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "center",
                            backgroundSize: "cover",
                            boxShadow: "0px 0px 1px rgba(0, 0, 0, 0.3)",
                        }}
                    />
                }
            >
                <Meta title={`项目名称：${name}`} description={`项目Id：${id}`} />
            </Card>
        </div>
    );
};
