# cs171-refugee-crisis

## Introduction
"Mapping the Refugee Crisis" is a web-based visual data story about the current (as of December 2023) state of refugees and asylum seekers in our world.
It uses an interactive storytelling approach to raise awareness of the refugee crisis.

**Team Members**: Clara Chen, Taylor Fang

* URL to website: [https://cchen2125.github.io/cs171-refugee-crisis/](https://cchen2125.github.io/cs171-refugee-crisis/)
* URL to video: [https://youtu.be/yKH8l5SqJUA](https://youtu.be/yKH8l5SqJUA)
* Process Book: [https://docs.google.com/document/d/1P12H7F17XzUsfqX8sPPzvUxVMHjt_plFDdUFQl1d3TM/edit?usp=sharing](https://docs.google.com/document/d/1P12H7F17XzUsfqX8sPPzvUxVMHjt_plFDdUFQl1d3TM/edit?usp=sharing)

**Note: This project is optimized for desktop and Google Chrome.**

## Project Structure
- `index.html`: html file for the project
- `css/`: contains library CSS files as well as our custom `styles.css`, `aos-delays.css` containing animation durations for the AOS library, and `fullpage` folder with the library CSS.
- `img/`: contains icons, background videos, and visuals used in presentation slides.
- `js/`: files for each individual visualization.
    - `main.js`: loads the data and the visualization.
    - `barVis.js`: bar visualization graph to show top countries with asylum acceptances
    - `bubbleVis.js`: bubble visualization graph to show recognized versus total asylum decisions
    - `lineVis.js`: line visualization graph to show refugees by country over time
    - `lineVis2.js`: second line visualization graph to show overall number of refugees worldwide
    - `mapVis.js`: map visualization graph with full information on all countries as well as additional bar charts
    - `scatterVis.js`: scatter visualization graph to show relation of asylum acceptances and GDP as well as other country economic data

data_description.pdf contains a description of the datasets used.

## Libraries Used

- [Bootstrap](https://getbootstrap.com/)
- [D3](https://d3js.org/)
- [fullPage](https://alvarotrigo.com/fullPage/)
- [noUiSlider](https://refreshless.com/nouislider/)
