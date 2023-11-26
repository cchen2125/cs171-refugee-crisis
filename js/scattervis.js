class ScatterVis {
    constructor(parentElement, countryData, gdpData, acceptances) {
        this.parentElement = parentElement;
        this.countryData = countryData;
        this.gdpData = gdpData;
        this.acceptances = acceptances;

        this.initVis();
    }

    initVis() {
        let vis= this;

        vis.margin = {top: 40, right: 0, bottom: 10, left: 40};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right + 50;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .append("g")
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);
        
        // axis and scale
        // X axis
        vis.x = d3.scaleLinear()
            .range([20, vis.width-60]);

        vis.svg.append("g")
            .attr("transform", `translate(0, ${vis.height-80})`)
            .call(d3.axisBottom(vis.x).ticks(5));

        // X-axis label:
        vis.svg.append("text")
            .attr("text-anchor", "end")
            .attr("x", vis.width-47)
            .attr("y", vis.height-40)
            .text("GDP (in USD)")
            .style("opacity", 1)
            .style("fill", "black");

        // Y axis
        vis.y = d3.scaleLinear()
            .range([vis.height-80, 0]);

        vis.svg.append("g")
            .call(d3.axisLeft(vis.y));

        // Y-axis label:
        vis.svg.append("text")
            .attr("text-anchor", "end")
            .attr("x", 0)
            .attr("y", -20 )
            .text("Asylum Acceptances (Total)")
            .attr("text-anchor", "start")

        // Add a scale for bubble size
        vis.z = d3.scaleSqrt()
            .range([4, 60]);

        // Add a scale for bubble color
        // vis.myColor = d3.scaleOrdinal()
        //     .domain(["Asia", "Europe", "Americas", "Africa", "Oceania"])
        //     .range(d3.schemeSet1);

        // Create a tooltip div
        vis.tooltip = d3.select("body")
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .attr("id", "scatterTooltip")

        // Functions to show/update tooltip
        vis.showTooltip = function(event, d, context) {
            d3.select(context).select(".inner-circle")
                .attr("fill", 'darkorange')
            vis.tooltip
                .transition()
                .style("opacity", 1)
            vis.tooltip
                .html(`<strong>${d[0]}</strong> 
                <br>GDP (2022): ${d[1].gdp} 
                <br>Total Population (2022): ${d[1].population} 
                <br>Recognized Asylum Decisions: ${d[1].recognizedDecisions}`)
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

        // Functions to handle highlight and no highlight
        // vis.highlight = function(d){
        //     // reduce opacity of all groups
        //     vis.svg.selectAll(".dots").style("opacity", .5)
        //     // except the one that is hovered
        //     vis.svg.selectAll(".dot").style("opacity", 1)
        // }
        // vis.noHighlight = function(){
        //     vis.svg.selectAll(".dots").style("opacity", 1)
        // }

        vis.wrangleData()

    }

    wrangleData() {
        let vis = this;

        vis.sortingOrder = document.getElementById("select-box").value

        vis.displayData = {};

        vis.acceptances.forEach(d => {
            let country = d["Country of asylum"];
            let recognizedDecisions = parseInt(d["Recognized decisions"], 10);

            if (!vis.displayData[country]) {
                vis.displayData[country] = {
                    recognizedDecisions: 0,                
                };
            }

            vis.displayData[country].recognizedDecisions += recognizedDecisions;
        });

        vis.gdpData.forEach(d => {
            let country = d["country"];
            let gdp = parseFloat(d["GDP_USD"]).toFixed(2);
            let population = parseInt(d["2022_population"], 10);

            if (!vis.displayData[country]) {
                vis.displayData[country] = {
                    recognizedDecisions: 0,
                    gdp: 0,
                    population: 0               
                };
            }

            vis.displayData[country].gdp = gdp;
            vis.displayData[country].population = population;
        });

        // Filter out countries with no GDP/population data
        vis.displayData = Object.fromEntries(
            Object.entries(vis.displayData).filter(([country, data]) => data.gdp !== undefined && data.population !== undefined && data.recognizedDecisions !== 0)
        );

        console.log(vis.displayData)

        // update scales and axes
        vis.x
            .domain([0, 25462700000000])

        vis.y
            .domain([0, 1000000])

        vis.z
            .domain([0, 1000000])

        vis.updateVis()
    }

    updateVis() {
        let vis = this;

        // Add group for dots
        let dots = vis.svg.selectAll(".dots")
            .data(Object.entries(vis.displayData))
            .enter()
            .append("g")
            .attr("class", "dots")
            .attr("transform", d => `translate(${vis.x(d[1].gdp)}, ${vis.y(d[1].recognizedDecisions)})`)

        //     // hover functions
            .on("mouseover", function (event, d) { vis.showTooltip(event, d, this); })
            .on("mousemove", function (event, d) { vis.moveTooltip(event, d, this); })
            .on("mouseleave", function (event, d) { vis.hideTooltip(event, d, this); });

        dots.append("circle")
            .attr("fill-opacity", 0.6)
            .attr("fill", 'orange')
            .attr("class", "dot")
            .attr("r", d => vis.z(d[1].recognizedDecisions));

        //     .attr("class", function(d) { return "bubbles " + d.continent })
        //     .style("fill", function (d) { return myColor(d.continent); } )
    }
}


