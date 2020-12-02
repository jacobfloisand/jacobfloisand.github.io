//This function is called in order to re-render the piano visualization.
//It collects necessary data from timeline.csv and finally calls piano to do the heavy lifting.
//@Params - data(array) - A list of sales data for a particular instrument. If no sales data is available this array should be empty.
//        - name(string) - The name of the instrument to be visualized.
function pianoData(data, name){
  loadFile('data/timeline.csv').then(timeline => {
    piano(data, timeline, name);
  });
}

//This function re-renders the piano visualization.
//Important: Do not call this function directly. Please call pianoData instead when the piano visualization needs to be re-rendered.
//@Params:  - data(array) - A list of sales data for a particular instrument. If no sales data is available this array should be empty.
//          - timeline(json array) - A list of events to be rendered.
//          - name(string) - The name of the piano for which we are rendering.
function piano(data, timeline, name) {
  //Removing the piano keys guarantees that we don't draw new piano keys on top of the old ones.
  d3.select('#piano').selectAll('rect').remove();
  //We use this array as data to build the piano chart junk.
  let pianokeys = Array.from(Array(53).keys());
  //Draw the white piano keys.
  d3.select('#piano').selectAll('rect')
    .data(pianokeys)
    .join('rect')
    .attr('x', 0)
    .attr('y', d => d * 12)
    .attr('width', 170)
    .attr('height', 12)
    .classed('keys', true);

  let blackkeys = [0, 1, 2, 4, 5, 7, 8, 9, 11, 12, 14, 15, 16, 18, 19, 21, 22, 23, 25, 26, 28, 29, 30,
    32, 33, 35, 36, 37, 39, 40, 42, 43, 44, 46, 47, 49, 50, 51];

  //Draw the black piano keys
  d3.select('#blackkeys').selectAll('rect')
    .data(blackkeys)
    .join('rect')
    .attr('x', 0)
    .attr('y', d => 8 + d * 12)
    .attr('width', 80)
    .attr('height', 8)
    .classed('blackkeys', true);

    let pianoScaleX = d3.scaleLinear()
      .domain([1390, 2007])
      .range([0, 630]);

      // console.log('max is: ' + d3.max(data, d => d.y));
      // console.log('rounded is: ' + Math.ceil(d3.max(data, d => d.y)/1000)*1000);
    let pianoScaleY = d3.scaleLinear()
      .domain([0, Math.ceil(d3.max(data, d => d.y)/10000)*10000])
      .range([170, 0]);

    //These additions to data make sure that only the area inside the line chart is blue.
    if(data.length != 0){
      data.unshift({x:pianoScaleX.invert(630), y:pianoScaleY.invert(170)});
      data.push({x:pianoScaleX.invert(550), y:pianoScaleY.invert(170)});
      data.push({x:pianoScaleX.invert(551), y:pianoScaleY.invert(170)});
    }

    //This line variable is used to draw the sales line on the piano visuzalization
  let lineFn = d3.line()
    .y(d => pianoScaleX(d.x))
    .x(d => pianoScaleY(d.y))
    //.curve(d3.curveCatmullRom.alpha(1));
    .curve(d3.curveLinear)

    //Check if the curve has already been drawn so we know if we need to create a new path or find an existing one.
    let curveSelection = d3.select('#curve').selectAll('path');
    if(curveSelection.size() == 0){
      //Create the sales line.
      d3.select('#curve').append('path')
      .transition().duration(1000)
      .attr('class', 'salesCurve')
      .attr('d', lineFn(data));
    } else {
      //Update the existing sales line.
      curveSelection
      .transition().duration(1000)
      .attr('class', 'salesCurve')
      .attr('d', lineFn(data));
    }

    //Create the tooltip container if it doesn't exist.
    if(d3.select('#tooltipParent').size() == 0){
      d3.select('body').append('div').attr('id', 'tooltipParent');
    }

    //This tooltip will be shown when the user hovers over the line graph.
  let Tooltip = d3.select('#tooltipParent')
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "2px")
    .style("border-radius", "5px")
    .style("padding", "5px")
    .style("position", "absolute");

   // Three function that change the tooltip when user hover / move / leave a cell
   let mouseover = function(d) {
    Tooltip
      .style("opacity", 1)
    d3.select(this)
      .style("stroke", "black")
      .style("stroke-width", 0)
      .attr('r', 5)
      .style("opacity", 1)
      .style("margin", "auto");
  }
  let mousemove = function(d) {
    Tooltip
      .html('Year: ' + d.x + '<br>Number Sold: ' + d.y)
      .style("left", (d3.mouse(this)[0]+20) + "px")
      .style("top", (d3.mouse(this)[1] + 100) + "px")
  }
  let mouseleave = function(d) {
    Tooltip
      .style("opacity", 0)
     d3.select(this)
     .attr('r', 10)
     .style("opacity", 0)
       .style("stroke-width", 0)
  }

    //Axis labels.
    d3.select('#x-axis-text').remove(); //We remove the labels so we can guarantee that we don't create duplicate labels.
    d3.select('#y-axis-text').remove();
    //Create x axis label.
    d3.select('#piano-viz').append('text').attr('id', 'x-axis-text').text('NUMBER SOLD').style('font-family', 'Arial').attr('x', 45).attr('y', 675);
    //Create y axis label.
    d3.select('#piano-viz').append('text').attr('id', 'y-axis-text').text('YEAR').style('font-family', 'Arial').attr('transform', 'translate(13,330)rotate(270)');

  let xAxis = d3.axisRight().scale(pianoScaleX).tickFormat(d3.format("0"));
  if(d3.select('#x-axis').size() == 0){
    //Add x axis
    d3.select('#piano-viz').append('g').attr('id', 'x-axis').style('font-family', 'Arial').attr("transform", "translate(190, 5)").call(xAxis);
  }

   let yAxis = d3.axisBottom().scale(pianoScaleY).ticks(5).tickFormat(d3.format("~s"));
  d3.select('#y-axis').remove();
    //Add y axis.
    d3.select('#piano-viz').append('g').attr('id', 'y-axis').attr("transform", "translate(20, 640)").call(yAxis);

  //Create a container for the blue circles shown on the line chart on hover.
  let circles = d3.select('#timeline-viz');
  if(circles.size() == 0){
    d3.select('#piano-viz').append('g').attr('id', 'timeline-viz').attr('transform', 'translate(10,0)');
  }

    d3.select('#data-points').remove(); //Remove the orange circles so we don't create more on top of the ones we already have.
    //Create the orange hover circles that reveal the tool tip. These circles are on the line chart, not underneath.
    d3.select('#piano-viz').append('g').attr('transform', 'translate(20,0)').attr('id', 'data-points').selectAll('circle')
    .data(data)
    .join('circle')
    .attr('cy', d => pianoScaleX(d.x) + 5)
    .attr('cx', d => pianoScaleY(d.y))
    .attr('r' , 10)
    .attr('fill', 'skyblue')
    .attr('stroke-width', 0)
    .attr('stroke', 'black')
    .style("opacity", 0)
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave);

    //Get the event circles which are orange.
  let selection = d3.select('#timeline-viz').selectAll('circle').data(timeline);

  //Allows circles to come down from the top.
  let newCircles = selection.enter().append('circle')
    .attr('cy', -20)
    .attr('cx', 170 + 10)
    .attr('r', 6)
    .attr('class', function(d,i){
            if(d.Show == 'TRUE'){
            return 'event-point-show';
          }
          else{
            return 'event-point';
          }})
    .on('mouseover', (d,i,g) => {
      d3.select(g[i]).classed('event-point-hover', true)})
    .on('mouseleave', (d,i,g) => {
      d3.select(g[i]).classed('event-point-hover', false)});

      //Makes event circles move off the bottom when there is not data for them.
  selection.exit()
    .transition()
    .duration(2000)
    .attr('cy', 700)
    .attr('cx', 180)
    .remove();

  selection = newCircles.merge(selection);

    //This tells the event circles where they are located on the timeline.
  selection.transition()
    .duration(2000)
    .attr('cy', d => pianoScaleX(d.Year) + 5)
    .attr('cx', 180);

      //Render the event mini text boxes.
      if(d3.select('#event-rectangles').size() == 0){
    let timelineEvents = d3.select('#timeline-viz').append('g').attr('id', 'event-rectangles').selectAll('g')
    .data(timeline).join('g');

    timelineEvents.append('rect')
    .attr('y', 0)
    .attr('x', 220)
    .attr('height', 60)
    .attr('width', 203)
    .attr('rx', 5)
    .attr('ry', 5)
    .attr('class', function(d,i){
      if(d.Show == 'TRUE'){
      return 'text-rect';
    }
    else{
      return 'text-rect-hide';
    }});

    timelineEvents.append('text')
    .attr('y', 15)
      .attr('x', 225)
      .attr('dy', '.71em')
      .style('font-family', 'Arial')
      .text(function(d,i){
            if(d.Show == 'TRUE'){
            return d.ShortText;
          }
          else{
            return null;
          }})
      .call(wrap, 200);

      //move timeline events into place
      timelineEvents.transition()
        .duration(2000)
        .attr('transform', d => 'translate(0, ' + (pianoScaleX(d.Year) - 10) + ')');
          }


    if(data.length == 0){
      let selection = d3.select('#piano-viz').select('#no-data-text');
      if (selection.size() == 0){
        //Show text that indicates that there is no sales data available.
        d3.select('#piano-viz').append('text')
        .attr('id', 'no-data-text')
        .text('No purchase data available')
        .attr('y', 0)
        .attr('x', 10)
        .style('font-size', 15)
        .attr('transform', 'translate(10,640)rotate(270)');
      }
    } else {
      d3.select('#no-data-text').remove();
    }


  // Tooltip for the timeline circles
  let lightOrangeCircles = d3.selectAll('.event-point')
    .append("svg:title")
    .attr('id', 'tooltip')
    .attr('class', "tooltip")
    .attr('width', 100)
    .attr('height', 100)
    .text(function (d) {
      return d.Year + ' - ' + d.Text;
    });

}

