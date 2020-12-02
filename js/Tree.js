/** Class representing a Tree. */
class Tree {
    /**
     * Creates a Tree Object
     * Populates a single attribute that contains a list (array) of Node objects to be used by the other functions in this class
     * note: Node objects will have a name, parentNode, parentName, children, level, and position
     * @param {json[]} json - array of json objects with name and parent fields
     */
    constructor (json) {
        //Create a list nodes. Save node name and parent in each node.
        this.nodeArray = []
        for (let currentJson of json) {
            let testNode = new Node(currentJson.name, currentJson.parent);
            testNode.dataAvailable = currentJson.dataAvailable;
            testNode.isSelected = "false";
            this.nodeArray.push(testNode);
        }
        this.currentlySelectedIndex = 0;
    }

    /**
     * Function that builds a tree from a list of nodes with parent refs
     */
    buildTree() {
        // note: in this function we assign positions and levels by making calls to assignPosition() and assignLevel()
        for (let currentNode of this.nodeArray) {
            if (currentNode.parent === 'root') {
                currentNode.parentNode = null;
            } else {
                for (let possibleParent of this.nodeArray) {
                    //console.log("currentNode.parent: " + currentNode.parent + "possibleParent.name: " + possibleParent.name);
                    if (currentNode.parentName == possibleParent.name) {
                        currentNode.parentNode = possibleParent;
                        possibleParent.children.push(currentNode);

                    }

                }
            }
        }
        //@params: current node, level to be assigned
        this.assignLevel(this.nodeArray[0], 0); //This function determines node's position from top to bottom
        //@params: current node, position to be assigned, minimum level that children can have, maximum level that children can have.
        this.assignPosition(this.nodeArray[0], 4, 0, 8); //This function determines node's position from left to right.

    }

    /**
     * Recursive function that assign levels to each node
     */
    assignLevel(node, level) {
        node.level = level;
        for (let childNode of node.children) {
            this.assignLevel(childNode, level + 1);
        }

    }

    //A recursive funciton that assigns position to this node and to all children nodes.
    //@params:
    //node(object) - the node that is to be assigned a position.
    //position(int) - the position to be assigned to node
    //minPosition(int) - the lowest position that any child node is allowed to have(for space reasons)
    //maxPosition(int) - the highest position that any child node is allowed to have(for space reasons)
    assignPosition(node, position, minPosition, maxPosition) {
        node.position = position;
        let numChildren = node.children.length;
        let range = maxPosition - minPosition;
        let spacing = range / numChildren; //Spacing determines how far apart each node will be when rendered.
        let childNum = 0; //This is used to help space nodes out evenly when rendered.
        for (let childNode of node.children) {
            position = minPosition + (spacing * childNum) + spacing/2; //Calculate the position for the next child.
            this.assignPosition(childNode, position, minPosition + (spacing * childNum), minPosition + (spacing * childNum) + spacing);
            childNum = childNum + 1;
        }
    }
    

