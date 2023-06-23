// about the scenes:
const setList = [
	'searchresheli_Variant_13_', 
	'turretsnozeroface_alone_', 
	'Helicopter_In_Trees_', 
	'compactcar_Variant_1_', 
	'compactcar_Variant_10_', 
	'compactcar_Variant_13_', 
	'compactcar_Variant_2_',
];
const image_types = {
	'SAR': '',
	'EO_Top': 'eo_',
	'EO_Fwd': 'eo2_',
};

//const incr = 15;
//const count = 360/shared.incr;
const default_type = 'SAR';

let imageLists = [];
let currentSetIndex = 0;   // scene
let currentType = default_type;       // blank for SAR, eo_, eo2_ (planned)

// dom things exclusive to main
let imageElement = document.getElementById('current-image');
let domeSelector = document.getElementById('dome-selector');
let typeSelector = document.getElementById('type-selector');

// add the setList to the selector.
for (let i = 0; i < setList.length; i++) {
	domeSelector.add(new Option('Set ' + (i+1), i));
}
domeSelector.selectedIndex = "0";

// Preload all images in all lists
function preloadAllImages() {
	for (let i = 0; i < imageLists.length; i++) {
		preloadImages(imageLists[i]);
	}
}

// Preload images -- does this actually work?
function preloadImages(list) {
	for (let i = 0; i < list.length; i++) {
		let img = new Image();
		// testing:
		//checkExist(list[i]);
		img.src = list[i];
	}
}

// Display the current image
function showCurrentImage() {
	//console.log('currentListIndex: ' + currentListIndex + ' currentIndex: ' + currentIndex);
	//console.log(imageLists[currentListIndex]);
	imageElement.src = imageLists[shared.currentGrazeIndex][shared.currentAzimuthIndex];
}

// Update the current list and image based on direction
function updateListAndImage(direction) {
	if (direction === 'next') {
		shared.currentAzimuthIndex = (shared.currentAzimuthIndex + 1) % imageLists[shared.currentGrazeIndex].length; // Wrap around
	} else if (direction === 'prev') {
		shared.currentAzimuthIndex = (shared.currentAzimuthIndex - 1 + imageLists[shared.currentGrazeIndex].length) % imageLists[shared.currentGrazeIndex].length; // Wrap around
	} else if (direction === 'down') {
		if (shared.currentGrazeIndex > 0) {
			shared.currentGrazeIndex--;
		}
	} else if (direction === 'up') {
		if (shared.currentGrazeIndex < imageLists.length - 1) {
			shared.currentGrazeIndex++;
		}
	}
	showCurrentImage();
}

// setup the list of dome images
function initDome() {
	console.log('Initializing dome.');
	imageLists = [];
	
	for (let graze_index = 0; graze_index < shared.grazeList.length; graze_index++) {
		let list = [];
		
		for (let j = 0; j < shared.count; j++) {
			let azimuth = shared.getAzimuth(j); 
			if (azimuth==0) {
				azimuth=360;
			}
			let imageName = getImageName(setList[currentSetIndex], image_types[currentType], shared.grazeList[graze_index], azimuth);
			list.push(imageName);
		}
		imageLists.push(list);
	}
	preloadAllImages();
	showCurrentImage();

}

// helper function to keep the naming conventions local
function getImageName(set_name, set_prefix, graze, azimuth) {
	let img_prefix = 'img/' + set_prefix + set_name + '/' + set_prefix + set_name;
	let prefix = img_prefix + graze;
	let imageName = prefix + '-' + String(azimuth).padStart(3, '0') + '.png';
	return imageName;
}

// light wraper to check if a given set has a given type available--this should eventually be not needed, as all will have all types
function checkType(type) {
	const img = getImageName(setList[currentSetIndex], image_types[type], shared.grazeList[0], shared.initial_azimuth);
	return checkExist(img, type);
}

// tests whether a test url exists just by checking the headers.
function checkExist(img, type) {
	const options = {
		method: 'HEAD',
		cache: 'no-store',
		mode: 'same-origin'
	};
	return fetch(img, options)
		.then((response) => {
			if (response.ok) {
				return type;
			} 
			return null;
		})
		.catch(() => {
			return null;
		});
}

// clear out the type selector dropdown.
function clearTypes() {
	for (let i = typeSelector.length-1; i >= 0; i--) {
		typeSelector.remove(i);
	}
}

// Checks if an image type exists for a given scene, and if it does, put an entry in the dropdown.
function populateTypes() {
	Promise.all(Object.keys(image_types).map(checkType))
		.then((existingImages) => {
			existingImages.forEach((type) => { 
				if (type) {
					typeSelector.add(new Option(type, type)); 
				}
			});
			console.log('All existing images added to the dropdown.');
		})
		.catch((nonExistingImage) => {
			console.error(`Image not found: ${nonExistingImage}`);
		});
	typeSelector.selectedIndex = "0";
}


// Event listeners for button clicks
shared.prevButton.addEventListener('click', function() {
	updateListAndImage('prev');
	updateAzimuthWidget();
});

shared.nextButton.addEventListener('click', function() {
	updateListAndImage('next');
	updateAzimuthWidget();
});

shared.upButton.addEventListener('click', function() {
	updateListAndImage('up');
	updateGrazeWidget();
});

shared.downButton.addEventListener('click', function() {
	updateListAndImage('down');
	updateGrazeWidget();
});

domeSelector.addEventListener('change', function() {
	//console.log('domeSelector changed: ' + domeSelector.value);
	currentSetIndex = domeSelector.value
	clearTypes();
	populateTypes();
	currentType = default_type;
	initDome();
});

typeSelector.addEventListener('change', function() {
	// change the current type and reinitialize dome
	currentType = typeSelector.value
	initDome();
});

// get the dome ready and display it
clearTypes();
populateTypes();
initDome();
updateAzimuthWidget();
updateGrazeWidget();