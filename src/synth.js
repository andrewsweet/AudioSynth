var piano = Synth.createInstrument('piano');
Synth.setSampleRate(20000); // sets sample rate to 20000Hz

function help(){
	console.log("Keys to use:\n Press H for help,\n1, 2, 3, 4, 5, 6, 7, 8, 9, 0 are piano keys,\n Q/A for gain,\n W/S for attack,\n E/D for decay,\n R/F for instrument type,\n ENTER to start/stop recording,\n SPACE to play and pause");
}

help();

// Q and A adjust gain
var gain   = 0.5;

// W and S adjust attack
var attack = 0.5;

// E and D adjust decay
var decay  = 0.5;

// R and F adjust instrument type
var instrumentType = 0;

var startLoopTime;
var endLoopTime;
var loopTime = null;

var isRecording = false;

var timeInLoop = 0;

var savedLoop = new Queue();
var currentLoop;

var shouldLoop = false;

var lastKeyPressTime;

var queuedNote = null;

createInstrument();
var myInstrument = Synth.createInstrument('my_sound');

function setupLoop(){
	// create a new queue
	var queue = new Queue();

	// enqueue an item
	queue.enqueue('item');

	// dequeue an item
	var item = queue.dequeue();
}

function draw() {
	var ctx = sald.ctx;

	//First, clear the screen:
	ctx.setTransform(ctx.factor,0, 0,ctx.factor, 0,0);
	ctx.fillStyle = "#f0f"; //bright pink, since this *should* be drawn over

	ctx.fillRect(0, 0, 320, 240); //<--- hardcoded size. bad style!

	//don't interpolate scaled images. Let's see those crisp pixels:
	ctx.imageSmoothingEnabled = false;
}

function clearCache(){
	Synth.setSampleRate(Synth.getSampleRate());
}

function update(elapsed) {
	if (shouldLoop){
		timeInLoop += elapsed * 1000;

		if (timeInLoop >= loopTime){
			timeInLoop = 0;
			currentLoop = savedLoop.cloneQueue();
			queuedNote = null;
		}

		if (queuedNote === null){
			queuedNote = currentLoop.dequeue();
		}

		if (queuedNote !== null && queuedNote !== undefined){
			if (queuedNote.t <= timeInLoop){
				playKey(queuedNote.key, true);
				queuedNote = null;
			}
		}
	}

	if (sald.keys["Q"]){
		gain += 0.04;
		if (gain > 1.0) gain = 1.0;

		console.log("gain: " + gain);
		setVolume(gain);
	}

	if (sald.keys["A"]){
		gain -= 0.04;
		if (gain < 0.0) gain = 0.0;

		console.log("gain: " + gain);
		setVolume(gain);
	}

	if (sald.keys["W"]){
		attack += 0.04;
		if (attack > 1.0) attack = 1.0;

		console.log("attack: " + attack);
		clearCache();
	}

	if (sald.keys["S"]){
		attack -= 0.04;
		if (attack < 0.0) attack = 0.0;

		console.log("attack: " + attack);
		clearCache();
	}

	if (sald.keys["E"]){
		decay += 0.04;
		if (decay > 1.0) decay = 1.0;

		console.log("decay: " + decay);
		clearCache();
	}

	if (sald.keys["D"]){
		decay -= 0.04;
		if (decay < 0.0) decay = 0.0;

		console.log("decay: " + decay);
		clearCache();
	}
}

