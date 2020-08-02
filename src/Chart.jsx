import React from "react";
import * as d3 from "d3";

class Chart extends React.Component {

  componentDidUpdate() {

    // console.log('DATA', this.props.data);
    if(this.props.data.links) {
      var svg = d3.select("svg.graph"),
      width = +svg.attr("width"),
      height = +svg.attr("height");

      var color = d3.scaleOrdinal([1,2,3,4]);

      var simulation = d3.forceSimulation()
          .force("link", d3.forceLink().id(function(d) { return d.id; }))
          .force("charge", d3.forceManyBody())
          .force("center", d3.forceCenter(width / 2, height / 2));
      

      var link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(this.props.data.links)
        .enter().append("line")
          .attr("stroke-width", function(d) { return Math.sqrt(d.value); });


      var node = svg.append("g")
          .attr("class", "nodes")
        .selectAll("g")
        .data(this.props.data.nodes)
        .enter().append("g")
        
      var circles = node.append("circle")
          .attr("r", 5)
          .attr("fill", function(d) { return color(d.group); });
          // .call(d3.drag()
          //     .on("start", dragstarted)
          //     .on("drag", dragged)
          //     .on("end", dragended));
    
      var lables = node.append("text")
          .text(function(d) {
            return d.id;
          })
          .attr('x', 6)
          .attr('y', 3);
    
      node.append("title")
          .text(function(d) { return d.id; });
    
      simulation
          .nodes(this.props.data.nodes)
          .on("tick", ticked);
    
      simulation.force("link")
          .links(this.props.data.links);
    
      function ticked() {
        link
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });
    
        node
            .attr("transform", function(d) {
              return "translate(" + d.x + "," + d.y + ")";
            })
      }
    }    
  }

  render() {
    return <svg className="graph" width="960" height="600"></svg>;
  }
}

export default Chart;
