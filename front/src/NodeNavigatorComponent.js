import React, {Component} from "react";
import PropTypes from "prop-types";
import NodeNavigator from "./NodeNavigator.js";

let d3 = require("d3");
let d3_chromatic = require("d3-scale-chromatic");

class NodeNavigatorComponent extends Component {
  componentDidMount() {
    console.log("NodeNavigatorComponent did mount");
    this.nn = new NodeNavigator(this.target, 600)
      .id("ObjectID")
      .updateCallback(this.props.updateCallback)
      .addSequentialAttrib("Height (cm)",
        d3.scalePow()
          .exponent(0.25)
          .range([d3_chromatic.interpolatePurples(0), d3_chromatic.interpolatePurples(1)]))
      .addSequentialAttrib("Width (cm)",
        d3.scalePow()
          .exponent(0.25)
          .range([d3_chromatic.interpolatePurples(0), d3_chromatic.interpolatePurples(1)]))
      .addSequentialAttrib("date")
      // .addSequentialAttrib("Date")
      // .addSequentialAttrib("DateAcquired")
      .addCategoricalAttrib("hasImage", d3.scaleOrdinal().range(["white", "rgb(141,221,123)"]))
      .addCategoricalAttrib("Department")
      .addCategoricalAttrib("Classification")
      .addCategoricalAttrib("Gender")
      .addCategoricalAttrib("Nationality");

    if (this.props.data) {
      this.nn.data(this.props.data);
    }
  }

  componentWillUpdate(newProps) {
    console.log("NodeNavigatorComponent will update data.length=" + newProps.data.length);
    if (newProps.data.length !== this.props.data.length)
      this.nn.data(newProps.data);
  }

  render() {
    console.log("NodeNavigatorComponent render" );
    return (
      <div
        className="NodeNavigatorComponent"
        ref={(target) => this.target = target }></div>);
  }
}

NodeNavigatorComponent.propTypes = {
  data: PropTypes.array.isRequired,
  updateCallback: PropTypes.func.isRequired
};

export default NodeNavigatorComponent;