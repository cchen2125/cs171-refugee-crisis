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
    d3.json('data/asylum_applications.csv'),
    d3.json('data/asylum_decisions.csv'),
    d3.json('data/population_bycountry.csv')
];

Promise.all(promises)
    .then( function(data){ initMainPage(data) })
    .catch( function (err){console.log(err)} );

// initMainPage
function initMainPage(allDataArray) {

    // log data
    console.log(allDataArray);

    // TODO: initialize new visualizations

}
