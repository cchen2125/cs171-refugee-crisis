// init global variables, switches, helper functions
let myBubbleVis,
    myLineVis,
    myMapVis;

// function updateAllVisualizations(){
//     myPieChart.wrangleData()
//     myMapVis.wrangleData()
// }

// load data using promises
let promises = [    
    d3.json('data/asylum_applications.csv'),
    d3.json('data/asylum_decisions.csv'),
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
