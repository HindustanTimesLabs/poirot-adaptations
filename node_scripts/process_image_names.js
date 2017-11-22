var fs = require("fs");
var io = require("indian-ocean");
var jz = require("jeezy");

var path = "img/covers";
var images = fs.readdirSync(path);
var data = io.readDataSync("data/films.csv");

var image_list = [];

images.forEach(image => {
	var out = jz.str.toSnakeCase(image.replace("_First_Edition_Cover", "").replace(".jpg", "").toLowerCase()) + ".jpg";
	var last_index = out.lastIndexOf("_");
	image_list.push({img: out, year: +out.substring(last_index).replace("_", "").replace(".jpg", "")});
	fs.renameSync(path + "/" + image, path + "/" + out);
});

image_list = jz.arr.sortBy(image_list, "year").map(d => d.img)

// .filter(d => d.indexOf("orient_express") != -1)

// .filter(d => d.indexOf("2017") == -1);

// data.forEach((d, i) => {
// 	var movie_name = jz.str.toSnakeCase(d.adaptation) + "_" + d.adaptation_year + ".jpg"
// 	d.image = image_list.indexOf(movie_name) !== -1 ? true : false;
// 	if (!d.image) console.log(d.adaptation, d.adaptation_year);
// 	return d;
// });

io.writeDataSync("data/image-list.json", image_list);
// io.writeDataSync("data/films.csv", data);