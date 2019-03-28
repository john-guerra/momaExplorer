import React, {Component} from "react";
import PropTypes from "prop-types";

import * as d3 from "d3";

import navio from "./navio/navio.js";

import "./NavioComponent.css";

class NavioComponent extends Component {
  componentDidMount() {
    console.log("NavioComponent did mount");
    this.nn =  navio(d3.select(this.target), 620)
      .id("ObjectID")
      .updateCallback(this.props.updateCallback)
      .addTextAttrib("Title")
      .addSequentialAttrib("Height (cm)",
        d3.scalePow()
          .exponent(0.25)
          .range([d3.interpolatePurples(0), d3.interpolatePurples(1)]))
      .addSequentialAttrib("Width (cm)",
        d3.scalePow()
          .exponent(0.25)
          .range([d3.interpolatePurples(0), d3.interpolatePurples(1)]))
      .addDateAttrib("date")
      // .addSequentialAttrib("Date")
      // .addSequentialAttrib("DateAcquired")
      .addBooleanAttrib("hasImage")
      .addCategoricalAttrib("Department")
      .addCategoricalAttrib("Classification")
      .addCategoricalAttrib("Medium")
      .addCategoricalAttrib("Gender")
      .addCategoricalAttrib("Nationality", d3.scaleOrdinal(d3.schemeSet3.concat(d3.schemeSet2).concat(d3.schemeSet1)));

    if (this.props.data) {
      this.nn.data(this.props.data);
    }

  }
  // componentDidUpdate() {
  //   if (this.props.data) {
  //     this.nn.data(this.props.data);
  //   }
  // }

  componentWillUpdate(newProps) {
    console.log("NavioComponent will update data.length=" + newProps.data.length);
    if (newProps.data.length !== this.props.data.length)
      this.nn.data(newProps.data);
  }

  render() {
    console.log("NavioComponent render" );
    return (
      <div
        className="NavioComponent"
        ref={(target) => this.target = target }></div>);
  }
}

NavioComponent.propTypes = {
  data: PropTypes.array.isRequired,
  updateCallback: PropTypes.func.isRequired
};

export default NavioComponent;