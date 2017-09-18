import express from "express";

import sqlite3 from "sqlite3";


const router = express.Router();

/* GET index page. */
router.get("/artwork", (req, res) => {


  console.log("artwork");
  var db = new sqlite3.Database("./moma_artwork.sqlite3");
  db.all("SELECT * from moma_artworks", [], (err, data) => {
    if (err) {
      console.log(err);
      return;
    }
    console.log("Got " + data.length);
    res.json(data);
  });
  db.close();
});

export default router;
