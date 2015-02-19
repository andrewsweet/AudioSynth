
var mainloop = require('sald:mainloop.js');

sald.size = {x:0, y:0, mode:"multiple"};
sald.scene = require('synth.js');

window.main = function main() {
	mainloop.start(document.getElementById("canvas"));
};