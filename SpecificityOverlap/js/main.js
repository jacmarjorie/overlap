var main = function () {
    //
    $('#app_container').append($('<div>').attr('id', 'specificity_overlap'));
    
    this.selector = '#specificity_overlap';
    this.width = parseInt($(this.selector).css("width"));
    this.height = 700;
    
    this.svg = d3.select(this.selector).append("svg")
        .attr("width", this.width)
        .attr("height", this.height)
    
    this.nodes = [{'name': 'ONE', 'value': 5}, {'name': 'TWO', 'value': 10}, {'name': 'THREE', 'value': 3}, {'name': 'FOUR', 'value': 2}, {'name': 'FIVE', 'value': 6}];

    this.links = [{'source': 'ONE', 'target': 'FIVE'}, {'source': 'TWO', 'target':'ONE'}, {'source': 'FOUR', 'target':'FIVE'}, {'source':'THREE', 'target':'TWO'}];

    this.specificity_overlap = new SpecificityOverlap(this.selector, this.nodes, this.links);

};

$(document).ready(main);