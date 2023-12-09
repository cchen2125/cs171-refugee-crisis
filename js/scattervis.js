class ScatterVis {
    constructor(parentElement, countryData, gdpData, acceptances) {
        this.parentElement = parentElement;
        this.countryData = countryData;
        this.gdpData = gdpData;
        this.acceptances = acceptances;

        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.margin = {top: 40, right: 10, bottom: 10, left: 40};
        vis.width = 900;
        vis.height = 530;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .append("g")
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);
        
        vis.x = d3.scaleLinear()
            .range([20, vis.width-60]);

        // axis and scale
        vis.svg.append("g")
            .attr("transform", `translate(0, ${vis.height-80})`)
            .attr("class", "x-axis");

        vis.xAxis = d3.axisBottom()
            .scale(vis.x);

        // X-axis label:
        vis.svg.append("text")
            .attr("text-anchor", "end")
            .attr("x", vis.width-47)
            .attr("y", vis.height-40)
            .attr("class", "x-label")
            .text("GDP (in USD)")
            .style("opacity", 1)
            .style("fill", "black");

        // Y axis
        vis.y = d3.scaleLinear()
            .range([vis.height-80, 0]);

        vis.svg.append("g")
            .attr("transform", `translate(20,0)`)
            .attr("class", "y-axis");

        vis.yAxis = d3.axisBottom()
            .scale(vis.y);

        // Y-axis label:
        vis.svg.append("text")
            .attr("text-anchor", "end")
            .attr("x", 0)
            .attr("y", -20 )
            .text("Asylum Acceptances (Total)")
            .attr("text-anchor", "start")

        // Add a scale for bubble size
        vis.z = d3.scaleSqrt()
            .range([4, 40]);

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
                <br>GDP (2022): $${(d[1].gdp)} 
                <br>Total Population (2022): ${d3.format(",")(d[1].population)} 
                <br>Recognized Asylum Decisions: ${d3.format(",")(d[1].recognizedDecisions)}`)
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

        // Zoom
        vis.xOrig = vis.x; 
        vis.yOrig = vis.y; // Save original scales

        // Disable mousedown and drag in zoom, when you activate zoom (by .call)
		// vis.svg.select(".brush").call(vis.zoom)
        //     .on("mousedown.zoom", null)
        //     .on("touchstart.zoom", null);

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

        console.log(vis.countryData)
        
        vis.countryData.forEach(d => {
            let country = d["Country Name"];
            let seriesName = d["Series Name"];

            if (vis.displayData[country]) {
                switch (seriesName) {
                    case "GDP (current US$)":
                        vis.displayData[country].gdp = parseInt(d["2022 [YR2022]"]);
                        break;
                    case "Population, total":
                        vis.displayData[country].population = parseInt(d["2022 [YR2022]"]);
                        break;
                    case "GDP growth (annual %)":
                        vis.displayData[country].growth = parseFloat(d["2022 [YR2022]"]).toFixed(2);
                        break;
                    case "Population growth (annual %)":
                        vis.displayData[country].pop_growth = parseFloat(d["2022 [YR2022]"]).toFixed(2);
                        break;
                    case "Population density (people per sq. km of land area)":
                        vis.displayData[country].pop_density = parseInt(d["2021 [YR2021]"]);
                        break;
                    default:
                        break;
                }
            }
        });

        // Filter out countries with no GDP/population data
        vis.displayData = Object.fromEntries(
            Object.entries(vis.displayData).filter(([country, data]) => data.population !== undefined && !isNaN(data.gdp) && data.recognizedDecisions !== 0)
        );

        console.log(vis.displayData)

        vis.updateVis()
    }

    updateVis() {
        let vis = this;

        vis.sortingOrder = document.getElementById("select-box").value

        vis.min = d3.min(Object.values(vis.displayData), d => d[vis.sortingOrder]);
        vis.max = d3.max(Object.values(vis.displayData), d => d[vis.sortingOrder]);

        console.log(vis.min)
        console.log(vis.max)

        // Creating X scale
        vis.x = d3.scaleLinear()
            .domain([vis.min, vis.max])
            .range([20, vis.width-70]);

        vis.svg.select(".x-axis")
            .call(d3.axisBottom(vis.x)
            .ticks(5)
            .tickFormat(d3.format(".2s"))
        );

        vis.y
            .domain([0, 1000000])

        vis.z
            .domain([0, 1000000])

        vis.svg.select(".y-axis")
            .call(d3.axisLeft(vis.y));

        // Update x-axis label
        let selectedOption = document.getElementById("select-box").options[document.getElementById("select-box").selectedIndex];
        vis.selectedValue = selectedOption.text;
        d3.select(".x-label")
            .text(vis.selectedValue);

        // Add group for dots
        let dots = vis.svg.selectAll(".dots")
            .data(Object.entries(vis.displayData));

        // Enter selection
        let enterDots = dots.enter()
            .append("g")
            .attr("class", "dots")
            .on("mouseover", function (event, d) { vis.showTooltip(event, d, this); })
            .on("mousemove", function (event, d) { vis.moveTooltip(event, d, this); })
            .on("mouseleave", function (event, d) { vis.hideTooltip(event, d, this); });

        // Merge the enter selection with the existing selection
        dots = enterDots
            .merge(dots)
            .attr("transform", d => `translate(${vis.x(d[1][vis.sortingOrder])}, ${vis.y(d[1].recognizedDecisions)})`);

        // Append circles to the merged selection 
        dots.append("circle")
            .attr("fill-opacity", 1)
            .attr("fill", 'orange')
            .attr("class", "dot")
            .attr("r", d => vis.z(d[1].recognizedDecisions));

        // Update selection
        dots.select(".dot")
            .attr("r", d => vis.z(d[1].recognizedDecisions));

        // Exit selection
        dots.exit().remove();

        // Zoom function
        // vis.zoomFunction = function(event) {
        //     let { x, y, k } = event.transform;
        
        //     console.log(k)

        //     // Update scales
        //     vis.x.range([20 * k, (vis.width - 60) * k]);
        //     vis.y.range([(vis.height - 80) * k, 0]);

        //     // Update axes
        //     vis.svg.select(".x-axis").call(vis.xAxis);
        //     vis.svg.select(".y-axis").call(vis.yAxis);
        
        //     // Update circles or other elements as needed
        //     vis.updateVis();
        // };

        // // Initialize the zoom component
        // vis.zoom = d3.zoom()
        //     .extent([[0, 0], [vis.width, vis.height]])
        //     .scaleExtent([1, 20])
        //     .on("zoom", vis.zoomFunction);

        // // Zoom rectangle
        // vis.svg.append("rect")
        //     .attr("width", vis.width)
        //     .attr("height", vis.height)
        //     .style("fill", "none")
        //     .style("pointer-events", "all")
        //     .call(vis.zoom);

        //     .attr("class", function(d) { return "bubbles " + d.continent })
        //     .style("fill", function (d) { return myColor(d.continent); } )
    }
}
