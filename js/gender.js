var colors = {red: "#df5a49", blue: "#2880b9", green: "#45b29d"};
var color_names = {man: colors.blue, woman: colors.red};
var element = "#gender-chart";
var setup = d3.marcon()
	.element(element)
	.width(+jz.str.keepNumber(d3.select(element).style("width")))
	.height(d3.max([600, window.innerHeight]))
	.left(40)
	.right(40)
	.top(20)
	.bottom(20);
setup.render();
var width = setup.innerWidth(), height = setup.innerHeight(), svg = setup.svg();

var x = d3.scaleBand()
	.rangeRound([0, width]);

var y = d3.scaleLinear()
  .rangeRound([0, height]);

var size = 5;

d3.csv("data/gender.csv", function(err, data){

	// data types
	data.forEach(function(d){
		d.book_year = +d.book_year;
		return d;
	})

	var genders = jz.arr.uniqueBy(data, "gender");
	var types = jz.arr.uniqueBy(data, "type");

	// domains
	x.domain(types);
	y.domain(d3.extent(data, function(d){ return d.book_year; }));

  var simulation = d3.forceSimulation(data)
  		.force("y", d3.forceY(function(d){ console.log(d.book_year); return y(d.book_year); }).strength(1))
      .force("x", d3.forceX(function(d){ return x(d.type) + (x.bandwidth() / 2); }))
      .force("collide", d3.forceCollide(size + 1))
      .stop();

  // try 250 ticks
  for (var i = 0; i < 250; ++i) simulation.tick();

  // for loop for axes because you can't send different functions into .call()
  types.forEach(function(type){
  	var axis = type == "murderer" ? d3.axisLeft(y) : d3.axisRight(y);
  	axis.tickFormat(function(d){ return +d; })

	  svg.append("g")
				.attr("class", "axis")
			  .attr("transform", "translate(" + (type == "murderer" ? 0 : width) + ", 0)")
		    .call(axis);
  });

	// JOIN
  var cell = svg.append("g")
      .attr("class", "cells")
      .selectAll("g").data(d3.voronoi()
        .extent([[0, 0], [width, height]])
        .x(function(d) { return d.x; })
        .y(function(d) { return d.y; })
        .polygons(data)).enter().append("g");
  
  // voronoi
  var voronoi = cell.append("path")
      .attr("d", function(d) { return d == undefined ? null : "M" + d.join("L") + "Z"; });

  // circle
  cell.append("circle")
      .attr("r", size)
      .style("fill", function(d){ return color_names[d.data.gender]; })
      .attr("cx", function(d) { return d == undefined ? null : d.data.x; })
      .attr("cy", function(d) { return d == undefined ? null :  d.data.y; });


});