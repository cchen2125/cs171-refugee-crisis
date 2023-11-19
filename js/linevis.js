// Constructor function for line graph
class LineVis {
    constructor(_parentElement, _data) {
        this.parentElement = _parentElement;
        this.data = _data;

        this.initVis();
    }

    initVis() {
        let vis=this;

        vis.wrangleData();
    }

    wrangleData() {
        let vis=this;

        vis.updateVis();
    }

    updateVis() {
        let vis=this;
    }
}