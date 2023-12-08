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
        vis.colorScale = d3.scaleSequential(d3.interpolateReds)
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
        vis.updateSidebar = function(d) {
            if (d == "none") {
                return
            }
            if (!Object.keys(vis.displayData).includes(d.properties.name)) {
                d3.select('#country-info').html('').append('strong').text(vis.selected_cat + ": " + d.properties.name)
                return
            }

            d3.select('#country-info').html('').append('strong').text(vis.selected_cat + ": " + d.properties.name)
        
            let countryData = vis.countryInfo[d.properties.name]
        
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

            d3.select('#country-info').append("p").text('')

            if(vis.selected_cat == "Country of origin") {
                d3.select('#country-info').append("p").text('TODO: Top 5 countries where refugees from this country are seeking asylum bar chart')
                d3.select('#country-info').append("p").text('TODO: refugees from this country over time line chart')
            } else if(vis.selected_cat == "Country of asylum") {
                d3.select('#country-info').append("p").text('TODO: Top 5 countries where refugees seeking asylum from this country originate from bar chart')
                d3.select('#country-info').append("p").text('TODO: rejected vs. accepted asylum applications from this country over time stacked bar chart')
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

        let maxval = Math.log(d3.max(vis.dataByCountry, d=> d.value)) / Math.log(10);

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
                }})
            .attr("cursor", "pointer");
            

        // legend axis
        vis.legendAxis = d3.axisBottom(vis.legendScale).tickFormat(d3.formatPrefix(",.0", 1e6));

        // legend axis group and call
        vis.legendAxisGroup.call(vis.legendAxis);

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
                    <strong>${d.properties.name}</strong>
                    <br>${d3.format(",")(vis.displayData[d.properties.name].value)}
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
            })
            .on('click', function(event, d) {
                vis.selectedCountry = d
                vis.updateSidebar(vis.selectedCountry) 
            });

        vis.updateSidebar(vis.selectedCountry)
    }
}