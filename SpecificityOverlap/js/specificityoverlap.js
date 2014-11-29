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
        .attr("height", this.height-100);

    // create datastructures for overlap

    this.network_one = [];
    this.connectors_one = [];
    this.network_two = [];
    this.connectors_two = [];
    this.network_overlap = [];
    this.network_connectors = [];
}

SpecificityOverlap.prototype.create_network = function(connectors, check_second){

    this.connectors = connectors;
    this.check_second = check_second;
    var width = this.width;
    var height = this.height;

    var nodes = {};

    // Compute the distinct nodes from the links.
    this.connectors.forEach(function(link) {
      link.source = nodes[link.source] || (nodes[link.source] = {name: link.source, 'is_overlapped': false, 'is_second': check_second});
      link.target = nodes[link.target] || (nodes[link.target] = {name: link.target, 'is_overlapped': false, 'is_second': check_second});
    });

    if(this.check_second == true){
        width = this.width/2;
        height = this.height/2;
        this.connectors_two = this.connectors;
        this.network_two = nodes;

        //reset overlap structures
        this.network_connectors = [];
        this.network_overlap = [];
        
    }else{
        this.connectors_one = this.connectors;
        this.network_one = nodes;
    }

    var force = d3.layout.force()
        .nodes(d3.values(nodes))
        .links(this.connectors)
        .size([width, height])
        .linkDistance(function(d){
            return d.distance*20;
        })
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

    this.network_connectors = this.connectors_one.concat(this.connectors_two);

    //reset links
    this.connectors_one = [];
    this.connectors_two = [];

    //construct overlap node set
    this.network_overlap = this.network_two;
    var names = [];
    for(var i in this.network_overlap){
        names.push(this.network_overlap[i].name)
    }
    for(var i in this.network_one){
        var check_name = this.network_one[i].name;
        if(names.indexOf(check_name) == -1){
            this.network_overlap[check_name] = this.network_one[i]
        }else{

            //update node overlapped value
            this.network_overlap[check_name]['is_overlapped'] = true;
            console.log(this.network_overlap[check_name])

            //update nodes in links
            for(var i in this.network_connectors){
                if(this.network_connectors[i].source.name == check_name){
                    this.network_connectors[i].source = this.network_overlap[check_name]
                }else if (this.network_connectors[i].target.name == check_name){
                    this.network_connectors[i].target = this.network_overlap[check_name]
                }
            }
        }
    }
    //reset nodes
    this.network_one = [];
    this.network_two = [];

    var force = d3.layout.force()
        .nodes(d3.values(this.network_overlap))
        .links(this.network_connectors)
        .size([this.width, this.height])
        .linkDistance(function(d){
            return d.distance*20;
        })
        .charge(-1000)
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
        .attr("name", function(d) {return d.name} ) 
        .attr("style", function(d) {if (d.is_overlapped == true) {return 'fill:#432F75'} })
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

    this.force = force;
    this.path = path;
    this.circle = circle;
    this.text = text;
   
}