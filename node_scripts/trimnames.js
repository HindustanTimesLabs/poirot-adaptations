var io = require("indian-ocean");

var data = io.readDataSync("data/gender.csv");

data.forEach(d => {
	d.book = d.book.trim();
	d.gender = d.gender.toLowerCase();
	return d;
});

io.writeDataSync("data/gender.csv", data);