//     // ---------------------------//
//     //       LEGEND              //
//     // ---------------------------//

//     // Add legend: circles
//     var valuesToShow = [10000000, 100000000, 1000000000]
//     var xCircle = 390
//     var xLabel = 440
//     svg
//       .selectAll("legend")
//       .data(valuesToShow)
//       .enter()
//       .append("circle")
//         .attr("cx", xCircle)
//         .attr("cy", function(d){ return height - 100 - z(d) } )
//         .attr("r", function(d){ return z(d) })
//         .style("fill", "none")
//         .attr("stroke", "black")

//     // Add legend: segments
//     svg
//       .selectAll("legend")
//       .data(valuesToShow)
//       .enter()
//       .append("line")
//         .attr('x1', function(d){ return xCircle + z(d) } )
//         .attr('x2', xLabel)
//         .attr('y1', function(d){ return height - 100 - z(d) } )
//         .attr('y2', function(d){ return height - 100 - z(d) } )
//         .attr('stroke', 'black')
//         .style('stroke-dasharray', ('2,2'))

//     // Add legend: labels
//     svg
//       .selectAll("legend")
//       .data(valuesToShow)
//       .enter()
//       .append("text")
//         .attr('x', xLabel)
//         .attr('y', function(d){ return height - 100 - z(d) } )
//         .text( function(d){ return d/1000000 } )
//         .style("font-size", 10)
//         .attr('alignment-baseline', 'middle')

//     // Legend title
//     svg.append("text")
//       .attr('x', xCircle)
//       .attr("y", height - 100 +30)
//       .text("Population (M)")
//       .attr("text-anchor", "middle")

//     // Add one dot in the legend for each name.
//     var size = 20
//     var allgroups = ["Asia", "Europe", "Americas", "Africa", "Oceania"]
//     svg.selectAll("myrect")
//       .data(allgroups)
//       .enter()
//       .append("circle")
//         .attr("cx", 390)
//         .attr("cy", function(d,i){ return 10 + i*(size+5)}) // 100 is where the first dot appears. 25 is the distance between dots
//         .attr("r", 7)
//         .style("fill", function(d){ return myColor(d)})
//         .on("mouseover", highlight)
//         .on("mouseleave", noHighlight)

//     // Add labels beside legend dots
//     svg.selectAll("mylabels")
//       .data(allgroups)
//       .enter()
//       .append("text")
//         .attr("x", 390 + size*.8)
//         .attr("y", function(d,i){ return i * (size + 5) + (size/2)}) // 100 is where the first dot appears. 25 is the distance between dots
//         .style("fill", function(d){ return myColor(d)})
//         .text(function(d){ return d})
//         .attr("text-anchor", "left")
//         .style("alignment-baseline", "middle")
//         .on("mouseover", highlight)
//         .on("mouseleave", noHighlight);