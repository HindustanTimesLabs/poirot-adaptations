// magic numbers
var book_title_height = 12,
	outer_width = window.innerWidth,
	margin = {left: (outer_width - 600) / 2, right: (outer_width - 600) / 2};

var annotations_data = [{
	name: "Murder on the Orient Express",
	book: "Murder on the Orient Express",
	year: "2017",
	label: "This year's release was directed by Kenneth Branagh, who also stars as Poirot.",
	type: "film"
},{
	name: "Lord Edgware Dies",
	book: "Lord Edgware Dies",
	year: "1934",
	label: "The first Poirot book adapted into a movie was released the year after publication.",
	type: "film"
}, {
	name: "The Mysterious Affair at Styles",
	book: "The Mysterious Affair at Styles",
	year: "1920",
	label: "The first Poirot book by Agatha Christie.",
	type: "book"
}, {
	name: "Agatha Christie's Poirot: The Mysterious Affair at Styles",
	book: "The Mysterious Affair at Styles",
	year: "1990",
	label: "The first time David Suchet played Poirot in the TV series.",
	type: "tv-series"
}, {
	name: "Curtain",
	book: "Curtain",
	year: "1975",
	label: "The final Poirot book has a shocking murderer.",
	type: "book"
}, {
	name: "Death on the Nile",
	book: "Death on the Nile",
	year: "1978",
	label: "The first movie in which Peter Ustinov played Poirot. He played him six times in all.",
	type: "film" 
}]

var annotations_generator = d3.annotation()
  .type(d3.annotationCallout);

// initalize the tip
var tip = d3.select("body").append("div")
	.attr("class", "tip");
tip.append("div")
	.attr("class", "title");
tip.append("div")
	.attr("class", "basic-info datum");
tip.append("div")
	.attr("class", "actor datum");
tip.append("div")
	.attr("class", "cover-image");

// setup
var setup = d3.marcon()
	.element("#viz")
	.width(outer_width)
	.height(2200)
	.right(margin.right)
	.left(margin.left)

setup.render();

var width = setup.innerWidth(), height = setup.innerHeight(), svg = setup.svg();

var x = d3.scaleLinear()
	.range([0, width]);

var y = d3.scaleBand()
	.rangeRound([0, height])
	.padding(.3)
	.align(.01);

var colors = {red: "#df5a49", blue: "#334d5c", green: "#45b29d"};

var color_types = {"tv-series": colors.red, "tv-film": colors.blue, "film": colors.green, book: "black"};

var sorts = [
	{
		id: "year",
		text: "<b>Year</b> of publication"
	}, {
		id: "name",
		text: "<b>Name</b> of book"
	}, {
		id: "adaptation_count",
		text: "Number of <b>adaptations</b>"
	}];

d3.select(".sort-wrapper")
	.selectAll(".toggle-item")
		.data(sorts)
	.enter().append("div")
		.attr("class", function(d){ return "toggle-item " + jz.str.toSlugCase(d.id) + (d.id == "adaptation_count" ? " active" : ""); })
		.attr("data-which", function(d){ return d.id; })
		.html(function(d){ return d.text; });

// load data
d3.queue()
	.defer(d3.csv, "data/films.csv")
	.await(ready);

