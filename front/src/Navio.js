/* global d3, Navio, crossfilter */
var d3 = require("d3");
//eleId must be the ID of a context element where everything is going to be drawn
function Navio(eleId, h) {
  "use strict";
  var nn = this,
    data = [], //Contains the original data attributes
    dataIs = [], //Contains only the indices to the data, is an array of arrays, one for each level
    dData = d3.map(), // A hash for the data
    dDimensions = d3.map(),
    dSortBy = d3.map(), //contains which attribute to sort by on each column
    dBrushes = d3.map(),
    yScales =[],
    xScale,
    x,
    colScales = d3.map(),
    levelScale,
    canvas,
    context,
    // Taken from d3.chromatic https://github.com/d3/d3-scale-chromatic/blob/master/src/sequential-single/Blues.js
    defaultColorRange = ["#deebf7", "#2171b5"],
    visibleColorRange = ["white", "#b5cf6b"],
    fmt = d3.format(",.0d"),
    x0=0,
    y0=100,
    id = "__seqId",
    updateCallback = function () {};

  nn.margin = 10;
  nn.attribWidth = 15;
  nn.levelsSeparation = 40;
  nn.divisionsColor = "white";
  nn.levelConnectionsColor = "rgba(205, 220, 163, 0.5)";
  nn.divisionsThreshold = 3;
  nn.attribFontSize = 13;
  nn.attribFontSizeSelected = 32;

  nn.startColor = "white";
  nn.endColor = "red";
  nn.legendFont = "14px Arial";
  nn.linkColor = "#2171b5";
  // nn.linkColor = "rgba(0,0,70,0.9)";



  d3.select(eleId)
    // .attr("width", 150)
    .style("height", h + "px")
    .style("float", "left")
    .attr("class", "Navio")
    .append("div")
      .style("float", "left")
      .attr("id", "Navio")
      .style("position", "relative");
  d3.select(eleId)
    .select("#Navio")
    .append("canvas");
  var svg = d3.select(eleId)
    .select("#Navio")
    .append("svg")
      .style("overflow", "visible")
      .style("position", "absolute")
      .style("z-index", 99)
      .style("top", 0)
      .style("left", 0);
  svg.append("g")
    .attr("class", "attribs");

  svg.append("g")
    .attr("class", "tooltip")
    .style("text-shadow", "0 1px 0 #fff, 1px 0 0 #fff, 0 -1px 0 #fff, -1px 0 0 #fff")
    .attr("transform", "translate(-100,-10)")
    .append("text")
      .attr("x", 0)
      .attr("y", 0)
      .style("pointer-events", "none")
      .style("font-family", "sans-serif")
      .style("font-size", "16pt");

  svg.select(".tooltip > text")
    .append("tspan")
      .attr("class", "tool_id")
      .attr("x", 0)
      .attr("dy", "1.2em");

  svg.select(".tooltip > text")
    .append("tspan")
      .attr("class", "tool_value")
      .style("font-weight", "bold")
      .attr("x", 0)
      .attr("dy", "1.2em");

  svg.append("g")
    .attr("id", "closeButton")
    .style("fill", "white")
    .style("stroke", "black")
    .style("display", "none")
    .append("path")
    .call(function (sel) {
      var crossSize = 7,
        path = d3.path(); // Draw a cross and a circle
      path.moveTo(0, 0);
      path.lineTo(crossSize, crossSize);
      path.moveTo(crossSize, 0);
      path.lineTo(0, crossSize);
      path.moveTo(crossSize*1.2 + crossSize/2, crossSize/2);
      path.arc(crossSize/2, crossSize/2, crossSize*1.2, 0, Math.PI*2);
      sel.attr("d", path.toString());
    })
    .on("click", function () {
      deleteOneLevel();
    });

  xScale = d3.scaleBand()
    // .rangeBands([0, nn.attribWidth], 0.1, 0);
    .range([0, nn.attribWidth])
    .round(true)
    .paddingInner(0.1)
    .paddingOuter(0);
  levelScale = d3.scaleBand()
    .round(true);
  colScales = d3.map();

  x = function (val, level) {
    return levelScale(level) + xScale(val);
  };

  canvas = d3.select(eleId).select("canvas").node();
  // canvas.style.position = "absolute";
  canvas.style.top = canvas.offsetTop + "px";
  canvas.style.left = canvas.offsetLeft + "px";
  // canvas.style.width =  "150px";
  canvas.style.height = h + "px";

  context = canvas.getContext("2d");

  context.globalCompositeOperation = 'source-over';
  // context.strokeStyle = "rgba(0,100,160,1)";
  // context.strokeStyle = "rgba(0,0,0,0.02)";



  function invertOrdinalScale(scale, x) {
    // Taken from https://bl.ocks.org/shimizu/808e0f5cadb6a63f28bb00082dc8fe3f
    // custom invert function
    var domain = scale.domain();
    var range = scale.range();
    var qScale = d3.scaleQuantize().domain(range).range(domain);

    return qScale(x);
  }

  function nnOnClickLevel(d) {
    console.log("click " + d);
    var before = performance.now();
    dataIs[d.level] = dataIs[d.level].sort(function (a, b) {
      return d3.ascending(data[a][d.attrib], data[b][d.attrib]);
    });
    dataIs[d.level].forEach(function (row,i) { data[row].__i[d.level] = i; });
    var after = performance.now();
    console.log("Click sorting " + (after-before) + "ms");
    dSortBy.set(d.level, d.attrib);
    nn.updateData(dataIs, colScales, d.level);
  }

  function getAttribs(obj) {
    var attr;
    dDimensions = d3.map();
    for (attr in obj) {
      if (obj.hasOwnProperty(attr)) {
        dDimensions.set(attr, true);
      }
    }
  }

  function drawItem(item, level) {
    var attrib, i, y ;

    for (i = 0; i < dDimensions.keys().length; i++) {
      attrib = dDimensions.keys()[i];
      y = Math.round(yScales[level](item[id]) + yScales[level].bandwidth()/2);
      // y = yScales[level](item[id]) + yScales[level].bandwidth()/2;

      context.beginPath();
      context.moveTo(Math.round(x(attrib, level)), y);
      context.lineTo(Math.round(x(attrib, level) + xScale.bandwidth()), y);
      context.lineWidth = Math.round(yScales[level].bandwidth());
      // context.lineWidth = 1;
      context.strokeStyle = item[attrib] === undefined ||
                item[attrib] === null ||
                item[attrib] === "none" ?
                 "white" :
                colScales.get(attrib)(item[attrib]);
      context.stroke();


      //If the range bands are tick enough draw divisions
      if (yScales[level].bandwidth() > nn.divisionsThreshold) {
        var yLine = Math.round(yScales[level](item[id])) ;
        // y = yScales[level](item[id])+yScales[level].bandwidth()/2;
        context.beginPath();
        context.moveTo(x(attrib, level), yLine);
        context.lineTo(x(attrib, level) + xScale.bandwidth(), yLine);
        context.lineWidth = 1;
        // context.lineWidth = 1;
        context.strokeStyle = nn.divisionsColor;
        context.stroke();
      }

    }

  }

  function drawLevelBorder(i) {
    context.beginPath();
    context.rect(levelScale(i),
      yScales[i].range()[0],
      xScale.range()[1],
      yScales[i].range()[1]-100);
    context.strokeStyle = "black";
    context.lineWidth = 1;
    context.stroke();
  }


  function removeBrushOnLevel(lev) {
    d3.select("#level"+lev)
      .selectAll(".brush")
      .call(dBrushes.get(lev).move, null);
  }

  function removeAllBrushesBut(but) {
    for (var lev=0; lev< dataIs.length ; lev+=1) {
      if (lev===but) continue;
      removeBrushOnLevel(lev);
    }
  }


  function addBrush(d, i) {
    dBrushes.set(i,
      d3.brushY()
        .extent([
          [x(xScale.domain()[0], i),yScales[i].range()[0]],
          [x(xScale.domain()[xScale.domain().length-1], i) + xScale.bandwidth()*1.1, yScales[i].range()[1]]
        ])
        .on("end", brushended));
    var _brush = d3.select(this)
      .selectAll(".brush")
      .data([{
        data : data[d],
        level : i
      }]);// fake data

    _brush.enter()
      .merge(_brush)
      .append("g")
      .on("mousemove", onMouseOver)
      .on("click", onSelectByValue)
      .on("mouseout", onMouseOut)
      .attr("class", "brush")
      .call(dBrushes.get(i))
      .selectAll("rect")
      // .attr("x", -8)
      .attr("width", x(xScale.domain()[xScale.domain().length-1], i) + xScale.bandwidth()*1.1);

    _brush.exit().remove();

    function brushended() {
      if (!d3.event.sourceEvent) return; // Only transition after input.
      if (!d3.event.selection) return; // Ignore empty selections.

      removeAllBrushesBut(i);
      var before = performance.now();
      var brushed = d3.event.selection;

      var
        // first = dData.get(invertOrdinalScale(yScales[i], brushed[0] -yScales[i].bandwidth())),
        first = dData.get(invertOrdinalScale(yScales[i], brushed[0])),
        // last = dData.get(invertOrdinalScale(yScales[i], brushed[1] -yScales[i].bandwidth()))
        last = dData.get(invertOrdinalScale(yScales[i], brushed[1]));
      console.log("first and last");
      console.log(first);
      console.log(last);
      console.log("first id "+ first.__i[i]+ " last id " + last.__i[i] );
      // var brush0_minus_bandwidth = brushed[0] - yScales[i].bandwidth();
      // var filteredData = data[i].filter(function (d) {
      //   var y = yScales[i](d[id]);
      //   d.visible = y >= (brush0_minus_bandwidth) && y <= (brushed[1] );
      //   return d.visible;
      // });

      var filteredData = dataIs[i].filter(function (d) {
        data[d].visible = data[d].__i[i] >= first.__i[i] && data[d].__i[i] <= last.__i[i];
        return data[d].visible;
      });

      //Assign the index
      for (var j = 0; j < filteredData.length; j++) {
        data[filteredData[j]].__i[i+1] = j;
      }

      var after = performance.now();
      console.log("Brushend filtering " + (after-before) + "ms");


      console.log("Computing new data");
      var newData = dataIs;
      if (filteredData.length===0) {
        console.log("Empty selection!");
        return;
      } else {
        newData = dataIs.slice(0,i+1);
        newData.push(filteredData);
      }


      nn.updateData(
        newData,
        colScales
      );
      console.log("out of updateData");
      console.log("Selected " + filteredData.length + " calling updateCallback");
      updateCallback(nn.getVisible());

      // nn.update(false); //don't update brushes

      // d3.select(this).transition().call(d3.event.target.move, d1.map(x));
    }// brushend

    function onSelectByValue() {
      console.log("click");
      removeAllBrushesBut(-1); // Remove all brushes
      var screenY = d3.mouse(d3.event.target)[1],
        screenX = d3.mouse(d3.event.target)[0];
      var before = performance.now();
      var itemId = invertOrdinalScale(yScales[i], screenY);
      var after = performance.now();
      console.log("invertOrdinalScale " + (after-before) + "ms");

      var itemAttr = invertOrdinalScale(xScale, screenX - levelScale(i));
      var sel = dData.get(itemId);
      before = performance.now();
      var filteredData = dataIs[i].filter(function (i) {
        data[i].visible = data[i][itemAttr] === sel[itemAttr];
        return data[i].visible;
      });
      filteredData.forEach(function (d, itemI) { data[d].__i[i+1] = itemI;});
      after = performance.now();
      console.log("Click filtering " + (after-before) + "ms");

      var newData = dataIs.slice(0,i+1);
      newData.push(filteredData);

      nn.updateData(
        newData,
        colScales
      );

      console.log("Selected " + nn.getVisible().length + " calling updateCallback");
      updateCallback(nn.getVisible());
    }
    // Update the brush
  }


  function onMouseOver(overData) {
    var screenY = d3.mouse(d3.event.target)[1],
      screenX = d3.mouse(d3.event.target)[0];

    var itemId = invertOrdinalScale(yScales[overData.level], screenY);
    var itemAttr = invertOrdinalScale(xScale, screenX - levelScale(overData.level));
    var d = dData.get(itemId);
    // var itemId = d.data.filter(function (e) {
    //   var y = yScales[d.level](e[id]);
    //   e.visible = y >= screenY && y < screenY + yScales[d.level];
    //   return e.visible;
    // });

    svg.select(".tooltip")
      .attr("transform", "translate(" + (screenX) + "," + (screenY+20) + ")")
      .call(function (tool) {
        tool.select(".tool_id")
          .text(itemId);
        tool.select(".tool_value")
          .text(itemAttr + " : " + d[itemAttr]);
      });
  }

  function onMouseOut() {
    svg.select(".tooltip")
      .attr("transform", "translate(" + (-200) + "," + (-200) + ")")
      .call(function (tool) {
        tool.select(".tool_id")
          .text("");
        tool.select(".tool_value")
          .text("");
      });

  }

  function drawBrushes() {
    // var attribHolder, attribsData;

    //Format the data to draw the phantom rects
    // attribsData = data.reduce(
    //   function (p, l, i) {
    //     return p.concat(xScale.domain().map(function (d) {
    //       return {attrib:d, level:i};
    //     }));
    //   },
    //   []
    // );

    // Send visible and seqId to the beginning
    var attribs = xScale.domain();

    var levelOverlay = svg.select(".attribs")
      .selectAll(".levelOverlay")
      .data(dataIs);

    var levelOverlayEnter = levelOverlay.enter()
      .append("g")
        .attr("class", "levelOverlay")
        .attr("id", function (d,i) { return "level" +i; })
        .each(addBrush);

    var attribOverlay = levelOverlayEnter.merge(levelOverlay)
      .selectAll(".attribOverlay")
      .data(function (_, i) {
        return attribs.map(function (a) {
          return {attrib:a, level:i};
        });
      });


    var attribOverlayEnter = attribOverlay
      .enter()
        .append("g")
        .attr("class", "attribOverlay")
        .style("cursor", "pointer")
        .attr("transform", function (d) {
          return "translate(" +
            x(d.attrib, d.level) +
            "," +
            yScales[d.level].range()[0] +
            ")";
        });

    attribOverlayEnter
      .append("rect")
      .merge(attribOverlay.select("rect"))

      .attr("fill", "none")
      // .style("opacity", "0.1")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", function () {
        return xScale.bandwidth()*1.1;
      })
      .attr("height", function (d) { return yScales[d.level].range()[1] - yScales[d.level].range()[0]; });

    attribOverlayEnter
      .append("text")
      .merge(attribOverlay.select("text"))
      .text(function (d) {
        return d.attrib === "__seqId" ?
          "sequential Index" :
          d.attrib;
      })
      .attr("x", xScale.bandwidth()/2)
      .attr("y", 0)
      .style("font-weight", function (d) {
        return dSortBy.has(d.level) &&
          dSortBy.get(d.level) === d.attrib ?
            "bolder" :
            "normal";
      })
      .style("font-family", "sans-serif")
      .style("font-size", nn.attribFontSize+"px")
      .on("mousemove", function (d) { d3.select(this).transition().duration(150).style("font-size", nn.attribFontSizeSelected+"px"); })
      .on("mouseout", function (d) { d3.select(this).transition().duration(150).style("font-size", nn.attribFontSize+"px"); })
      .attr("transform", "rotate(-45)")
      .on("click", nnOnClickLevel);

    attribOverlay.exit().remove();
    levelOverlay.exit().remove();


    levelOverlayEnter
      .append("text")
        .attr("class", "numNodesLabel")
        .style("font-family", "sans-serif")
        .style("pointer-events", "none")
      .merge(levelOverlay.select(".numNodesLabel"))
        .attr("y", function (_, i) {
          return yScales[i].range()[1] + 15;
        })
        .attr("x", function (_, i) {
          return  levelScale(i);
        })
        .text(function (d) {
          return fmt(d.length);
        });

    levelOverlay.exit().remove();
  }

  function drawCloseButton() {
    var maxLevel = dataIs.length-1;
    svg.select("#closeButton")
      .style("display", dataIs.length === 1 ? "none":"block")
      .attr("transform", "translate(" + (levelScale(maxLevel) + levelScale.bandwidth() - nn.levelsSeparation +15)  + "," + yScales[maxLevel].range()[0] + ")")
  }


  function drawLine(points, width, color, close) {
    context.beginPath();
    points.forEach(function (p, i) {
      if (i === 0) {
        context.moveTo(p.x, p.y);
      } else {
        context.lineTo(p.x, p.y);
      }
    });
    context.lineWidth = width;
    if (close) {
      context.fillStyle = color;
      context.closePath();
      context.fill();
    } else {
      context.strokeStyle = color;
      context.stroke();
    }
  }

  function drawLevelConnections(level) {
    if (level <= 0) {
      return;
    }
    dataIs[level].representatives.forEach(function (item) {
      // Compute the yPrev by calculating the index of the corresponding representative
      var iOnPrev = dData.get(data[item][id]).__i[level-1];
      var iRep = Math.floor(iOnPrev - iOnPrev%dataIs[level-1].itemsPerpixel);
      // console.log("i rep = "+ iRep);
      // console.log(data[level-1][iRep]);
      // console.log(yScales[level-1](data[level-1][iRep][id]));
      var locPrevLevel = {
        x: levelScale(level-1) + xScale.range()[1],
        y: yScales[level-1]( data[dataIs[level-1][iRep]] [id])
      };
      var locLevel = {
        x: levelScale(level),
        y: yScales[level](data[item][id]) };

      var points = [ locPrevLevel,
        {x: locPrevLevel.x + nn.levelsSeparation * 0.3, y: locPrevLevel.y},
        {x: locLevel.x - nn.levelsSeparation * 0.3, y: locLevel.y},
        locLevel,
        {x: locLevel.x, y: locLevel.y + yScales[level].bandwidth()},
        {x: locLevel.x - nn.levelsSeparation * 0.3, y: locLevel.y + yScales[level].bandwidth()},
        {x: locPrevLevel.x + nn.levelsSeparation * 0.3, y: locPrevLevel.y + yScales[level - 1].bandwidth()},
        {x: locPrevLevel.x, y: locPrevLevel.y + yScales[level -1 ].bandwidth()},
        locPrevLevel

      ];
      drawLine(points, 1, nn.levelConnectionsColor);
      drawLine(points, 1, nn.levelConnectionsColor, true);
    });
  }



  nn.initData = function (mData,  mColScales) {
    var before = performance.now();
    // getAttribs(mData[0][0]);
    colScales  = mColScales;
    colScales.keys().forEach(function (d) {
      dDimensions.set(d, true);
    });
    dData = d3.map();
    for (var i = 0; i < data.length ; i++) {
      var d = data[i];
      d.__seqId = i; //create a default id with the sequential number
      dData.set(d[id], d);
      d.__i={};
      d.__i[0] = i;

    }
    // nn.updateData(mData, mColScales, mSortByAttr);

    var after = performance.now();
    console.log("Init data " + (after-before) + "ms");

  };

  function updateScales(levelToUpdate) {
    console.log("Update scales");
    var before = performance.now();
    // yScales=[];
    var lastLevel = dataIs.length-1;

    console.log("Delete unnecessary scales")
    // Delete unnecessary scales
    yScales.splice(lastLevel+1, yScales.length);
    levelToUpdate = levelToUpdate!==undefined ? levelToUpdate : lastLevel;
    yScales[levelToUpdate] = d3.scaleBand()
      .range([y0, h-nn.margin - 30])
      .paddingInner(0.0)
      .paddingOuter(0);



    console.log("Compute representatives")
    var representatives = [];
    if (dataIs[levelToUpdate].length>h) {
      var itemsPerpixel = Math.max(Math.floor(dataIs[levelToUpdate].length / (h*2)), 1);
      console.log("itemsPerpixel", itemsPerpixel);
      dataIs[levelToUpdate].itemsPerpixel = itemsPerpixel;
      for (var i = 0; i< dataIs[levelToUpdate].length; i+=itemsPerpixel ) {
        representatives.push(dataIs[levelToUpdate][i]);
      }
    } else {
      dataIs[levelToUpdate].itemsPerpixel=1;
      representatives = dataIs[levelToUpdate];
    }
    dataIs[levelToUpdate].representatives = representatives;
    yScales[levelToUpdate].domain(representatives.map(function (rep) { return data[rep][id];}));




    // data.forEach(function (levelData, i) {
    //   yScales[i] = d3.scaleBand()
    //     .range([y0, h-nn.margin - 30])
    //     .paddingInner(0.0)
    //     .paddingOuter(0);
    //   yScales[i].domain(levelData.map(function (d) {
    //     return d[id];
    //   })
    //   );
    // });


    console.log("Update color scale domains");
    // Update color scales domains

    // colScales = d3.map();
    dDimensions.keys().forEach(
      function (attrib) {
        if (attrib === "visible") return;
        var scale = colScales.get(attrib);
        scale.domain(d3.extent(dataIs[0].representatives.map(function (rep) {
          return data[rep][attrib];
        }))); //TODO: make it compute it based on the local range
        colScales.set(attrib, scale);
      }
    );

    xScale
      .domain(dDimensions.keys().sort(function (a,b) {
        if (a === "visible") {
          return -1;
        }
        else if (b === "visible") {
          return 1;
        } else if (a === "__seqId") {
          return -1;
        } else if (b === "__seqId") {
          return 1;
        } else {
          return 0;
        }

      }))
      .range([0, nn.attribWidth * (dDimensions.keys().length)])
      .paddingInner(0.1)
      .paddingOuter(0);
    levelScale.domain(dataIs.map(function (d,i) { return i; }))
      .range([x0+nn.margin, ((xScale.range()[1] + nn.levelsSeparation) * dataIs.length) + x0])
      .paddingInner(0)
      .paddingOuter(0);

    var after = performance.now();
    console.log("Updating Scales " + (after-before) + "ms");
  }

  nn.updateData = function (mDataIs, mColScales, levelToUpdate) {
    console.log("updateData");
    var before = performance.now();
    var ctxWidth;
    if (typeof mDataIs !== typeof []) {
      console.error("Navio updateData didn't receive an array");
      return;
    }
    // if (!dSortBy.has(mDataIs.length-1)) {
    //   dSortBy.set(mDataIs.length-1, mSortByAttr);
    // }
    colScales = mColScales;
    dataIs = mDataIs;

    updateScales(levelToUpdate);

    ctxWidth = levelScale.range()[1] + nn.margin + x0;
    d3.select(canvas)
      .attr("width", ctxWidth)
      .attr("height", h)
      .style("width", ctxWidth)
      .style("height", h+"px");
    canvas.style.width = ctxWidth+"px";
    canvas.style.height = h+"px";

    svg
      .attr("width", ctxWidth)
      .attr("height", h);
    nn.update();
    var after = performance.now();
    console.log("Updating data " + (after-before) + "ms");

  };

  function deleteOneLevel() {
    if (dataIs.length<=1) return;
    console.log("Delete one level");
    removeBrushOnLevel(dataIs.length-2);
    dataIs[dataIs.length-2].forEach(function (d) { data[d].visible=true; });

    dataIs = dataIs.slice(0, dataIs.length-1);
    nn.updateData(dataIs, colScales);
    updateCallback(nn.getVisible());
  }



  nn.update = function() {
    var before = performance.now();

    var w = levelScale.range()[1] + nn.margin + x0;
    context.clearRect(0,0,w+1,h+1);
    dataIs.forEach(function (levelData, i) {
      // var itemsPerpixel = Math.floor(levelData.length/h);
      // if (itemsPerpixel>1) { //draw one per pixel
      //   for (var j = 0; j< levelData.length; j+=(itemsPerpixel-1)) {
      //     drawItem(levelData[j], i);
      //   }
      // } else { // draw all
      levelData.representatives.forEach(function (rep) {
        drawItem(data[rep], i);
      });
      // }

      drawLevelBorder(i);
      drawLevelConnections(i);

    });


    drawBrushes();
    drawCloseButton();
    var after = performance.now();
    console.log("Redrawing " + (after-before) + "ms");

  };

  nn.addAttrib = function (attr, scale) {
    colScales.set(attr,scale);
    return nn;
  };

  nn.addSequentialAttrib = function (attr, scale ) {
    nn.addAttrib(attr,scale ||
      d3.scaleLinear()
        .domain(data!==undefined && data.length>0 ?
            d3.extent(data[0], function (d) { return d[attr]; }) :
            [0, 1]) //if we don't have data, set the default domain
        .range(defaultColorRange));
    return nn;
  };

  nn.addCategoricalAttrib = function (attr, scale ) {
    nn.addAttrib(attr,scale ||
      d3.scaleOrdinal(d3.schemeCategory10));
    return nn;
  };

  nn.data = function(_) {
    if (!colScales.has("visible")) {
      nn.addAttrib("visible",
        d3.scaleOrdinal()
          .domain([false,true])
          .range(visibleColorRange)
          //, "#cddca3", "#8c6d31", "#bd9e39"]
      );
    }
    if (!colScales.has("__seqId")) {
      nn.addSequentialAttrib(
        "__seqId"
      );
    }


    // nn.addCategoricalAttrib("group");


    if (arguments.length) {
      _.forEach(function (d) {
        d.visible = true;
      });

      data = _;
      dataIs = [data.map(function (_, i) { return i; })];


      nn.initData(
        dataIs,
        colScales
      );
      nn.updateData(
        dataIs,
        colScales
      );
      return nn;
    } else {
      return data[0];
    }
  };

  nn.getVisible = function() {
    return dataIs[dataIs.length-1].filter(function (d) { return data[d].visible; }).map(function (d) { return data[d]; });
  };


  nn.updateCallback = function(_) {
    return arguments.length ? (updateCallback = _, nn) : updateCallback;
  };

  nn.visibleColorRange = function(_) {
    return arguments.length ? (visibleColorRange = _, nn) : visibleColorRange;
  };

  nn.defaultColorRange = function(_) {
    return arguments.length ? (defaultColorRange = _, nn) : defaultColorRange;
  };

  nn.id = function(_) {
    return arguments.length ? (id = _, nn) : id;
  };

  return nn;
}

export default Navio;