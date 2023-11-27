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
    d3.csv('data/gdp_population_refugee.csv'),
    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json")
];

Promise.all(promises)
    .then( function(data){ initMainPage(data) })
    .catch( function (err){console.log(err)} );

// initMainPage
function initMainPage(allDataArray) {

    // log data
    console.log(allDataArray);

    // initialize new visualizations
    myLineVis = new LineVis("linevis", allDataArray[2])

    myBubbleVis = new BubbleVis("bubblevis", allDataArray[1])

    myScatterVis = new ScatterVis("scattervis", allDataArray[3], allDataArray[4], allDataArray[1])

    myMapVis = new MapVis("mapvis", allDataArray[5], allDataArray[2])
    makeSlider()
}

function categoryChange() {
    myScatterVis.updateVis();
}

function activateButton(button) {
    const buttons = document.querySelectorAll('.map-button');
    buttons.forEach(button => {
        button.classList.remove('active');
    });
    button.classList.add('active');

    myMapVis.wrangleData()
}

function updateMap() {
    myMapVis.wrangleData()
}

function makeSlider() {
    // get slider
    myMapVis.slider = document.getElementById('time-period-slider')

    // define slider functionality
    noUiSlider.create(myMapVis.slider, {
        start: [parseInt(myMapVis.formatDate(d3.min(myMapVis.refugeeData, d=> d.Year))), parseInt(myMapVis.formatDate(d3.max(myMapVis.refugeeData, d=> d.Year)))],
        connect: true,
        behaviour: 'tap-drag',
        step: 1,
        margin: 0,
        range: {
            'min': parseInt(myMapVis.formatDate(d3.min(myMapVis.refugeeData, d=> d.Year))),
            'max': parseInt(myMapVis.formatDate(d3.max(myMapVis.refugeeData, d=> d.Year)))
        }
    });

    // get slider range values
    var valuesDivs = document.getElementsByClassName("range-slider-value");
    valuesDivs[0].innerHTML = myMapVis.formatDate(d3.min(myMapVis.refugeeData, d=> d.Year))
    valuesDivs[1].innerHTML = myMapVis.formatDate(d3.max(myMapVis.refugeeData, d=> d.Year))

    // attach an event listener to the slider
    myMapVis.slider.noUiSlider.on('update', function (values, handle) {
        valuesDivs[handle].innerHTML = Math.round(values[handle]);

        updateMap()
    });
}