    /**
     * Function that renders the tree
     */
    renderTree() {
        let svg = d3.select('#piano-viz').append('g').attr('transform', 'translate(325,0)');
        //line generator makes edges curvy.
        var gen = d3.line()
            .x((p) => p.x) 
            .y((p) => p.y) 
            .curve(d3.curveCatmullRom.alpha(1));
        //Render edges that connect verteces.
        svg.selectAll("path")
            .data(this.nodeArray)
            .enter().append("path")
            .attr('stroke', 'gray')
            .attr('d', function (d) {
                if(d.parentNode === null){
                    let points = [];
                    return gen(points)
                } else {
                    //Below we define the curve connecting the verteces in the rendered tree.
                    let points = [{x:d.position * 140 + 50 , y:d.level * 60 + 15} , //This is where the line ends.
                                  {x:d.position * 140 + 50 , y:d.level * 60 + 14} , //This manipulates the curve to bend up, instead of down.
                                  {x:d.parentNode.position * 140 + 50 , y:d.parentNode.level * 60 + 10.1} , //This manipulates the curve to bend down, instead of up.
                                  {x:d.parentNode.position * 140 + 50 , y:d.parentNode.level * 60 + 10}] //This is where the line starts
                    return gen(points)
                }
            }).attr('fill', 'none');
        
        //Create a group element which will hold all of the nodes.
        let g = svg.selectAll("g")
            .data(this.nodeArray)
            .enter().append("g")
            .attr("class", "nodeGroup")
            
        //Render the verteces which are rectangles.
        g.append("rect")
            .data(this.nodeArray)
            .attr("x", (d, i) => d.position * 140 + 10)
            .attr("y", (d, i) => d.level * 60 + 10)
            .attr('rx', 10)
            .attr('ry', 10)
            .attr("width", 90)
            .attr("height", 40)
            .attr('class', function(d){ //The selected rectangle has a gray outline.
                    if(d.dataAvailable == "true"){
                        return 'tree-rect-select';
                    } else {
                        return 'tree-rect';
                    }
            })
            .on('mouseover', (d, i, g) => {
                if(d.dataAvailable == "true"){
                    d3.select(g[i]).classed('hovered', true);
                }
              })
              .on('mouseout', (d, i, g) => {
                if(d.dataAvailable == "true"){
                    d3.select(g[i]).classed('hovered', false);
                }
              })
              .on("click", (d, i, g) => {
                  if(d.dataAvailable == "true"){
                        d3.select(g[this.currentlySelectedIndex]).classed('selected', false);
                        d3.select(g[this.currentlySelectedIndex]).classed('tree-rect', true);
                        d3.select(g[i]).classed('tree-rect', false);
                        d3.select(g[i]).classed('selected', true);
                        this.currentlySelectedIndex = i;
                        this.getData(this.nodeArray[i].name);
                  }
              });

        //Render the names of the instruments which appear on top of the rectangle verteces.
        g.append("text")
            .data(this.nodeArray)
            .attr("x", (d, i) => d.position * 140 + 16)
            .attr("y", (d, i) => d.level * 60 + 28)
            .attr("class", "tree-chart-label")
            .on('mouseover', (d, i, g) => {
                if(d.dataAvailable == "true"){
                    d3.select(g[i]).classed('hovered', true);
                }
              })
              .on('mouseout', (d, i, g) => {
                if(d.dataAvailable == "true"){
                    d3.select(g[i]).classed('hovered', false);
                }
              })
              .on("click", (d, i, g) => {
                if(d.dataAvailable == "true"){
                    d3.select(g[this.currentlySelectedIndex]).classed('selected', false);
                    d3.select(g[this.currentlySelectedIndex]).classed('tree-rect', true);
                    d3.select(g[i]).classed('tree-rect', false);
                    d3.select(g[i]).classed('selected', true);
                    this.currentlySelectedIndex = i;
                    console.log(this.nodeArray[i]);
                    this.getData(this.nodeArray[i].name);
                }
            })
            .attr('dy', '.71em')
            .style('font-family', 'Arial')
            .text((d, i) => "\u00A0\u00A0\u00A0" + d.name)
            .attr('font-size', 13)
            .call(this.wrap, 85);

        // EventBox
        function onClick(d) {
            document.getElementById('event-box').style.visibility='visible';
            let event = d3.select('.event-title').text(d.name);
            let timeline = d3.csv('./data/timeline.csv', function(d) {
                return {
                    name : d.Name,
                    text: d.Text,
                    Year: d.Year
                };
            }).then(function(data) {
                const result = data.find( ({ name }) => name === d.name );
                let details = d3.select('.event-info').text(result.Year + ' - ' + result.text);
                // d3.select('#event-rectangles').select('.text-rect').attr('stroke','red');

            }).catch(function(error){
                d3.select('.event-info').text('');
            });

            // Instrument image
            let tag = d.name == 'Player Piano' ? '.gif': '.jpg';
            let photo = d3.select('.event-image img')
                .attr('src', './photos/'+ d.name + tag);

            // Instrument Audio
            let audio = d.name === 'Polychord with bridge' || d.name === 'Polychord without bridge' ? 
                document.getElementById('button').style.visibility = 'hidden' :
                document.getElementById('button').style.visibility = 'visible';
                d3.select('.event-audio audio').attr('src', './sounds_trim/'+ d.name +'.mp3');
        }

        g.on('click', onClick);
    }

    // function came from stack overflow: https://stackoverflow.com/questions/24784302/wrapping-text-in-d3
wrap(text, width) {
    //console.log('inside wrap function')
    text.each(function () {
        //console.log('text.text is: ' + d3.select(this).text())
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
                        words.pop(); //We pop off the spaces that we put at the beginning of the text.
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

    //This function converts a piano name from one format to another.
    //Specifically, it acts as a bridge that relates the names in piano_history.json to piano_sales.csv.
    //Note: This function re-renders the whole piano visualization.
    //@parms:
    //pianoName(string) - The name of the piano as it is found in piano_history.json
    //@returns: 
    //string - The piano name as it is found in piano_sales.csv. If no match is found, an empty string is returned.
    getData(pianoName){
        let formattedName = '';
        if(pianoName == "Modern upright piano"){
            formattedName = 'VERTICAL PIANOS';
        }
        if(pianoName == "Grand Piano"){
            formattedName = 'GRAND PIANOS';
        }
        if(pianoName == "Electric Piano"){
            formattedName = 'ELECTRONIC';
        }
        if(pianoName == "Player Piano"){
            formattedName = 'PNEUMATIC PLAYERS';
        }
        if(formattedName == ''){
            //@params: The sales history as an array, the name of the piano as found in piano_sales.csv.
            pianoData([], pianoName); //pianoData is defined in script.js
            return;
        }
        //The following expression gets the sales data from piano_sales.csv and then re-renders the piano-viz.
        d3.csv('data/piano_sales.csv').then(d => {
            //Mapped will hold an array of sales history data for the current instrument.
            let mapped = d.map(g => {
                if(g[formattedName] == '' || g[formattedName] == '(3 Months)'){
                    return null;
                }
                return {x:parseInt(g['YEAR']), y:parseInt(g[formattedName].replace(/,/g, ''))};
              });
              mapped = mapped.filter(function (el) {
                return el != null;
              });
              //@params: The sales history as an array, the name of the piano as found in piano_sales.csv.
              pianoData(mapped, pianoName); //pianoData is defined in script.js
          });
    }
}
