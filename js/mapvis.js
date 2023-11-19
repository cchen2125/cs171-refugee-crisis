class MapVis {

    constructor(parentElement, geoData) {
        this.parentElement = parentElement;
        this.geoData = geoData;

        this.initVis()
    }

    initVis() {
        let vis = this;

        vis.margin = {top: 20, right: 20, bottom: 20, left: 20};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // scale based on the height and default  value
        let zoomFactor = vis.height / 560; 
        let scale = 249.5 * zoomFactor;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

        // add title
        vis.svg.append('g')
            .attr('class', 'title')
            .attr('id', 'map-title')
            .append('text')
            .text('Title for Map')
            .attr('transform', `translate(${vis.width / 2}, 20)`)
            .attr('text-anchor', 'middle');

        // add tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', 'mapTooltip');

        // TODO: create map projection
        vis.projection = d3.geoMercator()
            .scale(scale)
            .translate([vis.width / 2, vis.height / 2]);

        // Draw countries
        vis.countries = vis.svg.selectAll(".country")
            .data(vis.world)
            .enter()
            .append("path")
            .attr('class', 'country')
            .attr("d", vis.path)
            .attr("fill", "black");

        // TODO: fix legend

        // Create a legend group and position it
        vis.legend = vis.svg.append("g")
            .attr('class', 'legend')
            .attr('transform', `translate(${vis.width * 2.8 / 4}, ${vis.height - 20})`);

        // Draw rectangles inside the legend group
        vis.legend.selectAll('.legend-rect')
            .data(vis.colors)
            .enter()
            .append('rect')
            .attr('class', 'legend-rect')
            .attr('x', (d, i) => i * 40) // Adjust the position of the rectangles
            .attr('width', 40) // Adjust the width of each rectangle
            .attr('height', 20) // Adjust the height of each rectangle
            .attr('fill', d => d); // Fill with colors from vis.colors

        // legend scale
        let legendScale = d3.scaleBand()
            .domain(vis.colors)
            .range([0, vis.colors.length * 40]);

        // legend axis
        let legendAxis = d3.axisBottom(legendScale);

        // legend axis group and call
        vis.legendAxisGroup = vis.legend.append('g')
            .attr('class', 'legend-axis')
            .attr('transform', 'translate(0, 0)');
        vis.legendAxisGroup.call(legendAxis);

        // TODO: drag and zoom
        // create zoom handler
        vis.zoom = d3.zoom()
            .scaleExtent([1, 8])
            .on('zoom', (event) => {
                vis.svg.selectAll('path')
                    .attr('transform', event.transform);
            });

        vis.wrangleData()

    }

    wrangleData() {
        let vis = this;

        // TODO

        vis.updateVis()
    }

    updateVis() {
        let vis = this;

        // Update country color
        vis.countries
            .transition()
            .attr("fill", d=> vis.countryInfo[d.properties.name].color);

        // Tooltip listener
        vis.countries
            .on('mouseover', function(event, d) {
                // highlight on hover
                d3.select(this)
                    .attr('stroke-width', '2px')
                    .attr('stroke', 'black')
                    .attr('fill', 'rgba(173, 222, 255, 0.62)');

                // show and set content
                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px")
                    .style("top", event.pageY + "px")
                    .html(`
                        <div style="border: thin solid grey; border-radius: 5px; background: lightgrey; padding: 20px">
                            <h3>Name: ${d.properties.name}</h3>
                            <h4>Category: ${vis.countryInfo[d.properties.name].category}</h4>
                            <h4>Value: ${vis.countryInfo[d.properties.name].value}</h4>
                        </div>`);
            })
            .on('mouseout', function(event, d) {
                d3.select(this)
                    .attr('stroke-width', '0px')
                    .attr("fill", d=> vis.countryInfo[d.properties.name].color);

                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html("");
            });
    }
}