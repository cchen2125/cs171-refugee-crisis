// Constructor function for bubble graph
class BubbleVis {
    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;

        this.initVis();
    }

    initVis() {
        let vis= this;

        vis.margin = {top: 0, right: 150, bottom: 0, left: 20};
        vis.width = 660;
        vis.height = 560;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .attr("transform", "translate(" + (130) + "," + (-45) + ")")
            .append("g");

        // Set up the pack layout
        vis.pack = d3.pack()
            .size([vis.width - 20, vis.height + 30])
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
                .attr("fill", '#5F6F52')
            vis.tooltip
                .transition()
                .style("opacity", 1)
            vis.tooltip
                .html(`<strong>${d.data.country}</strong>
                <br>Recognized Asylum Decisions: ${d3.format(",")(d.data.recognizedDecisions)}
                <br>Total Asylum Decisions: ${d3.format(",")(d.data.totalDecisions)}
                <br><br>Percentage: <strong>${d.data.percentageRecognized}%</strong>`)
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
                .attr("fill", '#83A665')
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

        console.log('this')
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
            .attr("fill", '#96AF81')
            .attr("r", d => d.r);

        // Add a smaller circle for recognized decisions.
        node.filter(d => d.data.recognizedDecisions !== undefined) // Filter to include only nodes with recognized decisions
            .append("circle")
            .attr("fill-opacity", .8)
            .attr("class", "inner-circle")
            .attr("fill", '#83A665') 
            .attr("r", d => Math.sqrt(d.data.recognizedDecisions / d.data.totalDecisions) * d.r);

        // Add text.
        node.append("text")
            .text(d => d.data.country)
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .style("pointer-events", "none");

        // Legend        

        // Legend group
        vis.legend = vis.svg.append("g")
            .attr("class", "legend")
            .attr("transform", "translate(29, 17)");

        // Add a scale for bubble size
        vis.z = d3.scaleSqrt()
            .domain([125000, 4500000])
            .range([ 6, 107]);

        // Values to show in legend
        let valuesToShow = [500000, 1000000, 2000000]
        let xCircle = 665
        let xLabel = 767

        // Create legend circles
        vis.legend.selectAll(".legend-circle")
            .data(valuesToShow)
            .enter()
            .append("circle")
            .attr("class", "legend-circle")
            .attr("cx", xCircle) 
            .attr("cy", (d, i) => vis.height - 47 - vis.z(d)) 
            .attr("r", d => vis.z(d)) 
            .attr("fill", "none") 
            .attr("stroke", "black") 
            .attr("stroke-width", 1); 

        // Add legend: segments
        vis.svg.selectAll("legend-segment")
            .data(valuesToShow)
            .enter()
            .append("line")
            .attr("class", "legend-segment")
            .attr("x1", (d) => xCircle + vis.z(d) + 27)
            .attr("x2", xLabel + 3)
            .attr("y1", (d, i) => vis.height - 47 - vis.z(d))
            .attr("y2", (d, i) => vis.height - 47 - vis.z(d))
            .attr("stroke", "black")
            .style("stroke-dasharray", "2,2");

        // Create legend labels
        vis.legend.selectAll(".legend-label")
            .data(valuesToShow)
            .enter()
            .append("text")
            .attr("class", "legend-label")
            .attr("x", xLabel - 21) 
            .attr("y", (d, i) => vis.height - 61 - vis.z(d)) 
            .text((d) => `${d3.format(",")(d)}`)
            .style("font-size", "8px");

        // Add legend title
        vis.legend.append("text")
            .attr('x', xCircle)
            .attr("y", vis.height - 26)
            .text("# of Asylum Decisions")
            .attr("text-anchor", "middle")
            .style("font-size", "13px");
    }
}
