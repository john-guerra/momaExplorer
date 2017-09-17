import React from "react";
import {
    BrowserRouter as Router,
    Route,
    Switch
  } from "react-router-dom";

import App from "./App";
import Faceted from "./Faceted";
import NotFound from "./NotFound";

const Routes = (props) => (
  <Router {...props}>
    <Switch>
      <Route exact path="/" component={App} />
      <Route path="/faceted" component={Faceted} />
      <Route component={NotFound} />
    </Switch>
  </Router>
);

export default Routes;