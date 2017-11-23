// magic numbers
var ww = window.innerWidth;

// setup tip
var tip = d3.select("#gender-chart").append("div")
  .attr("class", "gender-tip");

tip.append("div").attr("class", "book-name");
tip.append("div").attr("class", "type murderer");
tip.append("div").attr("class", "kill");
tip.append("div").attr("class", "type victim");

var colors = {red: "#df5a49", blue: "#2880b9", green: "#45b29d"};
var color_names = {man: colors.blue, woman: colors.red};
var element = "#gender-chart";
var margin = {left: 40, top: 60};
var setup = d3.marcon()
	.element(element)
	.width(+jz.str.keepNumber(d3.select(element).style("width")))
	.height(d3.max([600, window.innerHeight]))
	.left(margin.left)
	.right(40)
	.top(margin.top)
	.bottom(20);
setup.render();
var width = setup.innerWidth(), height = setup.innerHeight(), svg = setup.svg();

var x = d3.scaleBand()
	.rangeRound([0, width]);

var y = d3.scaleLinear()
  .rangeRound([0, height]);

var size = 8;

d3.csv("data/gender.csv", function(err, data){

	// data types
	data.forEach(function(d){
		d.book_year = +d.book_year;
		return d;
	});

	var genders = jz.arr.uniqueBy(data, "gender");
	var types = jz.arr.uniqueBy(data, "type");

  var books_data = jz.arr.uniqueBy(data, "book").map(function(book){
    var lookup = data.filter(function(d){ return d.book == book; });
    var this_data = [];
    types.forEach(function(type){
      genders.forEach(function(gender){
        this_data.push({
          type: type,
          gender: gender,
          count: lookup.filter(function(d){ return d.type == type && d.gender == gender}).length
        })
      });
    });

    function filter_facet(type, gender){
      return this_data.filter(function(d){ return d.type == type && d.gender == gender; })[0].count;
    }

    return {
      book: book,
      murderer_man: filter_facet("murderer", "man"),
      murderer_woman: filter_facet("murderer", "woman"),
      victim_man: filter_facet("victim", "man"),
      victim_woman: filter_facet("victim", "woman"),
    }
  });

	// domains
	x.domain(types);
	y.domain(d3.extent(data, function(d){ return d.book_year; }));

  // top labels
  var top_label = svg.selectAll(".top-label")
      .data(types)
    .enter().append("text")
      .attr("class", "top-label")
      .attr("x", function(d){ return x(d) + (x.bandwidth() / 2); })
      .attr("y", -margin.top)
      .attr("dy", 12)
      .text(function(d){ return jz.str.toStartCase(d) + "s"; })

  var simulation = d3.forceSimulation(data)
  		.force("y", d3.forceY(function(d){ return y(d.book_year); }).strength(1))
      .force("x", d3.forceX(function(d){ return x(d.type) + (x.bandwidth() / 2); }))
      .force("collide", d3.forceCollide(size + 1))
      .stop();

  // try 250 ticks
  for (var i = 0; i < 250; ++i) simulation.tick();

  // for loop for axes because you can't send different functions into .call()
  types.forEach(function(type){
  	var axis = type == "murderer" ? d3.axisLeft(y) : d3.axisRight(y);
  	axis
      .tickFormat(function(d){ return +d; })
      .tickSizeOuter(0)
      .tickSizeInner(type == "murderer" ? -width :  0)

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
        .polygons(data)).enter().append("g")
          .attr("class", function(d){ return "cell " + d.data.type + " " + jz.str.toSlugCase(d.data.name) + " " +jz.str.toSlugCase(d.data.book); });
  
  // voronoi
  var voronoi = cell.append("path")
      .attr("d", function(d) { return d == undefined ? null : "M" + d.join("L") + "Z"; });

  // circle
  cell.append("circle")
    .attr("r", size)
    .style("fill", function(d){ return color_names[d.data.gender]; })
    .attr("cx", function(d) { return d == undefined ? null : d.data.x; })
    .attr("cy", function(d) { return d == undefined ? null :  d.data.y; });

  svg.selectAll(".cell")
    .on("mouseover", tipon);

  d3.event = document.createEvent('MouseEvent');
  d3.event.initMouseEvent("mouseover");

  var starter = data.filter(function(d){ return d.book == "Murder on the Orient Express"; })[0];
  tipon({data: starter});
  // d3.select(".cell.murderer.greta-ohlsson.murder-on-the-orient-express").on("mouseover")();

  function tipon(d){
      d3.selectAll(".cell")
        .classed("selected", false);

      d3.selectAll(".cell." + jz.str.toSlugCase(d.data.book))
        .classed("selected", true);

      var book_lookup = books_data.filter(function(book_obj){
        return book_obj.book == d.data.book;
      })[0];

      var murderer_man_html = "<span style='color: " + color_names.man + "'>" + book_lookup.murderer_man + " " + (book_lookup.murderer_man == 1 ? "man" : "men") + "</span>";
      var murderer_woman_html = "<span style='color: " + color_names.woman + "'>" + book_lookup.murderer_woman + " " + (book_lookup.murderer_woman == 1 ? "woman" : "women") + "</span>";
      var murderers_html = book_lookup.murderer_man > 0 && book_lookup.murderer_woman > 0 ?  murderer_man_html + " &amp; " + murderer_woman_html :
        book_lookup.murderer_man > 0 ? murderer_man_html :
        murderer_woman_html;

      var victim_man_html = "<span style='color: " + color_names.man + "'>" + book_lookup.victim_man + " " + (book_lookup.victim_man == 1 ? "man" : "men") + "</span>";
      var victim_woman_html = "<span style='color: " + color_names.woman + "'>" + book_lookup.victim_woman + " " + (book_lookup.victom_woman == 1 ? "woman" : "women")  + "</span>";
      var victims_html = book_lookup.victim_man > 0 && book_lookup.victim_woman > 0 ?  victim_man_html + " &amp; " + victim_woman_html :
        book_lookup.victim_man > 0 ? victim_man_html :
        victim_woman_html;

      // content in the tip
      d3.select(".gender-tip .book-name").html(d.data.book + " (" + d.data.book_year + ")");
      d3.select(".gender-tip .type.murderer").html(murderers_html);
      d3.select(".gender-tip .kill").html(d3.sum([book_lookup.murderer_man, book_lookup.murderer_woman]) == 1 ? "kills" : "kill")
      d3.select(".gender-tip .type.victim").html(victims_html);


      var tip_pos = d3.select(".gender-tip").node().getBoundingClientRect();
      var window_offset = window.pageYOffset;
      var window_padding = 40;
      var y_pos = y(d.data.book_year);
      var svg_offset = $("#gender-chart svg").position();

      var top = y_pos - (tip_pos.height * 1.2) + svg_offset.top;
      top = top < $(window).scrollTop() ? $(window).scrollTop() : top;
      top = top < svg_offset.top ? svg_offset.top : top;

      d3.select(".gender-tip")
        .style("left", (ww / 2) - (tip_pos.width / 2) + "px")
        .style("top", top + "px");

      var lines_data = data.filter(function(r){ return r.book == d.data.book; });
      
      lines_data.forEach(function(line){
        var x1 = calcx1(line);
        var x2 = calcx2(line);
        var y1 = y(line.book_year);
        var y2 = top - svg_offset.top;
        var orient = line.book == "Murder on the Orient Express";
        line.points = [
          {
            x: line.type == "murderer" ? x1 - size : x2,
            y: line.type == "murderer" ? y1 - (orient ? 0 : size) : y2
          },{
            x: line.type == "murderer" ? x2 : x1 + (y1 < 50 ? -size * 2 : 0),
            y: line.type == "murderer" ? y2 : y1 + (y1 < 50 ? 0 : -size * 2)
          }
        ]
      });

      var line = svg.selectAll(".tip-line")
          .data(lines_data, function(d){ return d.name; })

      line.exit().remove();

      var already_drew_murderer = false;

      line.enter().append("path")
        .attr("class", "tip-line")
        .attr("d", function(d){ 
          var dx = d.points[1].x - d.points[0].x,
            dy = d.points[1].y - d.points[0].y,
            dr = Math.sqrt(dx * dx + dy * dy);
          return "M" + d.points[0].x + "," + d.points[0].y + "A" + dr + "," + dr + " 0 0,1 " + d.points[1].x + "," + d.points[1].y;
          
        })
        .attr("marker-end", function(d){ 
          if (d.type == "murderer" && !already_drew_murderer){
            already_drew_murderer = true;
            return "url(#markerArrow)";  
          } else if (d.type !== "murderer") {
            return "url(#markerArrow)";  
          } else {
            return "";
          }
          
        })


      function calcx1(d){
        var relativePos = calcRelPos("#gender-chart", ".cell." + jz.str.toSlugCase(d.name) + " circle");
        return relativePos.left - margin.left + (d.type == "murderer" ? size * 2 : 0);
      }
      function calcx2(d){
        return (d.type == "murderer" ? -50 : 50) + width / 2;
      }

      function calcRelPos(parent, child){
        var parentPos = d3.select(parent).node().getBoundingClientRect(),
          childrenPos = d3.select(child).node().getBoundingClientRect(),
          relativePos = {};

        relativePos.top = childrenPos.top - parentPos.top,
        relativePos.right = childrenPos.right - parentPos.right,
        relativePos.bottom = childrenPos.bottom - parentPos.bottom,
        relativePos.left = childrenPos.left - parentPos.left;
        return relativePos;
      }

      d3.timeout(function(){
        $(".greta-ohlsson.murder-on-the-orient-express").click();  
      }, 2000);
      


      // var murder_lines = svg.selectAll(".murder-line")
      //     .data(makeLinesArray("murderer"));

      // murder_lines.exit().remove();

      // murder_lines.enter().append("line")
      //     .attr("class", "murder-line")
      //     .attr("x1", function(d){ return d.x1; })
      //     .attr("x2", function(d){ return d.x2; })
      //     .attr("y1", function(d){ return d.y1; })
      //     .attr("y2", function(d){ return d.y2; })

  }

});