function ready(err, data){
	if (err) throw err;

	// types
	data.forEach(function(d){
		d.adaptation_year = +d.adaptation_year;
		d.book_year = +d.book_year;
		d.adaptation = d.adaptation.trim();
		return d;
	});

	x.domain(d3.extent(jz.arr.flatten([d3.extent(data, function(d){ return d.adaptation_year; }), d3.extent(data, function(d){ return d.book_year; })])));
	y.domain(jz.arr.uniqueBy(data, "book"));
	var media_width = y.bandwidth() / 4.5;
	var media_height = y.bandwidth() / 3;
	var outline_pad = 1.5;
	var outline_width = media_width * outline_pad * 1.5;
	var outline_height = media_height * outline_pad;

	draw("adaptation_count");
	d3.selectAll(".toggle-item").on("click", function(d){
		d3.selectAll(".toggle-item").classed("active", false);
		d3.select(".toggle-item." + d.id).classed("active", true);
		draw(d.id);
	});
	d3.select(".search-field").on("keyup", function(d){
		var id = d3.select(".toggle-item.active").attr("data-which");
		draw(id);
	});

	svg.append("g")
	  .attr("class", "annotation-group")
	  .call(annotations_generator)

	function draw(sort){
		var books = jz.arr.uniqueBy(data, "book").map(function(book){ 
			var match = data.filter(function(row){ return row.book == book });
			return {type: "book", name: book, book: book, adaptation_count: match.length, year: match[0].book_year } 
		});
		if (sort == "adaptation_count") {
			
			books = jz.arr.flatten(jz.arr.uniqueBy(books, sort).reverse().map(function(count){
				return jz.arr.sortBy(books.filter(function(d){ return d.adaptation_count == count }), "year");
			}));

		} else {
			books = jz.arr.sortBy(books, sort);
		}
		
		// filter based on the search
		var val = d3.select(".search-field").property("value");
		if (val != ""){
			// books
			books.forEach(function(d){
				if (d.book.toLowerCase().indexOf(val.toLowerCase()) == -1) {
					d.hide = true
					return d;
				}
			});

			var filtered = books.filter(function(d){
				return !d.hide;
			});
			var removed = books.filter(function(d){
				return d.hide;
			});
			books = jz.arr.flatten([filtered, removed]);

		}

		y.domain(books.map(function(book){ return book.book; }));
		var media_data = jz.arr.flatten([data
			.map(function(d){ 
				var book_lookup = books.filter(function(e){ return e.book == d.book; })[0];
				return {
					type: d.adaptation_type,
					name: d.adaptation,
					book: d.book,
					year: d.adaptation_year,
					hide: book_lookup.hide ? true : false,
					actor: d.adapatation_actor,
					image: d.image
				};
			})
			.filter(function(d){
				return books.map(function(e){ return e.book }).indexOf(d.book) != -1;
			}), 
			books]);

		// JOIN	
		var baseline = svg.selectAll(".baseline")
				.data(books, function(d){ return d.name + d.year });

		var book_title = svg.selectAll(".book-title")
				.data(books, function(d){ return d.name + d.year });

		var media_rect = svg.selectAll(".media-rect")
				.data(media_data, function(d){ return d.name + d.year });

		var media_outline = svg.selectAll(".media-outline")
				.data(media_data, function(d){ return d.name + d.year });

		// UPDATE
		baseline.transition()	
				.attr("y1", calcMiddle)
				.attr("y2", calcMiddle);

		book_title.transition()
				.attr("y", function(d){ return y(d.book); })
				.style("fill", function(d){ return d.hide ? "#888" : "black"; });

		media_rect.transition()
				.attr("y", setBookY)
				.style("fill", setFill);

		media_outline.transition()
				.attr("y", function(d){ return setBookY(d) - ((outline_height - media_height) / 2) });
				
		// ENTER
		baseline.enter().append("line")
				.attr("class", "baseline")
				.attr("x1", 0)
				.attr("x2", width)
				.attr("y1", calcMiddle)
				.attr("y2", calcMiddle);

		book_title.enter().append("text")
				.attr("class", "book-title")
				.attr("x", 0)
				.attr("y", function(d){ return y(d.book); })
				.attr("dy", book_title_height)
				.style("fill", function(d){ return d.hide ? "#eee" : "black"; })
				.html(function(d){ return d.book + " <tspan>Published in " + d.year + " | " + d.adaptation_count + " adaptation" + (d.adaptation_count == 1 ? "" : "s") + "</tspan>"; });

		media_rect.enter().append("rect")
				.attr("class", function(d){ return "media-rect " + jz.str.toSlugCase(d.book) + " y-" + d.year ; })
				.attr("x", function(d){ return x(d.year) - (media_width / 2); })
				.attr("y", setBookY)
				.attr("width", media_width)
				.attr("height", media_height)
				.style("fill", setFill)

		media_outline.enter().append("rect")
				.attr("class", "media-outline")
				.attr("x", function(d){ return x(d.year) - (outline_width / 2); })
				.attr("y", function(d){ return setBookY(d) - ((outline_height - media_height) / 2) })
				.attr("width", outline_width)
				.attr("height", outline_height)
				.style("fill", "transparent")

		// process the annotations

		var annotations = annotations_data.map(function(d){

			var lookup = media_data.filter(function(e){
				return e.name == d.name && e.year == d.year;
			})[0];
			
			var obj = {note: {}, connector: {}};
			var lr = x(d.year) / width < .5 ? "left" : "right";
			var padding = 60;

			obj.note.label = d.label;
			obj.note.title = d.name + " (" + d.year + ")";
			obj.note.align = lr == "left" ? "right" : "left";
			
			obj.x = x(d.year) + (lr == "right" ? media_width / 2 : -media_width / 2);
			obj.y = setBookY(d) + (media_height / 2);

			obj.dy = height - obj.y < 200 ? -10 : 10;			
			obj.dx = lr == "left" ? -x(d.year) - padding : (width - x(d.year)) + padding;
			
			obj.connector.end = "arrow";
			// obj.connector.type = "curve";
			obj.color = lookup.hide ? "#ccc" : color_types[d.type];

			obj.className = jz.str.toSlugCase(obj.note.title);

			d3.select("." + obj.className + " .annotation-note-label").style("fill", lookup.hide ? "#ccc" : "#000");	
			
			return obj;
		});

		annotations_generator.annotations(annotations);

		svg.select(".annotation-group")
				.call(annotations_generator);

		// tip
		svg.selectAll(".media-outline")
				.on("mouseover", function(d){

					var rect_class = ".media-rect." + jz.str.toSlugCase(d.book) + ".y-" + d.year;

					d3.select(rect_class).classed("selected", true);

					tip.select(".title")
						.html(d.name);

					tip.select(".basic-info")
						.html(d.year + " <span style='color: " + color_types[jz.str.toSlugCase(d.type)] + "'>" + d.type + "</span>" + (d.actor ? " starring " + d.actor : ""));

					tip.select(".cover-image")
						.html(d.type == "book" || d.image == "true" ? "<img src='img/covers/" + jz.str.toSnakeCase(d.name) + "_" + d.year + ".jpg' />" : "");

					// if (d.actor) {
					// 	tip.select(".actor")
					// 			.html("Poirot portrayed by <b>" + d.actor + "</b>");
					// } else {
					// 	tip.select(".actor").html("");
					// }

					// position
	       	var media_pos = d3.select(rect_class).node().getBoundingClientRect();
	       	var tip_pos = d3.select(".tip").node().getBoundingClientRect();
	       	var tip_offset = 5;
	       	var window_offset = window.pageYOffset;

	       	var top = window_offset + media_pos.y - tip_pos.height - tip_offset;
	       	top = top < window_offset ? window_offset + media_pos.y + media_pos.height + tip_offset :
	       		top;

	       	d3.select(".tip")
	       		.style("opacity", .98)
	       		.style("left", (media_pos.x - tip_pos.width / 2) + "px")
	       		.style("top", top + "px");

				})
				.on("mouseout", function(){
					d3.selectAll(".media-rect").classed("selected", false);

					d3.select(".tip")
		       		.style("opacity", 0)
		       		.style("left", "-1000px")
		       		.style("top", "-1000px");
		       		
				})

		// HELPER FUNCTIONS		
		function setFill(d){
			
			if (d.hide){
				return "#eee"
			} else {
				var type = jz.str.toSlugCase(d.type);	
				return	color_types[type];
			}
			
		}

		function setBookY(d, i, data){
			var media_y = y(d.book);
			var media_x = x(d.year);
			var media_offset = "none";

			// get the set of all media and its x position
			var book_set = media_data
				.filter(function(media){ 
					return media.book == d.book 
				})
				.map(function(media){
					return {
						book: media.book,
						name: media.name,
						type: media.type,
						year: media.year,
						x: x(media.year)
					}
				});

			book_set.forEach(function(item){
			
				// if the media is lying on top
				if (media_x < item.x && (media_x + media_width) > item.x){
					media_offset = "top";
					// console.log(d.name, d.year)
				}
				// if the media is lying on bottom
				else if (item.x < media_x && (item.x + media_width) > media_x){
					media_offset = "bottom";
				}
				
			});

			var middle = calcMiddle(d) - (media_height / 2);

			return media_offset == "top" ? middle - (media_height / 2) - 1 :
				media_offset == "bottom"? middle + (media_height / 2) + 1 :
				middle;
		}

		function calcMiddle(d){
			return y(d.book) + (y.bandwidth() / 2) + book_title_height;
		}

	}

}

// make the legend


function keepNumber(x){
	return x.replace(/[^\d.-]/g, "");
}