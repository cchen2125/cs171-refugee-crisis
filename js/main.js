// init global variables, switches, helper functions
let myBubbleVis,
    myLineVis,
    myMapVis,
    myScatterVis;

// function updateAllVisualizations(){
//     myPieChart.wrangleData()
//     myMapVis.wrangleData()
// }

// load data using promises
let promises = [    
    d3.csv('data/asylum_applications.csv'),
    d3.csv('data/asylum_decisions.csv'),
    d3.csv('data/population_bycountry.csv'),
    d3.csv('data/country_data.csv'),
    d3.csv('data/gdp_population_refugee.csv')
];

Promise.all(promises)
    .then( function(data){ initMainPage(data) })
    .catch( function (err){console.log(err)} );

// initMainPage
function initMainPage(allDataArray) {

    // log data
    console.log(allDataArray);

    // TODO: initialize new visualizations
    myLineVis = new LineVis("linevis", allDataArray[2])

    myBubbleVis = new BubbleVis("bubblevis", allDataArray[1])

    myScatterVis = new ScatterVis("scattervis", allDataArray[3], allDataArray[4], allDataArray[1])
}
