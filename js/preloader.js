d3.json("data/image-list.json", function(error, data){
	if (error) throw error;

	data.forEach(function(img, index){
		addLoadEvent(preloader("img/covers/" + img, index));
		
	});

});

// better image preloading @ https://perishablepress.com/press/2009/12/28/3-ways-preload-images-css-javascript-ajax/
function preloader(url, index) {

	// d3.select("#header").append("div").attr("class", "cell").style("background-image", "url(" + url + ")");

	d3.select("body").append("div").attr("id", "preload-" + index);

	if (document.getElementById) {
		document.getElementById("preload-" + index).style.background = "url(" + url + ") no-repeat -9999px -9999px";
	}

}

function addLoadEvent(func) {
	var oldonload = window.onload;
	if (typeof window.onload != "function") {
		window.onload = func;
	} else {
		window.onload = function() {
			if (oldonload) {
				oldonload();
			}
			func();
		}
	}
}