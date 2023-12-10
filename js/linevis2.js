class LineVis {
    constructor(_parentElement, _data) {
        this.parentElement = _parentElement;
        this.data = _data;

        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.margin = { top: 30, right: 100, bottom: 30, left: 100 };
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
            .attr("x", -vis.height * 0.5)
            .attr("y", -vis.margin.left + 15)
            .attr("font-size", 15)
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .text("Refugees Under UNHCR Mandate")

        vis.svg.append("text")
            .attr("class", "x-axis-label")
            .attr("x", vis.width * 0.5)
            .attr("y", vis.height+25)
            .attr("font-size", 15)
            .attr("text-anchor", "middle")
            .text("Year")

        // tooltip
        vis.tooltip_group = vis.svg.append('g')
            .style("opacity", 1);
        
        vis.tooltip_group.append("line")
            .attr("id", "line")
            .attr("stroke", "black")
            .attr("y1", 0).attr("y2", vis.height)
            .attr("x1", 0).attr("x2", 0)

        vis.tooltip = vis.tooltip_group.append("g")
            .attr("id", "tooltip-text")

        vis.tooltip.append("text")
            .attr("x", 10)
            .attr("y", vis.margin.top)
            .attr("id", "date-text")

        vis.tooltip.append("text")
            .attr("x", 10)
            .attr("y", vis.margin.top + 15)
            .attr("id", "refugee-text")

        vis.bisectDate = d3.bisector(d=>d.Year).left;

        vis.svg.append("rect")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr("opacity", 0)
            .on("mouseover", function (event) {
                vis.tooltip_group.attr("style", "display: null")
            })
            .on("mouseout", function() {
                vis.tooltip_group.attr("style", "display: none")
            })
            .on("mousemove", function (event) {
                vis.mousemove(event)
            })
        
        vis.mousemove = function mousemove(event) {
            let xposition = d3.pointer(event)[0]
            let xdate = vis.x.invert(xposition)
            let closest_index = vis.bisectDate(vis.data, xdate)
            let data_ele = vis.data[closest_index]
    
            vis.tooltip_group.attr("transform", "translate(" + xposition + ",0)")
            vis.tooltip_group.selectAll("#refugee-text").text(d3.format(",.0f")(data_ele["Refugees under UNHCR's mandate"]))
            vis.tooltip_group.selectAll("#date-text").text(vis.formatDate(data_ele.Year))
        }

        vis.wrangleData();
    }

    wrangleData() {
        let vis = this;

        vis.parseTime = d3.timeParse("%Y")
        vis.formatDate = d3.timeFormat("%Y");
        
        vis.data.forEach(function(d) {
            d.Year = vis.parseTime(d.Year)
            d["Refugees under UNHCR's mandate"] = +d["Refugees under UNHCR's mandate"];
        })

        console.log(vis.data)

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        // update domains and display axes
        vis.x.domain(d3.extent(vis.data, d=>d.Year))
        vis.y.domain([0,d3.max(vis.data, d=>d["Refugees under UNHCR's mandate"])])

        console.log(d3.max(vis.data, d=>d["Refugees under UNHCR's mandate"]))

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
            .x((d)=>vis.x(d.Year))
            .y((d)=>vis.y(d["Refugees under UNHCR's mandate"]))
            .curve(d3.curveLinear)

        let path = vis.svg.append("path")
            .attr("class", "line")
            .attr("fill", "none")
            .attr("stroke", "#425930")
            .attr("stroke-width", 2)
        
        path.datum(vis.data)
            .attr("d", d=>line(d))

        // draw circles
        vis.circles = vis.svg.selectAll("circle")
		    .data(vis.data)

        vis.circles.exit().remove()

        vis.circles.enter()
            .append("circle")
            .merge(vis.circles)
            .attr("cx", d=>vis.x(d.Year))
            .attr("cy", d=>vis.y(d["Refugees under UNHCR's mandate"]))
            .attr("r", 3)
            .attr("fill", "#425930")
    }
}