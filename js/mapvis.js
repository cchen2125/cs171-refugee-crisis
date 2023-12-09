class MapVis {

    constructor(parentElement, geoData, refugeeData, decisionData) {
        this.parentElement = parentElement;
        this.geoData = geoData;
        this.refugeeData = refugeeData;
        this.decisionData = decisionData

        console.log(geoData)
        console.log(refugeeData)
        console.log(decisionData)

        this.initVis()
    }

    initVis() {
        let vis = this;

        vis.margin = {top: 10, right: 10, bottom: 10, left: 10};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = 0.5*vis.width - vis.margin.top - vis.margin.bottom;

        // Parse Year
        vis.parseDate = d3.timeParse("%Y")
        vis.formatDate = d3.timeFormat("%Y");

        // scale based on the height and default  value
        let zoomFactor = vis.height / 650; 
        let scale = 249.5 * zoomFactor;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

        // draw background
        //vis.svg.append("rect")
        //    .attr("width", vis.width)
        //    .attr("height", vis.height)
        //    .attr("fill", "#ADDEFF")

        // add title
        /*vis.svg.append('g')
            .attr('class', 'title')
            .attr('id', 'map-title')
            .append('text')
            .text('Title for Map')
            .attr('transform', `translate(${vis.width / 2}, 20)`)
            .attr('text-anchor', 'middle');*/

        // add tooltip
        vis.tooltip = d3.select("body").append('div')
            .style("opacity", 0)
            .attr('class', "tooltip")
            .attr('id', 'mapTooltip');

        // TODO: create map projection
        vis.projection = d3.geoNaturalEarth1()
            .scale(scale)
            .translate([vis.width / 2, 0.6*vis.height ]);
        
        // geo generator
        vis.path = d3.geoPath()
            .projection(vis.projection);

        // convert TopoJSON data into GeoJSON data
        vis.world = topojson.feature(vis.geoData, vis.geoData.objects.countries).features

        // Draw countries
        vis.countries = vis.svg.selectAll(".country")
            .data(vis.world)
            .enter()
            .append("path")
            .attr('class', 'country')
            .attr("d", vis.path)
            .attr("stroke", "black")
            .attr("stroke-opacity", 0.25);

        // color scale
        vis.colorScale = d3.scaleSequential(d3.interpolateLab("white", "maroon"))
            .domain([0, vis.width * 0.25])

        // TODO: fix legend

        // Create a legend group and position it
        vis.legend = vis.svg.append("g")
            .attr('class', 'legend')
            .attr('transform', `translate(${vis.width / 50}, ${vis.height *0.9})`);

        // legend scale
        vis.legendScale = d3.scaleLinear()
            .range([0, vis.width * 0.25])
            .domain([0, vis.width * 0.25]);

        // legend axis group
        vis.legendAxisGroup = vis.legend.append('g')
            .attr('class', 'legend-axis')
            .attr('transform', 'translate(0,'+vis.height / 30 +')');

        // legend label
        vis.legendLabel = vis.legend.append("text").attr("class", "map-legend-label").attr("y", -vis.height / 50)

        // Create a linear gradient definition in the <defs> section
        vis.defs = vis.legend.append("defs");

        vis.gradient = vis.defs.append("linearGradient")
            .attr("id", "gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");

        //legend color bar
        vis.gradient.selectAll("stop")
            .data(vis.colorScale.ticks().map((t, i, n) => ({ offset: `${100*i/n.length}%`, color: vis.colorScale(t) })))
            .enter().append("stop")
            .attr("offset", d => d.offset)
            .attr("stop-color", d => d.color);
        
        vis.legend.append("rect")
            .attr("width", vis.legendScale(vis.width * 0.25))
            .attr("height", vis.height / 30)
            .attr("x", 0)
            .attr("y", 0)
            .attr("fill", "url(#gradient)")

        //TODO: drag and zoom
        //create zoom handler
        vis.zoom = d3.zoom()
            .scaleExtent([1, 8])
            .on('zoom', (event) => {
                vis.svg.selectAll('path.country')
                    .attr('transform', event.transform);
            });
            
        vis.svg.call(vis.zoom)

        d3.select("#resetButton").on("click", function() {
            vis.svg.transition()
              .duration(750)
              .call(vis.zoom.transform, d3.zoomIdentity);
          });
        
        // sidebar functionality
        vis.selectedCountry = "none"

        vis.sideMargin1 = {top: 10, right: 60, bottom: 10, left: 120}
        vis.sideWidth1 = document.getElementById('side-graph1').getBoundingClientRect().width - vis.sideMargin1.left - vis.sideMargin1.right
        vis.sideHeight1 = document.getElementById('side-graph1').getBoundingClientRect().height - vis.sideMargin1.top - vis.sideMargin1.bottom
        vis.sideSvg1 = d3.select('#side-graph1').append('svg')
            .attr("width", vis.sideWidth1 + vis.sideMargin1.left + vis.sideMargin1.right)
            .attr("height", vis.sideHeight1 + vis.sideMargin1.top + vis.sideMargin1.bottom)
            .append('g')
            .attr('transform', `translate (${vis.sideMargin1.left}, ${vis.sideMargin1.top})`)

        vis.sideMargin2 = {top: 10, right:10, bottom: 20, left:60}
        vis.sideWidth2 = document.getElementById('side-graph2').getBoundingClientRect().width - vis.sideMargin2.left - vis.sideMargin2.right
        vis.sideHeight2 = document.getElementById('side-graph2').getBoundingClientRect().height - vis.sideMargin2.top - vis.sideMargin2.bottom
        vis.sideSvg2 = d3.select('#side-graph2').append('svg')
            .attr("width", vis.sideWidth2 + vis.sideMargin2.left + vis.sideMargin2.right)
            .attr("height", vis.sideHeight2 + vis.sideMargin2.top + vis.sideMargin2.bottom)
            .append('g')
            .attr('transform', `translate (${vis.sideMargin2.left}, ${vis.sideMargin2.top})`)

        vis.updateSidebar = function(d) {
            if (d == "none") {
                return
            }
            if (!Object.keys(vis.displayData).includes(d.properties.name)) {
                d3.select('#country-info').html('').append('strong').text(vis.selected_cat + ": " + d.properties.name)
                d3.select('#country-info').append('p').text("No data available")
                d3.select('#side-title1').html('')
                d3.select('#side-title2').html('')
                vis.sideSvg1.selectAll("*").remove()
                vis.sideSvg2.selectAll("*").remove()
                return
            }

            // Sidebar Title
            d3.select('#country-info').html('').append('strong').text(vis.selected_cat + ": " + d.properties.name)
            
            // Get data of just this country
            let countryData = vis.countryInfo[d.properties.name]

            // Display summary statistics
            let infoList = d3.select('#country-info').append('ul')
        
            infoList.append('li')
                .text(d3.format(",")(d3.rollup(countryData, v => d3.sum(v, d=>d["Refugees under UNHCR's mandate"]), d=>d[vis.selected_cat]).get(d.properties.name)) + " refugees under UNHCR's mandate")
                .attr('class', 'map-side-text')
            
            infoList.append('li')
                .text(d3.format(",")(d3.rollup(countryData, v => d3.sum(v, d=>d["IDPs of concern to UNHCR"]), d=>d[vis.selected_cat]).get(d.properties.name)) + " IDPs of concern to UNHCR")
                .attr('class', 'map-side-text')
            
            infoList.append('li')
                .text(d3.format(",")(d3.rollup(countryData, v => d3.sum(v, d=>d["Others of concern"]), d=>d[vis.selected_cat]).get(d.properties.name)) + " others of concern")
                .attr('class', 'map-side-text')

            // create graphs
            if(vis.selected_cat == "Country of origin") {
                // Get asylum country numbers
                let asylumData = Array.from(d3.rollup(countryData, v=> d3.sum(v, d=>d["Refugees under UNHCR's mandate"]), d=>d["Country of asylum"]), ([country, value]) => ({country, value}))
                asylumData.sort(function(a,b) {return b.value - a.value})
                asylumData = asylumData.slice(0,5)
                asylumData = asylumData.filter(d=>{return (d.value > 0)})

                // horizontal bar graph title
                d3.select('#side-title1').text(`Where refugees from ${d.properties.name} are seeking asylum`)

                // horizontal bar graph axes
                let hbar_xScale = d3.scaleLinear()
                    .range([0, vis.sideWidth1])
                    .domain([0, d3.max(asylumData, d=>d.value)])

                let hbar_yScale = d3.scaleBand()
                    .domain(asylumData.map(d=>d.country))
                    .rangeRound([0,vis.sideHeight1])
                    .paddingInner(0.1)

                let yAxis = d3.axisLeft()
                    .scale(hbar_yScale)
                
                vis.sideSvg1.append("g")
                    .attr("class", "y-axis axis");

                vis.sideSvg1.select(".y-axis")
                    .transition()
                    .duration(750)
                    .call(yAxis)

                // Draw horizontal bars
                vis.hbars = vis.sideSvg1.selectAll("rect")
                    .data(asylumData)

                vis.hbars.exit().remove()
                
                vis.hbars.enter()
                    .append("rect")
                    .merge(vis.hbars)
                    .transition()
                    .duration(750)
                    .attr("width", d=>hbar_xScale(d.value))
                    .attr("height", hbar_yScale.bandwidth())
                    .attr("y", d=>hbar_yScale(d.country))
                    .attr("fill", "#5F6F52")

                // Draw horizontal bar labels
                vis.hbarlabels = vis.sideSvg1.selectAll(".bar-label")
                    .data(asylumData)

                vis.hbarlabels.exit().remove()
                
                vis.hbarlabels.enter()
                    .append("text")
                    .merge(vis.hbarlabels)
                    .transition()
                    .duration(750)
                    .attr("class", "bar-label")
                    .attr("x", d=> hbar_xScale(d.value) + 3)
                    .attr("y", d=> hbar_yScale(d.country) + hbar_yScale.bandwidth()/2 + 3)
                    .text(d=> d.value)

                // second graph 
                vis.sideSvg2.selectAll("rect.frac-bar").remove()
                d3.select('#side-title2').text(`Refugees from ${d.properties.name} over time`)

                // group by year
                let dataByYear = Array.from(d3.rollup(countryData, v=> d3.sum(v, d=>d["Refugees under UNHCR's mandate"]), d=>d.Year), ([year, value])=>({year, value}))
                dataByYear.sort(function(a,b) {return a.year - b.year})

                // vertical bar graph axes
                let vbar_xScale = d3.scaleBand()
                    .rangeRound([0, vis.sideWidth2])
                    .paddingInner(0.1)
                    .domain(dataByYear.map(d=>vis.formatDate(d.year)))
                    
                let vbar_xAxis = d3.axisBottom()
                    .scale(vbar_xScale)
                
                vis.sideSvg2.append("g")
                    .attr("class", "x-axis axis")
                    .attr("transform", "translate(0," + vis.sideHeight2 + ")");

                vis.sideSvg2.select(".x-axis")
                    .transition()
                    .duration(750)
                    .call(vbar_xAxis)

                let vbar_yScale = d3.scaleLinear()
                    .domain([0, d3.max(dataByYear, d=>d.value)])
                    .range([vis.sideHeight2,0])

                let vbar_yAxis = d3.axisLeft()
                    .scale(vbar_yScale)
                    .ticks(5)
                
                vis.sideSvg2.append("g")
                    .attr("class", "y-axis axis");

                vis.sideSvg2.select(".y-axis")
                    .transition()
                    .duration(750)
                    .call(vbar_yAxis)

                // draw vertical bars
                vis.vbars = vis.sideSvg2.selectAll("rect.main-bar")
                    .data(dataByYear)
                
                vis.vbars.exit().remove()

                vis.vbars.enter()
                    .append("rect")
                    .merge(vis.vbars)
                    .transition()
                    .duration(750)
                    .attr("class", "main-bar")
                    .attr("width", vbar_xScale.bandwidth())
                    .attr("height", d=>vis.sideHeight2 - vbar_yScale(d.value))
                    .attr("x", d => vbar_xScale(vis.formatDate(d.year)))
                    .attr("y", d=>vbar_yScale(d.value))
                    .attr("fill", "#5F6F52")

            } else if (vis.selected_cat == "Country of asylum") {
                d3.select('#side-title1').text(`Where refugees seeking asylum in ${d.properties.name} are originally from`)

                // Get origin country numbers
                let originData = Array.from(d3.rollup(countryData, v=> d3.sum(v, d=>d["Refugees under UNHCR's mandate"]), d=>d["Country of origin"]), ([country, value]) => ({country, value}))
                originData.sort(function(a,b) {return b.value - a.value})
                originData = originData.slice(0,5)
                originData = originData.filter(d=>{return (d.value > 0)})

                // bar graph axes
                let hbar_xScale = d3.scaleLinear()
                    .range([0, vis.sideWidth1])
                    .domain([0, d3.max(originData, d=>d.value)])

                let hbar_yScale = d3.scaleBand()
                    .domain(originData.map(d=>d.country))
                    .rangeRound([0,vis.sideHeight1])
                    .paddingInner(0.1)

                let yAxis = d3.axisLeft()
                    .scale(hbar_yScale)
                
                vis.sideSvg1.append("g")
                    .attr("class", "y-axis axis");

                vis.sideSvg1.select(".y-axis")
                    .transition()
                    .duration(750)
                    .call(yAxis)

                // Draw bars
                vis.hbars = vis.sideSvg1.selectAll("rect")
                    .data(originData)

                vis.hbars.exit().remove()
                
                vis.hbars.enter()
                    .append("rect")
                    .merge(vis.hbars)
                    .transition()
                    .duration(750)
                    .attr("width", d=>hbar_xScale(d.value))
                    .attr("height", hbar_yScale.bandwidth())
                    .attr("y", d=>hbar_yScale(d.country))
                    .attr("fill", "#5F6F52")

                // Draw bar labels
                vis.hbarlabels = vis.sideSvg1.selectAll(".bar-label")
                    .data(originData)

                vis.hbarlabels.exit().remove()
                
                vis.hbarlabels.enter()
                    .append("text")
                    .merge(vis.hbarlabels)
                    .transition()
                    .duration(750)
                    .attr("class", "bar-label")
                    .attr("x", d=> hbar_xScale(d.value) + 3)
                    .attr("y", d=> hbar_yScale(d.country) + hbar_yScale.bandwidth()/2 + 3)
                    .text(d=> d.value)

                d3.select('#side-title2').text(`Asylum applications and status in ${d.properties.name} over time`)

                let countryCode = countryData[0]["Country of asylum (ISO)"]
                let countryDecisions = vis.decisionData.filter(d=>{return (d["Country of asylum (ISO)"] == countryCode)})

                console.log(countryDecisions)

                // group by year
                let totalByYear = Array.from(d3.rollup(countryDecisions, v=> d3.sum(v, d=>d["Total decisions"]), d=>d.Year), ([year, value])=>({year, value}))
                let acceptedByYear = Array.from(d3.rollup(countryDecisions, v=> d3.sum(v, d=>d["Recognized decisions"]), d=>d.Year), ([year, value])=>({year, value}))

                totalByYear.sort()
                acceptedByYear.sort()

                console.log(totalByYear)

                // vertical bar graph axes
                let vbar_xScale = d3.scaleBand()
                    .rangeRound([0, vis.sideWidth2])
                    .paddingInner(0.1)
                    .domain(totalByYear.map(d=>d.year))
                    
                let vbar_xAxis = d3.axisBottom()
                    .scale(vbar_xScale)
                    .tickValues(vbar_xScale.domain().filter(function(d,i){ return !(i%5)}))
                
                vis.sideSvg2.append("g")
                    .attr("class", "x-axis axis")
                    .attr("transform", "translate(0," + vis.sideHeight2 + ")");

                vis.sideSvg2.select(".x-axis")
                    .transition()
                    .duration(750)
                    .call(vbar_xAxis)

                let vbar_yScale = d3.scaleLinear()
                    .domain([0, d3.max(totalByYear, d=>d.value)])
                    .range([vis.sideHeight2,0])

                let vbar_yAxis = d3.axisLeft()
                    .scale(vbar_yScale)
                    .ticks(5)
                
                vis.sideSvg2.append("g")
                    .attr("class", "y-axis axis");

                vis.sideSvg2.select(".y-axis")
                    .transition()
                    .duration(750)
                    .call(vbar_yAxis)

                // draw vertical bars
                vis.vbars = vis.sideSvg2.selectAll("rect.main-bar")
                    .data(totalByYear)
                
                vis.vbars.exit().remove()

                vis.vbars.enter()
                    .append("rect")
                    .merge(vis.vbars)
                    .transition()
                    .duration(750)
                    .attr("class", "main-bar")
                    .attr("width", vbar_xScale.bandwidth())
                    .attr("height", d=>vis.sideHeight2 - vbar_yScale(d.value))
                    .attr("x", d => vbar_xScale(d.year))
                    .attr("y", d=>vbar_yScale(d.value))
                    .attr("fill", "#5F6F52")
                
                vis.fracBars = vis.sideSvg2.selectAll(".frac-bar")
                    .data(acceptedByYear)
                
                vis.fracBars.exit().remove()

                vis.fracBars.enter()
                    .append("rect")
                    .merge(vis.fracBars)
                    .transition()
                    .duration(750)
                    .attr("class", "frac-bar")
                    .attr("width", vbar_xScale.bandwidth())
                    .attr("height", d=>vis.sideHeight2 - vbar_yScale(d.value))
                    .attr("x", d => vbar_xScale(d.year))
                    .attr("y", d=>vbar_yScale(d.value))
                    .attr("fill", "#A9B388")
            }
        }

        vis.wrangleData()

    }

    wrangleData() {
        let vis = this;

        // get slider range
        let valuesDivs = document.getElementsByClassName("range-slider-value")
        let min_date = vis.parseDate(valuesDivs[0].innerHTML)
        let max_date = vis.parseDate(valuesDivs[1].innerHTML)

        vis.filteredData = vis.refugeeData.filter(d => {return (d.Year >= min_date) && (d.Year <= max_date)})

        // get selected variables
        vis.selected_cat = document.querySelector(".map-button.active").innerText
        vis.selected_val = d3.select("#attribute").property("value");

        // aggregate refugee data
        vis.dataByCountry = Array.from(d3.rollup(vis.filteredData,v=> d3.sum(v, d=>d[vis.selected_val]), d=>d[vis.selected_cat]), ([key, value]) => ({key, value}))

        vis.displayData = {}
        vis.dataByCountry.forEach(d=> {
            vis.displayData[d.key] = {
                value: d.value
            }
        })

        vis.countryInfo = {}

        Array.from(d3.group(vis.filteredData, d=>d[vis.selected_cat])).forEach(d=>{
            vis.countryInfo[d[0]] = d[1]
        })

        vis.updateVis()
    }

    updateVis() {
        let vis = this;

        let maxval = Math.log(d3.max(vis.dataByCountry, d=> d.value) + 1e-10) / Math.log(10);

        vis.colorScale.domain([0,maxval])
        vis.legendScale.domain([0, maxval])

        vis.countries
            .transition()
            .duration(750)
            .attr("fill", d=> {
                if (Object.keys(vis.displayData).includes(d.properties.name)) {
                    return vis.colorScale(Math.log(vis.displayData[d.properties.name].value + 1e-10) / Math.log(10))
                } else {
                    return "lightgray"
                }})
            .attr("cursor", "pointer");
            

        // legend axis
        vis.legendAxis = d3.axisBottom(vis.legendScale)
            .ticks(5)
            .tickFormat(function(d) {
                if (Math.pow(10, d) >= 1000000) {
                    return d3.formatPrefix(",.0", 1e6)(Math.pow(10, d))
                } else if (Math.pow(10, d) >= 1000) {
                    return d3.formatPrefix(",.0", 1e5)(Math.pow(10, d))
                } else {
                    return Math.pow(10, d)
                }
            });

        // legend axis group and call
        vis.legendAxisGroup.transition().duration(750).call(vis.legendAxis);

        // legend label
        vis.legendLabel.text(vis.selected_val)

        // Tooltip listener
        vis.countries
            .on('mouseover', function(event, d) {
                // highlight on hover
                let tooltipHTML = ''

                d3.select(this)
                    .attr('stroke', 'black')
                    .attr('fill', 'black');
                
                if (Object.keys(vis.displayData).includes(d.properties.name)) {
                    tooltipHTML =  `<div>
                    <strong>${vis.selected_cat}: ${d.properties.name}</strong>
                    <br>${vis.selected_val}: ${d3.format(",")(vis.displayData[d.properties.name].value)}
                    <br><i>Click country to learn more</i>
                </div>`
                } else {
                    tooltipHTML = `<div>
                    <strong>${d.properties.name}</strong>
                    <br>N/A
                </div>`
                }

                // show and set content
                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX +20+ "px")
                    .style("top", event.pageY + "px")
                    .html(tooltipHTML);
            })
            .on('mouseout', function(event, d) {
                d3.select(this)
                    .attr("fill", d=> {
                        if (Object.keys(vis.displayData).includes(d.properties.name)) {
                            return vis.colorScale(Math.log(vis.displayData[d.properties.name].value+ 1e-10) / Math.log(10))
                        } else {
                            return "lightgray"
                        }})
                    .attr("stroke","black")
                    .attr("stroke-opacity", 0.25);

                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html("");
            })
            .on('click', function(event, d) {
                vis.selectedCountry = d
                vis.updateSidebar(vis.selectedCountry) 
            });

        vis.updateSidebar(vis.selectedCountry)
    }
}