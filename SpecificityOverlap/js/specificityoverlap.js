// Copyright (c) Harms Lab
// University of Oregon
// Specificity Overlap Viewer
// Author(s): Jaclyn Smith

var SpecificityOverlap = function (selector) {

    var that = this;
    this.selector = selector;

    this.width = 960;
    this.height = 500;

    this.svg = d3.select(this.selector).append("svg")
        .attr("width", this.width)
        .attr("height", this.height);

    this.network_one = null;
    this.network_two = null;
    this.network_overlap = null;
}

SpecificityOverlap.prototype.create_network = function(connectors, check_second){

    this.connectors = connectors;
    this.check_second = check_second;
    console.log(check_second)
    var width = this.width;
    var height = this.height;

    var nodes = {};

    // Compute the distinct nodes from the links.
    this.connectors.forEach(function(link) {
      link.source = nodes[link.source] || (nodes[link.source] = {name: link.source});
      link.target = nodes[link.target] || (nodes[link.target] = {name: link.target});
    });

    if(this.check_second == true){
        width = this.width/2;
        height = this.height/2;
        this.network_two = nodes;
    }else{
        this.network_one = nodes;
    }

    var force = d3.layout.force()
        .nodes(d3.values(nodes))
        .links(this.connectors)
        .size([width, height])
        .linkDistance(60)
        .charge(-300)
        .on("tick", tick)
        .start();

    var path = this.svg.append("g").selectAll("path")
        .data(force.links())
      .enter().append("path")
        .attr("class", function(d) { return "link " });

    var circle = this.svg.append("g").selectAll("circle")
        .data(force.nodes())
      .enter().append("circle")
        .attr("r", 6)
        .attr("name", function(d){return d.name})
        .call(force.drag);

    var text = this.svg.append("g").selectAll("text")
        .data(force.nodes())
      .enter().append("text")
        .attr("x", 8)
        .attr("y", ".31em")
        .text(function(d) { return d.name; });

    // Use elliptical arc path segments to doubly-encode directionality.
    function tick() {
      path.attr("d", linkArc);
      circle.attr("transform", transform);
      text.attr("transform", transform);
    }

    function linkArc(d) {
      var dx = d.target.x - d.source.x,
          dy = d.target.y - d.source.y,
          dr = Math.sqrt(dx * dx + dy * dy);
          return "M" + d.source.x + "," + d.source.y + "L" + d.target.x + "," + d.target.y;
      //return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
    }

    function transform(d) {
      return "translate(" + d.x + "," + d.y + ")";
    }

    this.nodes = nodes;
    this.force = force;
    this.path = path;
    this.circle = circle;
    this.text = text;

}

SpecificityOverlap.prototype.overlap_networks = function(){

    console.log("NETWORK ONE");
    console.log(this.network_one);
    console.log("NETWORK TWO");
    console.log(this.network_two); 

}