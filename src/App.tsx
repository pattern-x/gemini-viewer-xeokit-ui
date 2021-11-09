import React from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { Main } from "./view/Main";
import { ProjectView } from "./view/ProjectView";

export interface PathParam {
    projectId: string;
}

export const App = () => {
    return (
        <Router>
            <Switch>
                <Route exact path="/" component={Main}></Route>
                <Route exact path="/projects" component={Main}></Route>
                <Route path={"/projects/:projectId"} component={ProjectView}></Route>
            </Switch>
        </Router>
    );
};
