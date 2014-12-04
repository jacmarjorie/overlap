// Copyright (c) Harms Lab
// University of Oregon
// Specificity Overlap Viewer
// Author(s): Jaclyn Smith

var SpecificityOverlap = function (selector) {

    var that = this;
    this.selector = selector;
    this.scale_factor_one = 10;
    this.scale_factor_two = 10;
    this.zoom_on = true;
    this.viewer_window = null;

    this.width = 1200;
    this.height = 1200;
    // this.width = parseInt($(window).width());
    // console.log(this.width)
    // this.height = parseInt($(window).height()-$(".page-header").height()-30);
    // console.log(this.height)

    this.svg = d3.select(this.selector).append("svg")
        .attr("width", this.width)
        .attr("height", this.height-100);

    // create datastructures for overlap
    // handle zoom
    if (this.zoom_on == true) {
        this.viewer_zoom()
        this.viewer_window = this.zoom_window;
    } else {
        this.viewer_window = this.svg; 
    }

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
    var width = this.width-100;
    var height = this.height;
    var scale_factor;

    var nodes = {};
    // Compute the distinct nodes from the links.
    this.connectors.forEach(function(link) {
     // if(!link['is_overlap']){
        link['is_second'] = check_second;
        link.source = nodes[link.source] || (nodes[link.source] = {name: link.source, 'is_overlap': false, 'is_second': check_second, 'size' : link.sSize});
        link.target = nodes[link.target] || (nodes[link.target] = {name: link.target, 'is_overlap': false, 'is_second': check_second, 'size' : link.tSize});
        //console.log(link.source.name + " -> " + link.target.name)
      // }else if(link['net_id']){
      //   console.log(link['net_id'])
      //   link.source = nodes[link.source] || (nodes[link.source] = {name: link.source, 'is_overlap': false, 'size' : link.sSize, 'net_id': link.net_id});
      //   link.target = nodes[link.target] || (nodes[link.target] = {name: link.target, 'is_overlap': false, 'size' : link.tSize, 'net_id': link.net_id});
      //   console.log(link.source.name + " -> " + link.target.name)
      // }else{
      //   link.source = nodes[link.source] || (nodes[link.source] = {name: link.source, 'is_overlap': true, 'size' : link.sSize});
      //   link.target = nodes[link.target] || (nodes[link.target] = {name: link.target, 'is_overlap': true, 'size' : link.tSize});
      //   console.log(link.source.name + " -> " + link.target.name)
      // }
    });

    // scale node sizes
    var max_size = 0;
    for(var i in nodes){
      if(nodes[i].size > max_size){
        max_size = nodes[i].size
      }
    }
    //console.log(max_size)

    if(this.check_second == true){
        width = this.width/2;
        height = this.height/2;
        this.connectors_two = this.connectors;
        this.network_two = nodes;
        this.scale_factor_two = Math.pow(10, max_size.toString().length-2)
        scale_factor = this.scale_factor_two;

        //reset overlap structures
        this.network_connectors = [];
        this.network_overlap = [];
        
    }else{
        this.connectors_one = this.connectors;
        this.network_one = nodes;
        this.scale_factor_one = Math.pow(10, max_size.toString().length-2)
        scale_factor = this.scale_factor_one;
        //console.log(scale_factor)
    }

    var force = d3.layout.force()
        .nodes(d3.values(nodes))
        .links(this.connectors)
        .size([width, height])
        .linkDistance(function(d){
            return 300;
        })
        .charge(-300)
        .on("tick", tick)
        .start();

    // bugs in drag
    var drag = d3.behavior.drag()
      .origin(function(d){return d;})
        .on("dragstart", dragstart)
        .on("drag", dragmove)
        .on("dragend", dragend);

    var path = this.viewer_window.append("g").selectAll("path")
        .data(force.links())
      .enter().append("path")
      .style('stroke', function(d){
        if(d.source.is_second == false){
          return 'blue'
        }
        return 'green'
      })
      .style('stroke-width', function(d){
          return d.distance;
      })
      .attr("class", function(d) { return "link " });

    var circle = this.viewer_window.append("g").selectAll("circle")
        .data(force.nodes())
      .enter().append("circle")
        .attr("r", function(d){
          var size = d.size/scale_factor;
          if(size){
            return size
          }
          return .001;
        })
        .attr("name", function(d){return d.name})
        .attr("style", function(d) {
          if (d.is_overlap == true){
            return 'fill:#432F75'
          } else if (d.is_second == true) {
            return 'fill:#4A9130'
          } return 'fill:#09BEE8'
        })
        .call(drag);

    var text = this.viewer_window.append("g").selectAll("text")
        .data(force.nodes())
      .enter().append("text")
        .attr("x", 8)
        .attr("y", ".31em")
        .style('font-size', '20px')
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

    function dragstart(d, i) {
        // Allows node dragging without dragging the whole tree
        d3.event.sourceEvent.stopPropagation()
        d3.select(this).classed("dragging", true);
        force.start();
    }

    function dragmove(d, i) {
        d.px += d3.event.dx;
        d.py += d3.event.dy;
        d.x += d3.event.dx;
        d.y += d3.event.dy; 
        d3.select(this).attr("x", d.x = d3.event.x).attr("y", d.y = d3.event.y)
        force.resume();
    }

    function dragend(d, i) {
        d3.select(this).classed("dragging", false);
        force.resume();
    }

    this.drag = drag;
    this.nodes = nodes;
    this.force = force;
    this.path = path;
    this.circle = circle;
    this.text = text;

}

