// magic numbers
var book_title_height = 12,
	margin = {left: 20, right: 20},
	outer_width = d3.min([600, window.innerWidth]);

// setup
var setup = d3.marcon()
	.element("#viz")
	.width(outer_width)
	.height(2000)
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

// set search width
d3.select(".search-field")
		.style("width", outer_width - margin.left - margin.right - keepNumber(d3.select(".controls-col.sort").style("width")) + "px")

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
				console.log(book_lookup);
				return {
					type: d.adaptation_type,
					name: d.adaptation,
					book: d.book,
					year: d.adaptation_year,
					hide: book_lookup.hide ? true : false
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

		// EXIT
		baseline.exit()
			.transition()
				.style("opacity", 0).remove();
		
		book_title.exit()
			.transition()
				.style("opacity", 0).remove();

		media_rect.exit()
			.transition()
				.style("opacity", 0).remove();

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

		// ENTER
		baseline.enter().append("line")
				.attr("class", "baseline")
				.attr("x1", 0)
				.attr("x2", width)
				.attr("y1", calcMiddle)
				.attr("y2", calcMiddle);

		book_title.enter().append("text")
				.attr("class", "book-title")
				.attr("x", -margin.left)
				.attr("y", function(d){ return y(d.book); })
				.attr("dy", book_title_height)
				.style("fill", function(d){ return d.hide ? "#eee" : "black"; })
				.html(function(d){ return d.book + " <tspan>Published in " + d.year + " | " + d.adaptation_count + " adaptation" + (d.adaptation_count == 1 ? "" : "s") + "</tspan>"; });

		media_rect.enter().append("rect")
				.attr("class", function(d){ return "media-rect " + jz.str.toSlugCase(d.book) + " " + jz.str.toSlugCase(d.type) ; })
				.attr("x", function(d){ return x(d.year) - (media_width / 2); })
				.attr("y", setBookY)
				.attr("width", media_width)
				.attr("height", media_height)
				.style("fill", setFill)

		// HELPER FUNCTIONS		
		function setFill(d){
			
			if (d.hide){
				return "#eee"
			} else {
				var type = jz.str.toSlugCase(d.type);	
				return	type == "tv-series" ? colors.red :
					type == "tv-film" ? colors.blue :
					type == "film" ? colors.green :
					"black";
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

function keepNumber(x){
	return x.replace(/[^\d.-]/g, "");
}