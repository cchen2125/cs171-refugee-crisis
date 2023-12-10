// Constructor function for line graph
class MultLineVis {
    constructor(_parentElement, _data) {
        this.parentElement = _parentElement;
        this.data = _data;

        this.initVis();
    }

    initVis() {
        let vis=this;

        vis.margin = { top: 30, right: 180, bottom: 30, left: 60 };
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right,
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // Scales and Axes
        vis.x = d3.scaleUtc()
            .range([0, vis.width]);
        
        vis.y = d3.scaleLinear()
            .range([vis.height, 0]);

        vis.xAxis = d3.axisBottom()
            .scale(vis.x);

        vis.yAxis = d3.axisLeft()
            .scale(vis.y);

        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + vis.height + ")");

        vis.svg.append("g")
            .attr("class", "y-axis axis");

        // axis labels
        vis.svg.append("text")
            .attr("class", "y-axis-label")
            .attr("x", -vis.margin.left)
            .attr("y", -5)
            .attr("fill", "white")
            .attr("font-size", 15)
            .text("Refugees Under UNHCR Mandate*")

        vis.svg.append("text")
            .attr("class", "x-axis-label")
            .attr("x", vis.width+10)
            .attr("y", vis.height+5)
            .attr("fill", "white")
            .attr("font-size", 15)
            .text("Year")

        // Color scale setup
        vis.highlight = ["Syria", "Afghanistan", "Ukraine", "S. Sudan", "Myanmar"]

        vis.color = d3.scaleOrdinal()
            .range(d3.schemeTableau10)
            .domain(vis.highlight)

        // add tooltip
        vis.tooltip = d3.select("body").append('div')
            .style("opacity", 0)
            .attr('class', "tooltip")
            .attr('id', 'lineTooltip');

        vis.wrangleData();
    }

    wrangleData() {
        let vis=this;

        vis.parseTime = d3.timeParse("%Y")
        vis.formatDate = d3.timeFormat("%Y");
        
        vis.data.forEach(function(d) {
            d.Year = vis.parseTime(d.Year);
        })

        vis.data = vis.data.filter(d => {return (d.Year >= vis.parseTime(2012))})

        console.log(vis.data)

        vis.dataByCountry = Array.from(d3.group(vis.data, d=>d["Country of origin"]), ([key, value]) => ({key, value}))

        vis.displayData = {}
        vis.sumstat = []

        vis.dataByCountry.forEach(country => {
            vis.displayData[country.key] = {
                id: country.key,
                values: []
            }
            
            let groupedByYear = Array.from(d3.rollup(country.value, v=> d3.sum(v, d=>d["Refugees under UNHCR's mandate"]),d=>d.Year), ([key, value])=> ({key, value}))

            groupedByYear.forEach(year=>{
                vis.displayData[country.key].values.push({
                    year: year.key, 
                    refugees: year.value
                })

                vis.sumstat.push({
                    country: country.key,
                    year: year.key,
                    refugees: year.value
                })
            })
        })

        //console.log(vis.displayData)
        //console.log(vis.sumstat)

        vis.updateVis();
    }

    updateVis() {
        let vis=this;

        // update domains and display axes
        vis.x.domain(d3.extent(vis.sumstat, d=>d.year))
        vis.y.domain([0,d3.max(vis.sumstat, d=>d.refugees)])

        vis.svg.select(".y-axis")
            .transition()
            .duration(800)
            .call(vis.yAxis);
        
        vis.svg.select(".x-axis")
            .transition()
            .duration(800)
            .call(vis.xAxis);

        // draw lines
        const line = d3.line()
            .x((d)=>vis.x(d.year))
            .y((d)=>vis.y(d.refugees))
            .curve(d3.curveLinear)
            
        Object.keys(vis.displayData).forEach(data => {
            let path = vis.svg.append("path")
                .transition()
                .duration(800)
                .attr("class", "line")
                .attr("fill", "none")
                .attr("stroke", (d) =>{
                    if (vis.highlight.includes(data)) {
                        return vis.color(data)
                    }
                    else {
                        return "lightgray"
                    }
                })
                .attr("stroke-width",(d) =>{
                    if (vis.highlight.includes(data)) {
                        return 2.5
                    }
                    else {
                        return 1
                    }
                })
                .attr("opacity",(d) =>{
                    if (vis.highlight.includes(data)) {
                        return 1
                    }
                    else {
                        return 0.75
                    }
                })
                .selection()
            
            path.datum(vis.displayData[data])
                .attr("d", d=>line(d.values))
        })
    

        // draw circles
        vis.circles = vis.svg.selectAll("circle")
		    .data(vis.sumstat)

        vis.circles.exit().remove()

        vis.circles.enter()
            .append("circle")
            .merge(vis.circles)
            .on("mouseover", function(event, d) {
                let tooltipHTML = `<div>
                    <strong>${d.country}</strong>
                    <br>Year: ${vis.formatDate(d.year)}
                    <br>Number of Refugees: ${d3.format(",")(d.refugees)}
                </div>`

                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px")
                    .style("top", event.pageY + "px")
                    .html(tooltipHTML);
            })
            .on("mouseout", function(event, d) {
                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html("");
            })
            .transition()
            .duration(800)
            .attr("cx", d=>vis.x(d.year))
            .attr("cy", d=>vis.y(d.refugees))
            .attr("r", (d) => {
                if (vis.highlight.includes(d.country)) {
                    return 6
                }
                else {
                    return 3
                }
            })
            .attr("fill", (d) => {
                if (vis.highlight.includes(d.country)) {
                    return vis.color(d.country)
                }
                else {
                    return "lightgray"
                }
            })
            .attr("opacity", (d) => {
                if (vis.highlight.includes(d.country)) {
                    return 1
                }
                else {
                    return 0.5
                }
            })
            .attr("cursor", "pointer")
            
        
        // draw legend
        let rectWidth = 20

        vis.svg.selectAll("rect")
            .data(vis.highlight)
            .enter()
            .append("rect")
            .attr("height", rectWidth)
            .attr("width", rectWidth)
            .attr("x", vis.width+20)
            .attr("y", (d, i) => {return i*30})
            .attr("fill", d => vis.color(d))

        vis.svg.selectAll(".legend-label")
            .data(vis.highlight)
            .enter()
            .append("text")
            .attr("class", "legend-label")
            .attr("x", vis.width+rectWidth+25)
            .attr("y", (d, i) => {return i*30+rectWidth / 2+5})
            .attr("fill", 'white')
            .text(d=> d)
        
    }
}