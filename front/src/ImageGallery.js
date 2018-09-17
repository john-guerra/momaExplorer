import React, {Component} from "react";
import PropTypes from "prop-types";

import Image from "./Image.js";

class ImageGallery extends Component {
  constructor(props) {
    super(props);
  }

  renderImages() {
    return this.props.images.map((image) => {
      return <Image key={image.id} image={image}></Image>;
    });
  }

  render() {
    return (
      <div className="imageGallery">
        {this.renderImages()}
      </div>
    );
  }
}

ImageGallery.propTypes = {
  images: PropTypes.array.isRequired
};

export default ImageGallery;