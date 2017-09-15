import React, { Component } from "react";

import "./App.css";
import ImageGallery from "./ImageGallery.js";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      data:[]
    };
  }

  componentDidMount() {
    fetch("/artwork")
      .then((res) => {
        return res.json();
      }).then((data) => {
        console.log(data);
        this.setState({
          data:data
        });
      });
  }


  render() {
    return (
      <div className="App">
        <ImageGallery images={this.state.data}></ImageGallery>
      </div>
    );
  }
}

export default App;
