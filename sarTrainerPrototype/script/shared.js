shared = {
	// shared parameters of the image set
	grazeList: [18, 24, 30],
	initial_azimuth: 360,
	incr: 15.0,
	get count() {
		return (360.0 / this.incr);
	},
	
	// state variables
	currentGrazeIndex: 0,
	currentAzimuthIndex: 0,
	
	// get functions
	getAzimuth(idx){
		return (this.initial_azimuth + idx*this.incr + 360) % 360;
	},
	getCurrentAzimuth(){
		return (this.getAzimuth(this.currentAzimuthIndex) + 360) % 360;
	},
	
	// DOM things
	prevButton: document.getElementById('prev-button'),
	nextButton: document.getElementById('next-button'),
	upButton: document.getElementById('up-button'),
	downButton: document.getElementById('down-button'),
}