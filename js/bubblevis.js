// Constructor function for bubble graph
class BubbleVis {
    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;

        this.initVis();
    }

    initVis() {
        let vis= this;

        vis.margin = {top: 20, right: 20, bottom: 20, left: 20};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

        // scale
        vis.scale = d3.scaleLinear()
            .range([0, 100]);

        // Set up the pack layout
        vis.pack = d3.pack()
            .size([vis.width, vis.height]);

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
                    totalDecisions: 0
                };
            }

            vis.displayData[country].recognizedDecisions += recognizedDecisions;
            vis.displayData[country].totalDecisions += totalDecisions;
        });

        // console.log(vis.dataByCountry)
        console.log(vis.displayData)

        vis.data = Object.entries(vis.displayData)
            .map(([country, values]) => ({ country, ...values }))
            .sort((a, b) => b.totalDecisions - a.totalDecisions)
            .slice(0, 30); // Take the top 30 countries

        console.log(vis.data)

        vis.updateVis();
    }

    updateVis() {
        let vis=this;

        // Use the pack layout on the data
        let root = d3.hierarchy({ children: vis.data })
            .sum(d => d.recognizedDecisions); // Set the size of each node based on recognized decisions

        vis.nodes = vis.pack(root).descendants();

        console.log(root)
        console.log(vis.nodes)

        // Place each (leaf) node according to the layout’s x and y values.
        let node = vis.svg.append("g")
            .selectAll()
            .data(root.leaves())
            .join("g")
            .attr("transform", d => `translate(${d.x},${d.y})`);

        // Add a filled circle.
        node.append("circle")
            .attr("fill-opacity", 0.7)
            .attr("fill", 'orange')
            .attr("r", d => d.r);

        // Add a title.
        node.append("text")
            .text(d => d.data.country)
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .style("fill", "black")
            .style("font-size", "10px") // Set the font size (adjust as needed)
            .style("font-weight", "normal")
            .call(wrap, d => d.r * 2);

        // Function to wrap text within a specified width
        function wrap(text, width) {
            text.each(function () {
                var text = d3.select(this),
                    words = text.text().split(/\s+/).reverse(),
                    word,
                    line = [],
                    lineNumber = 0,
                    lineHeight = 1.1, // ems
                    y = text.attr("y"),
                    dy = parseFloat(text.attr("dy")) || 0,
                    tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
                while (word = words.pop()) {
                    line.push(word);
                    tspan.text(line.join(" "));
                    if (tspan.node().getComputedTextLength() > width) {
                        line.pop();
                        tspan.text(line.join(" "));
                        line = [word];
                        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                    }
                }
            });
        }

        // Update / remove sequence
        // Tooltip to show exact numbers
    }
}
