import React, { useEffect, useState } from "react";
import { Card } from "antd";
import { Project } from "../constant/Project";
import { ProjectCard } from "../components/ProjectCard";

export const Main = () => {
    const [projects, setProjects] = useState<Project[]>([]);

    useEffect(() => {
        fetch("/config/projects.json")
            .then((res) => res.json())
            .then((res) => setProjects(res))
            .catch((err) => console.error(err));
    }, []);

    return (
        <div>
            <Card title="示例项目" style={{ width: "100%", margin: 15 }}>
                <div style={{ display: "flex", flexDirection: "row" }}>
                    {projects.map((project) => {
                        return <ProjectCard key={project.id} project={project} />;
                    })}
                </div>
            </Card>
            <Card title="我的项目" style={{ width: "100%", margin: 15 }}></Card>
        </div>
    );
};
