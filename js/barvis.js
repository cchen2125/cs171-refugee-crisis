// Constructor function for bubble graph
class BarVis {
    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;

        this.initVis();
    }

    initVis() {
        let vis= this;

        vis.margin = {top: 0, right: 0, bottom: 30, left: 100};
        vis.width = 850;
        vis.height = 460;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

        // Define x scale
        vis.x = d3.scaleLinear()
            .range([0, vis.width]);

        // Create a tooltip div
        vis.tooltip = d3.select("body")
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .attr("id", "bubbleTooltip")

        // Functions to show/update tooltip
        vis.showTooltip = function(event, d, context) {
            d3.select(context).select(".bar")
                .attr("fill", '#5F6F52')
            vis.tooltip
                .transition()
                .style("opacity", 1)
            vis.tooltip
                .html(`<strong>${d.country}</strong>
                <br>Recognized Asylum Decisions: ${d3.format(",")(d.recognizedDecisions)}`)
                    .style("left", (event.pageX + 20) + "px")
                    .style("top", (event.pageY - 30) + "px");
        };
        
        vis.moveTooltip = function(event, d, context) {
            vis.tooltip
                .style("left", (event.pageX + 20) + "px")
                .style("top", (event.pageY - 30) + "px");
        };
        
        vis.hideTooltip = function(event, d, context) {
            d3.select(context).select(".bar")
                .attr("fill", '#5F6F52')
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

            if (!vis.displayData[country]) {
                vis.displayData[country] = {
                    recognizedDecisions: 0
                };
            }

            vis.displayData[country].recognizedDecisions += recognizedDecisions;
        });

        console.log(vis.displayData)

        vis.data = Object.entries(vis.displayData)
            .map(([country, values]) => ({ country, ...values }))
            .sort((a, b) => b.recognizedDecisions - a.recognizedDecisions)
            .slice(0, 20); // Take the top 20 countries

        console.log('here:')
        console.log(vis.data)

        vis.updateVis();
    }

    updateVis() {
        let vis=this;  
            
        // Update domain of x scale
        vis.x.domain([0, d3.max(vis.data, d => d.recognizedDecisions)])

        // Define y scale
        vis.y = d3.scaleBand()
            .domain(vis.data.map(d => d.country))
            .range([0, vis.height - 15])
            .padding(0.01);

        // Add bars
        vis.svg.selectAll(".bar")
            .data(vis.data)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("y", d => vis.y(d.country))
            .attr("height", 16)
            .attr("x", 0)
            .attr("width", d => vis.x(d.recognizedDecisions))
            .attr("fill", "#5F6F52")
            .on("mouseover", function (event, d) { vis.showTooltip(event, d, this); })
            .on("mousemove", function (event, d) { vis.moveTooltip(event, d, this); })
            .on("mouseleave", function (event, d) { vis.hideTooltip(event, d, this); });     ;

        // Add y-axis
        vis.svg.append("g")
            .call(d3.axisLeft(vis.y));

        // Add x-axis
        vis.svg.append("g")
            .attr("transform", `translate(0,${vis.height - 16})`)
            .call(d3.axisBottom(vis.x));

        // Add axis labels
        vis.svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - vis.margin.left)
            .attr("x", 0 - vis.height / 2 + 15)
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Country");

        vis.svg.append("text")
            .attr("transform", `translate(${vis.width / 2},${vis.height + vis.margin.top + 22})`)
            .style("text-anchor", "middle")
            .text("Total Recognized Asylum Decisions");
    }
}