function createInstrument(){
	// Load a sound profile from an object...
	Synth.loadSoundProfile({
		// name it
		name: 'my_sound',
		// WIP: return the length of time, in seconds, the attack lasts
		attack: function(sampleRate, frequency, volume) { 
			return 0;
		},
		// WIP: return a number representing the rate of signal decay.
		// larger = faster decay
		dampen: function(sampleRate, frequency, volume) { 
			return 1;
		},
		// wave function: calculate the amplitude of your sine wave based on i (index)
		wave: function(i, sampleRate, frequency, volume) {
			var v = Math.sin(2 * Math.PI * (i/sampleRate) * frequency);

			var mod = [];

			var base = function(x) {
				x = x || 0;
				return Math.sin((2 * Math.PI) * (i / sampleRate) * frequency + (x * Math.PI));
			};

			if (instrumentType > 2){
				mod.push(function(x) { 
					return 1 * Math.sin(2 * Math.PI * ((i / sampleRate) * frequency) + x); });
			}
			if (instrumentType > 1){
				mod.push(function(x) { 
					return 0.5 * Math.sin(2 * Math.PI * ((i / sampleRate) * frequency) + x); });
			}
			if (instrumentType > 0){
				mod.push(function(x) { 
					return 0.25 * Math.sin(2 * Math.PI * ((i / sampleRate) * frequency) + x); });
			
				v = mod[0](Math.pow(base(0), 2) + (0.75 * base(0.25)) + (0.1 * base(0.5)));
			}

			var curVol = 1;

			if (i <= sampleRate * attack) {
				// Linear build-up, fast.
				curVol = (volume * (i/(sampleRate*attack))/sampleRate) / 2;
			} else {
				if (this.vars.seconds == null){
					this.vars.seconds = currentTime();
				}

				var seconds = currentTime() - this.vars.seconds;
				// Decay. Exponentially increasing (faster) decay
				// at higher frequencies due to logarithmic dampener.
				var dampen = Math.pow(0.5*Math.log((frequency*volume*decay)/sampleRate), 2);
				curVol = volume * Math.pow(
					((1-((i-(sampleRate*attack))/(sampleRate*(seconds-attack))))/2.5),dampen
				);
			}

			v = curVol * v;

			v = Math.min(Math.max(v, -1), 1);

			return v;
		}

	});
}

function setVolume(vol){
	Synth.setVolume(vol);
}

function playNote(letter, number){
	myInstrument.play(letter, number, 2);
}

function currentTime() {
	var d = new Date();
	var n = d.getTime();

	return n;
}

function stopRecording() {
	if (isRecording){
		isRecording = false;
		endLoopTime = currentTime();
		loopTime = (endLoopTime - startLoopTime);

		currentLoop = savedLoop.cloneQueue();

		console.log("Stop Recording");
		console.log(savedLoop);
	}
}

function spaceBarPressed() {
	if (loopTime != null){
		shouldLoop = !shouldLoop;

		if (shouldLoop){
			stopRecording();
			console.log("Playing loop...");
		} else {
			console.log("Stop loop.");
		}
	}
}

function playKey(key, state) {
	if (state == true){

		var isNumberKey = true;

		if (key == sald.keyCode.ONE){
			console.log("C5");
			playNote('C', 5);
		} else  if (key == sald.keyCode.TWO){
			console.log("D5");
			playNote('D', 5);
		} else if (key == sald.keyCode.THREE){
			console.log("E5");
			playNote('E', 5);
		} else if (key == sald.keyCode.FOUR){
			console.log("F5");
			playNote('F', 5);
		} else if (key == sald.keyCode.FIVE){
			console.log("G5");
			playNote('G', 5);
		} else if (key == sald.keyCode.SIX){
			console.log("A5");
			playNote('A', 5);
		} else if (key == sald.keyCode.SEVEN){
			console.log("B5");
			playNote('B', 5);
		} else if (key == sald.keyCode.EIGHT){
			console.log("C6");
			playNote('C', 6);
		} else if (key == sald.keyCode.NINE){
			console.log("D6");
			playNote('D', 6);
		} else if (key == sald.keyCode.ZERO){
			console.log("E6");
			playNote('E', 6);
		} else {
			isNumberKey = false;
		}

		if (key == sald.keyCode.ENTER){
			if (isRecording){
				// Stop Recording
				stopRecording();
			} else {
				// Start Recording
				savedLoop = new Queue();

				shouldLoop = false;
				isRecording = true;
				startLoopTime = currentTime();

				console.log("Start Recording");
			}
		}

		if (key == sald.keyCode.SPACEBAR){
			spaceBarPressed();
		} else if (key == sald.keyCode.SPACE){ // Depends on version of SALD
			spaceBarPressed();
		}

		if (isRecording && isNumberKey){
			var time = currentTime();

			var t = time - startLoopTime;

			savedLoop.enqueue({t : t, key : key});

			console.log("SAVED " + key);
		}
	}
}

function key(key, state) {
	playKey(key, state);

	if (state){
		if (key == sald.keyCode.R){
			instrumentType++;
			if (instrumentType > 3) instrumentType = 3;

			console.log("instrumentType: " + instrumentType);
			clearCache();
		} else if (key == sald.keyCode.F){
			instrumentType--;
			if (instrumentType < 0) instrumentType = 0;

			console.log("instrumentType: " + instrumentType);
			clearCache();
		} else if (key == sald.keyCode.H){
			help();
		}
	}
}


module.exports = {
	draw:draw,
	update:update,
	key:key
};
