import React, {Component} from "react";
import PropTypes from "prop-types";

import * as d3 from "d3";
import * as d3ScaleChromatic from "d3-scale-chromatic";
import navio from "navio";

import "./NavioComponent.css";

class NavioComponent extends Component {
  componentDidMount() {
    console.log("NavioComponent did mount");
    this.nn =  navio(d3.select(this.target), 590)
      .id("ObjectID")
      .updateCallback(this.props.updateCallback)
      .addSequentialAttrib("Height (cm)",
        d3.scalePow()
          .exponent(0.25)
          .range([d3ScaleChromatic.interpolatePurples(0), d3ScaleChromatic.interpolatePurples(1)]))
      .addSequentialAttrib("Width (cm)",
        d3.scalePow()
          .exponent(0.25)
          .range([d3ScaleChromatic.interpolatePurples(0), d3ScaleChromatic.interpolatePurples(1)]))
      .addSequentialAttrib("date")
      // .addSequentialAttrib("Date")
      // .addSequentialAttrib("DateAcquired")
      .addCategoricalAttrib("hasImage", d3.scaleOrdinal().range(["white", "rgb(141,221,123)"]))
      .addCategoricalAttrib("Department")
      .addCategoricalAttrib("Classification")
      .addCategoricalAttrib("Medium")
      .addCategoricalAttrib("Gender")
      .addCategoricalAttrib("Nationality");

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