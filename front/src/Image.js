import React, {Component} from "react";
import PropTypes from "prop-types";

import "./Image.css";

class Image extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (<div className="Image">
      <img src={this.props.image.ThumbnailURL} alt={this.props.image.Title + " thumbnail"}/>
    </div>);
  }
}

Image.propTypes = {
  image: PropTypes.object.isRequired
};

export default Image;