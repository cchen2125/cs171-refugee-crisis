// init global variables, switches, helper functions
let myBubbleVis,
    myLineVis,
    myMapVis,
    myScatterVis,
    myBarVis;

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

    // populate select box
    countries = [...new Set(allDataArray[2].map(d=> {return d["Country of origin"]}))]
    addOptions(document.getElementById("guess"), countries)
    addOptions(document.getElementById("asylum-guess"), countries)

    // initialize new visualizations
    myLineVis = new LineVis("linevis", allDataArray[2])

    myBarVis = new BarVis("barvis", allDataArray[1])

    myBubbleVis = new BubbleVis("bubblevis", allDataArray[1])

    myScatterVis = new ScatterVis("scattervis", allDataArray[3], allDataArray[4], allDataArray[1])

    myMapVis = new MapVis("mapvis", allDataArray[5], allDataArray[2], allDataArray[1])
    makeSlider()
}

// function for populating select box options
function addOptions(selectbox, options) {
    options.sort()

    options.forEach(value => {
        let option = document.createElement("option")
        option.text = value
        option.value = value

        selectbox.appendChild(option)
    })
}

// function for checking user's guess for country of origin
function checkAnswer() {
    let guess = document.getElementById("guess").value
    let close_answers = ["Afghanistan", "Ukraine"]

    if (guess == "") {
        document.getElementById("warning").innerHTML = "Please submit an answer"
    } else {
        if (guess == "Syria") {
            document.getElementById("answer").innerHTML = "<h1 class='slide-text'>That's right, it is actually Syria.</h1>"
        } else if (close_answers.includes(guess)) {
            document.getElementById("answer").innerHTML = "<h1 class='slide-text'>Close. It's actually Syria.</h1>"
        } else {
            document.getElementById("answer").innerHTML = "<h1 class='slide-text'> Actually, it's Syria.</h1>"
        }
        document.getElementById("answer").innerHTML += "<p>Below is a more comprehensive look at where refugees have been coming from over the past 6 years. Hover over the points for detailed values.<p>"
        document.getElementById("linegraph-section").style.visibility = "visible";
        document.getElementById("temp-text").style.display = "none";

        let newsection = parseInt(location.href.slice(location.href.length - 1, location.href.length)) + 1
        location.href = location.href.slice(0, location.href.length - 1) + newsection  
    }
}

// function for checking user's guess for asylum country
function checkAnswerAsylum() {
    let guess = document.getElementById("asylum-guess").value
    let close_answers = ["United States of America", "France", "Canada"]

    if (guess == "") {
        document.getElementById("asylum-warning").innerHTML = "Please submit an answer"
    } else {
        if (guess == "Germany") {
            document.getElementById("asylum-answer").innerHTML = "<h1 class='slide-text'>Correct! It is actually Germany.</h1>"
        } else if (close_answers.includes(guess)) {
            document.getElementById("asylum-answer").innerHTML = "<h1 class='slide-text'>Close. It's actually Germany.</h1>"
        } else {
            document.getElementById("asylum-answer").innerHTML = "<h1 class='slide-text'> Actually, it's Germany.</h1>"
        }
        document.getElementById("asylum-answer").innerHTML += "<p>Here are the top 20 countries that have recognized the most asylum applications over time.<p>"
        document.getElementById("barchart-section").style.visibility = "visible";
        document.getElementById("asylum-temp-text").style.display = "none";

        newsection = parseInt(location.href.slice(location.href.length - 1, location.href.length)) + 1
        console.log(newsection)
        location.href = location.href.slice(0, location.href.length - 1) + newsection  
        console.log(location.href)

    }
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