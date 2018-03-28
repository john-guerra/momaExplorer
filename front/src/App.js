import React, { Component } from "react";
import {
  BrowserRouter as Router,
  Route,
  Switch
} from "react-router-dom";

import "./App.css";
// import ImageGallery from "./ImageGallery.js";
import Gallery from "react-grid-gallery";
import NavioComponent from "./NavioComponent.js";
import Faceted from "./Faceted";



var d3 = require("d3");

function convert(data) {
  return data.map((image) => {
    return {
      src : image.ThumbnailURL,
      thumbnail : image.ThumbnailURL,
      thumbnailWidth: 320,
      thumbnailHeight: 174,
      caption : image.Title
    };
  });
}

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      data:[],
      images:[]
    };

  }

  componentDidMount() {
    d3.csv("./Artworks_less_columns.csv", (err, data) => {
      if (err) throw err;
      const parseDate = d3.timeParse("%Y-%m-%d");
      data.forEach((row) => {
        row["Height (cm)"] = +row["Height (cm)"];
        row["Width (cm)"] = +row["Width (cm)"];
        row["DateAcquired"] = parseDate(row["DateAcquired"]);
        row["hasImage"] = row.ThumbnailURL ? true : false;
        row.date = row.Date ? +(row.Date.replace( /^\D+/g, "").slice(0,4)) : row.Date;
        row.date = !isNaN(row.date) && row.date>1700 ? row.date : null;
      });
      this.setState({
        images:convert(data.slice(0,51)),
        // data:d3.range(20).reduce((p) => p.concat(data),[])
        data:data
      });
    });
    // fetch("http://localhost:8080/Artworks.csv.gz")
    //   .then((res) => {
    //     return res.json();
    //   }).then((data) => {
    //     const parseDate = d3.timeParse("%Y-%m-%d");
    //     data.forEach((row) => {
    //       row["Height (cm)"] = +row["Height (cm)"];
    //       row["Width (cm)"] = +row["Width (cm)"];
    //       row["DateAcquired"] = parseDate(row["DateAcquired"]);

    //       row.date = row.Date ? +(row.Date.replace( /^\D+/g, "").slice(0,4)) : row.Date;
    //       row.date = !isNaN(row.date) && row.date>1700 ? row.date : null;
    //     });
    //     this.setState({
    //       images:convert(data.slice(0,50)),
    //       data:d3.range(1).reduce((p) => p.concat(data),[])
    //     });
    //   });
  }

  updateCallback(filteredData) {
    this.setState({
      images:convert(filteredData.slice(0,51))
    });
  }

  render() {
    console.log("Render App");
    return (
      <div className="App">
        {//<ImageGallery images={this.state.data}></ImageGallery>
        }
        <h1>Node Navigator: MoMA Collection</h1>
        {this.state.data.length===0 ?
          <h3>Please wait while we download 130k records</h3>
          :
          <div>
            <NavioComponent
              data={this.state.data}
              updateCallback={this.updateCallback.bind(this)}>
            </NavioComponent>
            {/*
            <Router >
              <Switch>
                <Route path="./" render={() =>
                  <NavioComponent
                    data={this.state.data}
                    updateCallback={this.updateCallback.bind(this)}>
                  </NavioComponent>

                } />
                <Route path="./faceted" render={() =>
                  <Faceted
                    data={this.state.data}
                    updateCallback={this.updateCallback.bind(this)}>
                  </Faceted>
                } />
              </Switch>
            </Router>
            */}
            <Gallery images={this.state.images}/>
          </div>

        }
        <div className="footer">
          <p> All the images and data is property of the <a href="https://github.com/MuseumofModernArt/collection">Museum of Modem Art of New York</a> that was released under a CC0 license.</p>
        </div>

      </div>
    );
  }
}

export default App;
