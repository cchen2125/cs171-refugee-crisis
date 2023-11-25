class MapVis {

    constructor(parentElement, geoData, refugeeData) {
        this.parentElement = parentElement;
        this.geoData = geoData;
        this.refugeeData = refugeeData;

        console.log(geoData)
        console.log(refugeeData)

        this.initVis()
    }

    initVis() {
        let vis = this;

        vis.margin = {top: 10, right: 10, bottom: 10, left: 10};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = 0.5*vis.width - vis.margin.top - vis.margin.bottom;

        // scale based on the height and default  value
        let zoomFactor = vis.height / 650; 
        let scale = 249.5 * zoomFactor;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

        // draw background
        vis.svg.append("rect")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr("fill", "#ADDEFF")

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

        // TODO: fix legend

        // Create a legend group and position it
        vis.legend = vis.svg.append("g")
            .attr('class', 'legend')
            .attr('transform', `translate(${vis.width / 30}, ${vis.height *0.9})`);

        // legend scale
        vis.legendScale = d3.scaleLinear()
            .range([0, vis.width * 0.25]);

        // legend axis group
        vis.legendAxisGroup = vis.legend.append('g')
            .attr('class', 'legend-axis')
            .attr('transform', 'translate(0,'+vis.height / 30 +')');

        // Create a linear gradient definition in the <defs> section
        vis.defs = vis.legend.append("defs");

        vis.gradient = vis.defs.append("linearGradient")
            .attr("id", "gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");

        //TODO: drag and zoom
        /*//create zoom handler
        vis.zoom = d3.zoom()
            .scaleExtent([1, 8])
            .on('zoom', (event) => {
                vis.svg.selectAll('path')
                    .attr('transform', event.transform);
            });*/

        // color scale
        vis.colorScale = d3.scaleSequential(d3.interpolateReds)

        vis.wrangleData()

    }

    wrangleData() {
        let vis = this;

        vis.selected_cat = "Country of origin"
        vis.selected_val = "Refugees under UNHCR's mandate"

        // aggregate refugee data
        vis.parseTime = d3.timeParse("%Y")
        
        vis.refugeeData.forEach(function(d) {
            d.Year = vis.parseTime(d.Year);
        })

        vis.dataByCountry = Array.from(d3.rollup(vis.refugeeData,v=> d3.sum(v, d=>d[vis.selected_val]), d=>d[vis.selected_cat]), ([key, value]) => ({key, value}))

        vis.displayData = {}
        vis.dataByCountry.forEach(d=> {
            vis.displayData[d.key] = {
                value: d.value
            }
        })

        console.log(vis.displayData)

        /* get country name from geodata
        vis.geoData.objects.countries.geometries.forEach(d=>{
            console.log(d.properties)
        })*/

        vis.updateVis()
    }

    updateVis() {
        let vis = this;

        let maxval = Math.log(d3.max(vis.dataByCountry, d=> d.value)) / Math.log(10);

        console.log(vis.displayData["China"].value)
        console.log(Math.log(vis.displayData["China"].value) / Math.log(10))

        vis.colorScale.domain([0,maxval])
        vis.legendScale.domain([0,10**maxval])

        // Update country color
        vis.countries
            .transition()
            .attr("fill", d=> {
                if (Object.keys(vis.displayData).includes(d.properties.name)) {
                    return vis.colorScale(Math.log(vis.displayData[d.properties.name].value) / Math.log(10))
                } else {
                    return "lightgray"
                }});
        
        //legend color bar
        vis.gradient.selectAll("stop")
            .data(vis.colorScale.ticks().map((t, i, n) => ({ offset: `${100*i/n.length}%`, color: vis.colorScale(t) })))
            .enter().append("stop")
            .attr("offset", d => d.offset)
            .attr("stop-color", d => d.color);
        
        vis.legend.append("rect")
            .attr("width", vis.legendScale(10**maxval))
            .attr("height", vis.height / 30)
            .attr("fill", "url(#gradient)")
            

        // legend axis
        vis.legendAxis = d3.axisBottom(vis.legendScale).tickFormat(d3.format(".0e"));

        // legend axis group and call
        vis.legendAxisGroup.call(vis.legendAxis);

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
                    <h3>Name: ${d.properties.name}</h3>
                    <h4>Value: ${vis.displayData[d.properties.name].value}</h4>
                </div>`
                } else {
                    tooltipHTML = `<div>
                    <h3>Name: ${d.properties.name}</h3>
                    <h4>Value: N/A</h4>
                </div>`
                }

                // show and set content
                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px")
                    .style("top", event.pageY + "px")
                    .html(tooltipHTML);
            })
            .on('mouseout', function(event, d) {
                d3.select(this)
                    .attr("fill", d=> {
                        if (Object.keys(vis.displayData).includes(d.properties.name)) {
                            return vis.colorScale(Math.log(vis.displayData[d.properties.name].value) / Math.log(10))
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
            });
    }
}