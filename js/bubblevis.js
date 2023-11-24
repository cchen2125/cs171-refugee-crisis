// Constructor function for bubble graph
class BubbleVis {
    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;

        this.initVis();
    }

    initVis() {
        let vis= this;

        vis.margin = {top: 10, right: 20, bottom: 30, left: 20};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .append("g")
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

        // scale
        vis.scale = d3.scaleLinear()
            .range([0, 100]);

        // Set up the pack layout
        vis.pack = d3.pack()
            .size([vis.width, vis.height])
            .padding(3);

        // Create a tooltip div
        vis.tooltip = d3.select("body")
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .attr("id", "bubbleTooltip")

        // Functions to show/update tooltip
        vis.showTooltip = function(event, d, context) {
            d3.select(context).select(".inner-circle")
                .attr("fill", 'darkorange')
            vis.tooltip
                .transition()
                .style("opacity", 1)
            vis.tooltip
                .html(`<strong>${d.data.country}</strong>
                <br>Recognized Asylum Decisions: ${d3.format(",")(d.data.recognizedDecisions)}
                <br>Total Asylum Decisions: ${d3.format(",")(d.data.totalDecisions)}
                <br>Percentage Recognized: ${d.data.percentageRecognized}%`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY + 10) + "px");
        };
        
        vis.moveTooltip = function(event, d, context) {
            vis.tooltip
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY + 10) + "px");
        };
        
        vis.hideTooltip = function(event, d, context) {
            d3.select(context).select(".inner-circle")
                .attr("fill", 'orange')
            vis.tooltip
                .transition()
                .duration(200)
                .style("opacity", 0);
        };

        vis.wrangleData();
    }

    wrangleData() {
        let vis=this;

        vis.parseTime = d3.timeParse("%Y")

        vis.data.forEach(function(d) {
            d.Year = vis.parseTime(d.Year);
        })

        vis.displayData = {};

        vis.data.forEach(d => {
            let country = d["Country of asylum"];
            let recognizedDecisions = parseInt(d["Recognized decisions"], 10);
            let totalDecisions = parseInt(d["Total decisions"], 10) || 0;

            if (!vis.displayData[country]) {
                vis.displayData[country] = {
                    recognizedDecisions: 0,
                    totalDecisions: 0,
                };
            }

            vis.displayData[country].recognizedDecisions += recognizedDecisions;
            vis.displayData[country].totalDecisions += totalDecisions;

            let percentageRecognized = vis.displayData[country].recognizedDecisions / vis.displayData[country].totalDecisions;
            vis.displayData[country].percentageRecognized = parseFloat(percentageRecognized * 100).toFixed(2);

        });

        // console.log(vis.dataByCountry)
        console.log(vis.displayData)

        vis.data = Object.entries(vis.displayData)
            .map(([country, values]) => ({ country, ...values }))
            .sort((a, b) => b.totalDecisions - a.totalDecisions)
            .slice(0, 35); // Take the top 35 countries

        console.log(vis.data)

        vis.updateVis();
    }

    updateVis() {
        let vis=this;

        // Create a hierarchical structure with countries as parent nodes.
        let root = d3.hierarchy({ children: vis.data })
            .sum(d => d.totalDecisions);

        // Add children to each country node for recognized decisions.
        root.each(d => {
            if (d.children) {
                d.children.forEach(child => {
                    child.data.children = [{ recognizedDecisions: child.data.recognizedDecisions }];
                });
            }
        });
        
        vis.pack(root);

        console.log(root)

        // Place each (leaf) node according to the layout’s x and y values.
        let node = vis.svg.selectAll(".node")
            .data(root.descendants().slice(1))
            .enter()
            .append("g")
            .attr("class", "node")
            .attr("transform", d => `translate(${d.x},${d.y})`)
            .on("mouseover", function (event, d) { vis.showTooltip(event, d, this); })
            .on("mousemove", function (event, d) { vis.moveTooltip(event, d, this); })
            .on("mouseleave", function (event, d) { vis.hideTooltip(event, d, this); })

        // Add a filled circle for total decisions.
        node.append("circle")
            .attr("fill-opacity", 0.6)
            .attr("fill", 'orange')
            .attr("r", d => d.r);

        // Add a smaller circle for recognized decisions.
        node.filter(d => d.data.recognizedDecisions !== undefined) // Filter to include only nodes with recognized decisions
            .append("circle")
            .attr("fill-opacity", .9)
            .attr("class", "inner-circle")
            .attr("fill", 'orange') 
            .attr("r", d => Math.sqrt(d.data.recognizedDecisions / d.data.totalDecisions) * d.r);

        // Function to wrap text within a specified width
        function wrap(text, width) {
            console.log(text, width)
            text.each(function () {
                var text = d3.select(this),
                    words = text.text().split(/\s+/).reverse(),
                    word,
                    line = [],
                    lineNumber = 0,
                    lineHeight = 1.1, // ems
                    y = text.attr("y"),
                    dy = parseFloat(text.attr("dy")) || 0,
                    tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
                while (word = words.pop()) {
                    line.push(word);
                    tspan.text(line.join(" "));
                    if (tspan.node().getComputedTextLength() > width) {
                        line.pop();
                        tspan.text(line.join(" "));
                        line = [word];
                        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                    }
                }
            });
        }

        // Add text.
        node.append("text")
            .text(d => d.data.country)
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .style('id', "bubble-text")
            .call(wrap, d => d.r/3);

        // Update / remove sequence
    }
}
