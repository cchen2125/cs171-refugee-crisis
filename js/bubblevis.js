// Constructor function for bubble graph
class BubbleVis {
    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;

        this.initVis();
    }

    initVis() {
        let vis= this;

        vis.margin = {top: 10, right: 0, bottom: 0, left: 0};
        vis.width = 600;
        vis.height = 600;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g");

        // Scale
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
                <br><br>Recognized: <strong>${d.data.percentageRecognized}%</strong>`)
                    .style("left", (event.pageX + 20) + "px")
                    .style("top", (event.pageY - 30) + "px");
        };
        
        vis.moveTooltip = function(event, d, context) {
            vis.tooltip
                .style("left", (event.pageX + 20) + "px")
                .style("top", (event.pageY - 30) + "px");
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
            .slice(0, 37); // Take the top 37 countries

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

        // Add text.
        node.append("text")
            .text(d => d.data.country)
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .style("pointer-events", "none");
    }
}
