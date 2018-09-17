import React, {Component} from "react";
import PropTypes from "prop-types";

import "./Faceted.css";

// let d3 = require("./d3.v3.min.js");

class Faceted extends Component {
  // constructor(props) {
  //   super(props);
  // }

  render() {
    return (<div className="Faceted">Faceted</div>);
  }
}

Faceted.propTypes = {
  data: PropTypes.array.isRequired,
  updateCallback: PropTypes.func.isRequired
};

export default Faceted;