SpecificityOverlap.prototype.overlap_networks = function(){

    console.log("CALLING")
    this.viewer_zoom()
    this.viewer_window = this.zoom_window;

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
            var old_size = this.network_overlap[check_name]['size']
            this.network_overlap[check_name]['is_overlapped'] = true;
            this.network_overlap[check_name]['size'] = this.network_one[i].size + old_size

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

    var max_size = 0;
    for(var i in this.network_overlap){
      if(this.network_overlap[i].size > max_size){
        max_size = this.network_overlap[i].size
      }
    }

    this.scale_factor = Math.pow(10, max_size.toString().length-2)
    var scale_factor = this.scale_factor;

    //reset nodes
    this.network_one = [];
    this.network_two = [];

    var force = d3.layout.force()
        .nodes(d3.values(this.network_overlap))
        .links(this.network_connectors)
        .size([this.width, this.height])
        .linkDistance(function(d){
            return 300;
        })
        .charge(-1000)
        .on("tick", tick)
        .start();

    // bugs in drag
    var drag = d3.behavior.drag()
      .origin(function(d){return d;})
        .on("dragstart", dragstart)
        .on("drag", dragmove)
        .on("dragend", dragend);

    var path = this.viewer_window.append("g").selectAll("path")
        .data(force.links())
      .enter().append("path")
        .style('stroke', function(d){
          if(d.is_second == true ){
            return 'green'
          }else if(d.is_second = true){
            return 'blue'
          }
          
        })
        .style('stroke-width', function(d){
          return d.distance;
        })
        .attr("class", function(d) { return "link " });

    var circle = this.viewer_window.append("g").selectAll("circle")
        .data(force.nodes())
      .enter().append("circle")
        .attr("r", function(d){
          var size = d.size/scale_factor;
          if(size > 5){
            return size
          }
          return 5;
        })
        .attr("name", function(d) {return d.name} ) 
        .attr("style", function(d) {
          if (d.is_overlapped == true){
            return 'fill:#432F75'
          } else if (d.is_second == true) {
            return 'fill:#4A9130'
          } return 'fill:#09BEE8'})
        .call(drag);

    var text = this.viewer_window.append("g").selectAll("text")
        .data(force.nodes())
      .enter().append("text")
        .attr("x", 8)
        .attr("y", ".31em")
        .style('font-size', '20px')
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

    function dragstart(d, i) {
        // Allows node dragging without dragging the whole tree
        d3.event.sourceEvent.stopPropagation()
        d3.select(this).classed("dragging", true);
        force.start();
    }

    function dragmove(d, i) {
        d.px += d3.event.dx;
        d.py += d3.event.dy;
        d.x += d3.event.dx;
        d.y += d3.event.dy; 
        d3.select(this).attr("x", d.x = d3.event.x).attr("y", d.y = d3.event.y)
        force.resume();
    }

    function dragend(d, i) {
        d3.select(this).classed("dragging", false);
        force.resume();
    }

    this.drag = drag;
    this.force = force;
    this.path = path;
    this.circle = circle;
    this.text = text;
   
}

SpecificityOverlap.prototype.viewer_zoom = function() {
  // Create group element for zooming
    var zoom_window = this.svg.append("g")
                .attr("id","zoom_window");
    
    // Initiate zooming
    var zoom = d3.behavior.zoom()
                .scaleExtent([.5, 2.5])
                .on("zoom", zoom_behavior);

    // Allow entire svg region to zoom
    zoom_window
        .append("rect")
        .attr("class", "overlay")
        .attr("width", this.width)
        .attr("height", this.height)
        .style('fill', 'none');
    
    // Call zoom behavior on svg
    this.svg.call(zoom)
        
    function zoom_behavior() {
        zoom_window.attr("transform", "translate(" + d3.event.translate + ") scale(" + d3.event.scale + ")")
    };
    this.zoom = zoom;
    this.zoom_window = zoom_window;
}