//Creates and renders the tree.
async function loadTree() {
  d3.json('./data/piano_history.json').then(treeData => {
    let tree = new Tree(treeData);
    tree.buildTree();
    tree.renderTree();
  })
}

// function came from stack overflow: https://stackoverflow.com/questions/24784302/wrapping-text-in-d3
function wrap(text, width) {
  text.each(function () {
      var text = d3.select(this),
          words = text.text().split(/\s+/).reverse(),
          word,
          line = [],
          lineNumber = 0,
          lineHeight = 1.1, // ems
          x = text.attr("x"),
          y = text.attr("y"),
          dy = 0,
          tspan = text.text(null)
                      .append("tspan")
                      .attr("x", x)
                      .attr("y", y)
                      .attr("dy", dy + "em");
      while (word = words.pop()) {
          line.push(word);
          tspan.text(line.join(" "));
          if (tspan.node().getComputedTextLength() > width) {
              line.pop();
              tspan.text(line.join(" "));
              line = [word];
              tspan = text.append("tspan")
                          .attr("x", x)
                          .attr("y", y)
                          .attr("dy", ++lineNumber * lineHeight + dy + "em")
                          .text(word);
          }
      }
  });
}


/**
 * A file loading function for CSVs
 * @param file
 * @returns {Promise<T>}
 */
async function loadFile(file) {
  let data = await d3.csv(file).then(d => {
    let mapped = d.map(g => {
      for (let key in g) {
        let numKey = +key;
        if (numKey) {
          g[key] = +g[key];
        }
      }
      return g;
    });
    return mapped;
  });
  return data;
}

//Render tree visualization
loadTree();
//Render piano visualization. Params: 1) the sales data for a particular instruent. 2) the name of the currently selected piano-like instrument.
pianoData([], '');
