const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
});

function getBlock() {
	let block = parseInt(params.block);
	if (block && block >= 1 && block <= 8)
	{
		return block;
	}
	block = 1;
	console.log("Defaulting to block " + block);
	return block;
}
function getCond() {
	let cond = params.cond;
	if (cond && (cond=='gain' || cond=='loss')) {
		return cond;
	}
	cond = 'gain';
	console.log("Defaulting to " + cond);
	return cond;
}
function getType() {
	let stype = params.type;
	if (stype && ['ellipse', 'scatter'].includes(stype))
	{
		return stype;
	}
	stype='scatter';
	console.log("Defaulting to " + stype);
	return stype;
}

var block_num = getBlock();
var cond = getCond();
var stype = getType();
var data = {
	'ID' : 'mainDiv',
	'blockNum' : block_num,
	'csvFileURL' : './'+stype+'/Block0' + block_num + 'Info.txt', // has info about each stimulus
	'imgHeight' : 540, // int
	'imgWidth' : 540, // int
	'maxQuestions' : 30,
	'imgURLBase' : './'+stype+'/', // this+filename is URL to image
	'blockNumCounter' : block_num,
	'acc_points' : 100,
	'speed_points' : 20,
	'max_block_points' : 3600,
	'rt_decay' : 2.5, //check these values!
	'max_time' : 10,
	'Condition' : cond,
	
};

console.log("I am qute_2d.js!");
function readyFun()
	{
		let ID = data.ID;
		data.count = 1;
		data['cumulative_score_Training0' + data.blockNum] = 0;
		data['fileIndex'] = 86; // how far into the file to skip
		
		document.body.style.cursor = 'wait';
		
		/* open csv file containing information on images for given block
		* then load all images prior to starting block
		* then wait for user to click button
		* then run the round 
		*/
		openFile()
			.then(ArrDone => loadImg(ArrDone))
			.then(ArrDone=>waitToContinue(ID, ArrDone))
			.then(ArrDone=>runRound(ID, ArrDone))
			.catch(err => {
					console.log(err); 
					alert("An unrecoverable error occurred."); 
					document.body.style.cursor = "not-allowed";
					document.getElementById("instructions").innerHTML = "<b style='color: red'>Error</b>";
				});

	};

/************************************************************
* Open *.csv that contains all image data for given block.
***********************************************************/
function openFile(ArrDone)
{
	return new Promise((resolve, reject) => {
		var file = data.csvFileURL;
		var index = data.fileIndex;

		var rawFile = new XMLHttpRequest();
		rawFile.open("GET",file,false);
		rawFile.onreadystatechange = function() {
			if(rawFile.readyState === 4) {
				if(rawFile.status === 200 || rawFile.status === 0)
				{
					var result = rawFile.responseText;
					//var result = result.slice(index);
					
					//split by line
					ArrDone = result.split(/\r?\n/);
					console.log("Shifting first item: " + ArrDone.shift());
					console.log("ArrDone: " + ArrDone);

					// ArrDone holds image data
					resolve(ArrDone);
				}
				else
				{
					reject("Error loading " + file + ": " + rawFile.status);
				}
			}
		}
		rawFile.send(null);
	});
}

/*****************************************************
* Uses array from OpenFile() to load images for block.
*****************************************************/
function loadImg(fileArr){
	return new Promise(resolve => {
		let height = data.imgHeight; //parseInt("${e://Field/imgHeight}");
		let width = data.imgWidth; //parseInt("${e://Field/imgWidth}");
		var imgCount = 0;
		var imgLoaded = 0;
		var imgArr = [];
		var result = [];
		
		// randomize order the images will be viewed within block
		var permutation = [1,2,3,4,5,6,7,8,9,10,
						  11,12,13,14,15,16,17,18,19,
						  20,21,22,23,24,25,26,27,28,
						  29,30];
		permutation = shuffle(permutation);

		var j;
		for(j = 0; j < data.maxQuestions; j++)
		{
			var temp = fileArr[imgCount].split("\t",1);
			console.log("" + j + ": " + fileArr[imgCount]);
			const image = new Image();
			image.src = data.imgURLBase+temp[0];
			image.id = temp[0];

			imgArr[j]=image;

			// event listener will trigger when image is loaded.
			image.addEventListener('load', e => {
				imgLoaded++;
				document.getElementById("instructions").innerHTML = "<b>Loaded image "+imgLoaded+".</b>";
				if(imgLoaded == data.maxQuestions)
				{
					document.getElementById("instructions").innerHTML = "<b>Click Start to begin Block "+data.blockNumCounter+".</b>";
					resolve({
						fileArr: fileArr,
						imgArr: imgArr,
						perm: permutation
					});
				}
			});

			imgCount++;
		}
	});
}

/**********************************************************
* After images are loaded, shows start button.
* Waits for user to click the start button to begin block.
************************************************************/
function waitToContinue(ID, ArrDone)
{
	return new Promise(resolve => {
		document.body.style.cursor = 'default';	
		
		var btn = document.createElement("BUTTON");
		btn.innerHTML = "Start";
		btn.id = "startBtn";
		document.getElementById(ID).appendChild(btn);
		
		document.getElementById("startBtn").style.backgroundColor ="#007AC0";
		document.getElementById("startBtn").style.border ="none";
		document.getElementById("startBtn").style.color ="#ffffff";
		document.getElementById("startBtn").style.fontSize ="16px";
		document.getElementById("startBtn").style.padding ="8px 20px";
		document.getElementById("startBtn").style.borderRadius ="4px";
		document.getElementById("startBtn").style.textAlign ="center";
		document.getElementById("startBtn").style.textDecoration ="none";

		//jQuery("#startBtn").on("click", function () {
		document.getElementById("startBtn").onclick = function () {
			var BTN = document.getElementById('startBtn');
			document.getElementById(ID).removeChild(BTN);

			document.getElementById("instructions").innerHTML = "Click image.";

			resolve(ArrDone);
		};
	});
}

/**********************************************************
* Stores image data for current image in variables
* Displays image from image array and permutation number.
* Waits for user response
* Calculates data based on condition
* Stores data
* Continues to next image (round)
************************************************************/
function runRound(ID, ArrDone)
{	
	console.log("Starting runRound.");
	let imgArr = ArrDone.imgArr;
	let fileArr = ArrDone.fileArr;
	let perm = ArrDone.perm;
	
	let JSON = "{";
	
	let default_size = 600;

	let height = data.imgHeight; //parseInt("${e://Field/imgHeight}");
	let width = data.imgWidth; //parseInt("${e://Field/imgWidth}");
	let acc_points = data.acc_points; //parseInt("${e://Field/acc_points}");
	let speed_points = data.speed_points; //parseInt("${e://Field/speed_points}");
	let max_block_points = data.max_block_points; //parseInt("${e://Field/max_block_points}");
	let rt_decay = data.rt_decay; //parseInt("${e://Field/rt_decay}");
	let max_time = data.max_time; //parseInt("${e://Field/max_time}");
	let condition = data.Condition; //"${e://Field/Condition}";
	
	let count = data.count; //parseInt(Qualtrics.SurveyEngine.getEmbeddedData('count'));
	let cumulative_score = data['cumulative_score_Training0' + data.blockNum]; //parseFloat(Qualtrics.SurveyEngine.getEmbeddedData('cumulative_score_Training0'+'${e://Field/blockNum}'));	
	console.log("Cumulative score: " + cumulative_score);
	
	let blockNum = data.blockNum; //parseInt("${e://Field/blockNum}");
	let blockNumCount = data.blockNumCounter; //parseInt("${e://Field/blockNumCounter}");
	
	var fileData = ("nonsense	" + fileArr[perm[count-1]-1]).split("\t");
	let file = fileData[1];
	let type = fileData[2];
	let nsrc = parseFloat(fileData[3]);
	let mux = parseFloat(fileData[4]);
	let muy = parseFloat(fileData[5]);
	let Vx = parseFloat(fileData[6]);
	let Vy = parseFloat(fileData[7]);
	let cov = parseFloat(fileData[8]);
	let imgJSON = fileData[9];
	let is_doppel = fileData[10];
	let doppel_src = fileData[11];
	let doppel_how = fileData[12];
	let doppel_crot = fileData[13];
	
	let acc_score = 0;
	let speed_score = 0;
	let time0 = 0;
	let time1 = 0;
	var timerID;
	let clickCount = 0;

	const sigma = [[Vx, cov], [cov, Vy]];

	var temp = rel2px(mux,muy,width,height);
	let x_correct = temp[0];
	let y_correct = temp[1];
	let max_dens = bvGaussianPdf(mux,muy,mux,muy,sigma);

	JSON += "\'BlockNumberInOrder\':\'"+blockNum+"\',";
	JSON += "\'BlockNumberOrderSeen\':\'"+blockNumCount+"\',";
	JSON += "\'QuestionInOrder\':\'"+perm[count-1]+"\',";
	JSON += "\'QuestionOrderSeen\':\'"+count+"\',";
	JSON += "\'file\':\'"+file+"\',";
	JSON += "\'nsrc\':\'"+nsrc+"\',";
	JSON += "\'type\':\'"+type+"\',";
	JSON += "\'mux\':"+mux+",";
	JSON += "\'muy\':"+muy+",";
	JSON += "\'Vx\':"+Vx+",";
	JSON += "\'Vy\':"+Vy+",";
	JSON += "\'Cov\':"+cov+",";
	JSON += "\'is_doppel\':\'"+is_doppel+"\',";
	JSON += "\'doppel_src\':\'"+doppel_src+"\',";
	JSON += "\'doppel_how\':\'"+doppel_how+"\',";
	JSON += "\'doppel_crot\':\'"+doppel_crot+"\',";
	JSON += "\'json\':"+imgJSON+",";
	JSON += "\'x_correct_px\':"+x_correct+",";
	JSON += "\'y_correct_px\':"+y_correct+",";
	JSON += "\'max_dens\':"+max_dens+",";
	//check that width and height are set
	//draw image in canvas on screen after 0.5 seconds
	
	if (isNaN(width)){
		console.log("Width is unset!");
		width=default_size;
	}
		
	if (isNaN(height)){
		console.log("Height is unset!");
		height=default_size;
	}
	
	console.log("About to create canvas. Width: " + width + " Height: " + height);
	let canvas1 = document.createElement("CANVAS");
	canvas1.id = 'canvas1';
	canvas1.height = height;
	canvas1.width = width+90;
	var ctx = canvas1.getContext('2d');
	document.getElementById(ID).appendChild(canvas1);
	
	setTimeout(function () {
		console.log("About to draw image: " + imgArr[perm[count-1]-1]);
		ctx.drawImage(imgArr[perm[count-1]-1], 0, 0, imgArr[perm[count-1]-1].width, imgArr[perm[count-1]-1].height, 0, 0, canvas1.width-90, canvas1.height);

		//start 10 second timer
		time0 = performance.now();
		timerID = setTimeout(timeComplete, 10000, count, ID,JSON,condition,cumulative_score,ArrDone);
	},500);
	
	//Wait for a mousedown click on image from user
	//jQuery("#canvas1").on("mousedown", function () {
	document.getElementById('canvas1').onmousedown = function() { // Pick up here!
		time1 = performance.now();
		var x = 0;
		var y = 0;
		if(clickCount == 0 && typeof timerID == "number")
		{
			//first click on image
			
			clickCount = 1;
			clearTimeout(timerID);
			//jQuery("#canvas1").css("pointer-events", "none"); // make the canvas no longer a valid target for pointer events
			document.getElementById('canvas1').style.setProperty("pointer-events", "none");
			var debounce = setTimeout(Debounce,100);

			//store time it took for click
			var ans_time_msec = (time1-time0);
			
			//store pixel (x,y)
			let rect = canvas1.getBoundingClientRect();
			x = event.clientX - rect.left;
			y = event.clientY - rect.top;
			
			//Qualtrics.SurveyEngine.setEmbeddedData('x', x);
			//Qualtrics.SurveyEngine.setEmbeddedData('y', y);
			data.x = x;
			data.y = y;

			//draw XO feedback on image
			drawFeedback(ctx, x, y, x_correct, y_correct);

			//calculate click in pixels and relative to image
			let rxy = px2rel(x, y, width, height);

			JSON += "\'x_click_px\':"+x+",";
			JSON += "\'y_click_px\':"+y+",";
			JSON += "\'x_click_rel\':"+rxy[0]+",";
			JSON += "\'y_click_rel\':"+rxy[1]+",";
			JSON += "\'click_time_msec\':"+ans_time_msec+",";

			//calculate max density, click density, and click ratio
			console.log(JSON);
			let click_dens = bvGaussianPdf(rxy[0], rxy[1], mux, muy, sigma);
			let click_ratio = click_dens/max_dens;
			console.log("click_dens: " + click_dens + ", max_dens: " + max_dens);

			//calculate accuracy score and speed score
			acc_score = click_ratio*acc_points;
			speed_score = speed_points*Math.max(0, Math.pow((1-(ans_time_msec/(max_time*1000))),rt_decay));
			console.log("acc_score: " + acc_score);
			console.log("speed_score: " + speed_score);
			if(condition.localeCompare("gain")==0)
			{
				//GAIN
				//round scores to print to screen.
				var round_acc_score =  Math.round(acc_score);
				var round_speed_score =  Math.round(speed_score);
				var round_cumulative_score = Math.round(cumulative_score) + round_acc_score + round_speed_score;
				cumulative_score += acc_score + speed_score;
				
				var fontsize = (35/540)*canvas1.width;
				ctx.font = Math.trunc(fontsize)+"px Arial";
				ctx.fillStyle = "green";
				ctx.strokeStyle = 'white';
				ctx.lineWidth = 1;
				ctx.textAlign = 'right';
				ctx.fillText("Accuracy score = +" + round_acc_score,width*0.9,50);
				ctx.strokeText("Accuracy score = +" + round_acc_score,width*0.9,50);
				ctx.fillText("Speed score = +" + round_speed_score,width*0.9,100);
				ctx.strokeText("Speed score = +" + round_speed_score,width*0.9,100);
				ctx.fillText("Total gained = +" + (round_speed_score+ round_acc_score),width*0.9,150);
				ctx.strokeText("Total gained = +" + (round_speed_score+ round_acc_score),width*0.9,150);

				//draw score bar
				var heightTemp = canvas1.height-30;

				var scoreFillHeight =Math.round(heightTemp*cumulative_score/max_block_points);
				var roundScoreFillHeight = Math.round(heightTemp* (acc_score + speed_score)/max_block_points);

				ctx.font = "15px Arial";
				ctx.fillStyle = "black";
				ctx.textAlign = 'left';
				ctx.fillText(round_cumulative_score + "/" + max_block_points,width+10,20);

				ctx.fillStyle = "#8adb78";
				ctx.fillRect(width+10, 30, 65, heightTemp-scoreFillHeight);

				ctx.fillStyle = "#b2ff9d";
				ctx.fillRect(width+10, heightTemp+30-scoreFillHeight, 65, roundScoreFillHeight);

				ctx.fillStyle = "#20b91d";
				ctx.fillRect(width+10, heightTemp+30-(scoreFillHeight-roundScoreFillHeight), 65, scoreFillHeight-roundScoreFillHeight);
			}
			else
			{
				//LOSS
				//calculate scores and print on image
				acc_score -= acc_points;
				speed_score -= speed_points;
				
				var round_acc_score =  Math.round(acc_score);
				var round_speed_score =  Math.round(speed_score);
				var round_cumulative_score = Math.round(cumulative_score) + round_acc_score + round_speed_score;
				cumulative_score += acc_score + speed_score;
				
				var fontsize = (35/540)*canvas1.width;
				ctx.font = Math.trunc(fontsize)+"px Arial";
				ctx.fillStyle = "red";
				ctx.strokeStyle = 'white';
				ctx.lineWidth = 1;
				ctx.textAlign = 'right';
				ctx.fillText("Accuracy score = -" + round_acc_score*-1,width*0.9,50);
				ctx.strokeText("Accuracy score = -" + round_acc_score*-1,width*0.9,50);
				ctx.fillText("Speed score = -" + round_speed_score*-1,width*0.9,100);
				ctx.strokeText("Speed score = -" + round_speed_score*-1,width*0.9,100);
				ctx.fillText("Total lost = -" + (round_speed_score+ round_acc_score)*-1,width*0.9,150);
				ctx.strokeText("Total lost = -" + (round_speed_score+ round_acc_score)*-1,width*0.9,150);

				//draw score bar
				var heightTemp = canvas1.height-30;

				var scoreFillHeight =Math.round(heightTemp*cumulative_score/max_block_points)*-1;
				var roundScoreFillHeight = Math.round(heightTemp*(acc_score + speed_score)/max_block_points)*-1;
				
				ctx.font = "15px Arial";
				ctx.fillStyle = "black";
				ctx.textAlign = 'left';
				ctx.fillText((3600+round_cumulative_score) + "/" + max_block_points,width+10,20);
				
				ctx.fillStyle = "#e50001";
				ctx.fillRect(width+10, scoreFillHeight+30, 65, heightTemp-scoreFillHeight);
				
				ctx.fillStyle = "#ffbdaa";
				ctx.fillRect(width+10, 30+(scoreFillHeight-roundScoreFillHeight), 65, roundScoreFillHeight);
				
				ctx.fillStyle = "#ff785b";
				ctx.fillRect(width+10, 30, 65, scoreFillHeight-roundScoreFillHeight);
				
			}

			
			JSON += "\'click_dens\':"+click_dens+",";
			JSON += "\'click_ratio\':"+click_ratio+",";
			JSON += "\'accuracy_score\':"+acc_score+",";
			JSON += "\'speed_score\':"+speed_score+"}";

			//Qualtrics.SurveyEngine.setEmbeddedData('cumulative_score_Training0'+blockNum, cumulative_score);
			data['cumulative_score_Training0' + blockNum] = cumulative_score;
			//Qualtrics.SurveyEngine.setEmbeddedData('TrainingBlock0'+blockNum+'_'+perm[count-1], JSON);
			data['TrainingBlock0'+blockNum+'_'+perm[count-1]] = JSON;
			//Qualtrics.SurveyEngine.setEmbeddedData('count',count+1);
			data.count = count + 1;
		}
		else if(clickCount == 1)
		{
			//Second click on image
			//Remove text to leave XO drawing and score bar
			clickCount = 2;
			//jQuery("#canvas1").css("pointer-events", "none");
			document.getElementById('canvas1').style.setProperty("pointer-events","none");
			var debounce = setTimeout(Debounce,100);
			
			ctx.clearRect(0,0,width,height);
			ctx.drawImage(imgArr[perm[count-1]-1], 0, 0, imgArr[perm[count-1]-1].width, imgArr[perm[count-1]-1].height, 0, 0, canvas1.width-90, canvas1.height);
			
			//x = Qualtrics.SurveyEngine.getEmbeddedData('x');
			x = data.x;
			//y = Qualtrics.SurveyEngine.getEmbeddedData('y');
			y = data.y;
			
			drawFeedback(ctx, x, y, x_correct, y_correct);
		}
		else if(clickCount == 2)
		{
			//third click to continue to next image (round)
			if(count<data.maxQuestions) // '${e://Field/maxQuestions}'
			{
				//more images, continue to next image
				var oldcanv = document.getElementById('canvas1');
				document.getElementById(ID).removeChild(oldcanv)
				runRound(ID, ArrDone);
			}
			else
			{
				//all images have been seen, continue to next block
				//tempthis.clickNextButton();
				endRound(cumulative_score, perm);
			}
		}
		else{console.log(clickCount,typeof timerID);}
	};
}

/**********************************************************
* If 10 second timer runs out, store data to show.
************************************************************/
function timeComplete(count,ID,JSON,condition,cumulative_score,ArrDone)
{
	let perm = ArrDone.perm;
	
	if(condition.localeCompare("gain")==0)
	{
		//string saved in gain condition is assigned 
		JSON += "\'x_click_px\':0,";
		JSON += "\'y_click_px\':0,";
		JSON += "\'x_click_rel\':0,";
		JSON += "\'y_click_rel\':0,";
		JSON += "\'click_time_msec\':10000,";
		JSON += "\'click_dens\':0,";
		JSON += "\'click_ratio\':0,";
		JSON += "\'accuracy_score\':0,";
		JSON += "\'speed_score\':0}";
	}
	else
	{
		//string saved in loss condition is assigned 
		JSON += "\'x_click_px\':0,";
		JSON += "\'y_click_px\':0,";
		JSON += "\'x_click_rel\':0,";
		JSON += "\'y_click_rel\':0,";
		JSON += "\'click_time_msec\':10000,";
		JSON += "\'click_dens\':0,";
		JSON += "\'click_ratio\':0,";
		JSON += "\'accuracy_score\':-100,";
		JSON += "\'speed_score\':-20}";
		
		//Qualtrics.SurveyEngine.setEmbeddedData('cumulative_score_Training0'+'${e://Field/blockNum}', cumulative_score-20-100);
		data['cumulative_score_Training0'+data.blockNum] = cumulative_score-20-100;
	}

	//Qualtrics.SurveyEngine.setEmbeddedData('TrainingBlock0'+'${e://Field/blockNum}'+'_'+perm[count-1], JSON);
	data['TrainingBlock0'+data.blockNum+'_'+perm[count-1]]=JSON;
	//Qualtrics.SurveyEngine.setEmbeddedData('count',count+1);
	data.count = count+1;
	if(count<data.maxQuestions) //Qualtrics.SurveyEngine.setEmbeddedData('TrainingBlock0'+'${e://Field/blockNum}'+'_'+perm[count-1], JSON);
	{
		//continue to next image
		var oldcanv = document.getElementById('canvas1');
		document.getElementById(ID).removeChild(oldcanv);
		runRound(ID, ArrDone);
	}
	else
	{
		//end round
		//tempthis.clickNextButton();
		//alert("Round Over");
		endRound(data['cumulative_score_Training0'+data.blockNum], perm);

	}
}

/**********************************************************
* Debounce makes sure the clicks are intentional 
************************************************************/
function Debounce()
{
	document.getElementById("canvas1").style.setProperty("pointer-events", "auto");
	//jQuery("#canvas1").css("pointer-events", "auto");	
}

function drawFeedback(context, x, y, rightx, righty) {
	var sz = (10/540)*canvas1.width;
	context.lineWidth = 3.0;
	context.strokeStyle = 'red';
	context.filleStyle = 'red';
	context.moveTo(x-sz, y-sz);
	context.lineTo(x+sz, y+sz);
	context.stroke();
	context.moveTo(x-sz, y+sz);
	context.lineTo(x+sz, y-sz);
	context.stroke();

	context.strokeStyle = 'green';
	context.fillStyle = 'green';
	context.beginPath();
	context.arc(rightx, righty, sz, 0, 2*Math.PI);
	context.stroke();
}

/**********************************************************
* (x,y) realtive to image converted to pixels
************************************************************/
function rel2px(rx, ry, width, height){
	var sx = (0.5 + rx)*width;
	var sy = (0.5 - ry)*height;
	return [sx, sy];
}

/**********************************************************
* (x,y) pixels converted to realtive to image
************************************************************/
function px2rel(sx, sy, width, height){
	var rx = sx/width - 0.5;
	var ry = -1.0 * (sy/height - 0.5);
	return [rx, ry];
}

/**********************************************************
* calculate pdf using x, y, mux, muy, and sigma
************************************************************/
function bvGaussianPdf(x, y, mux, muy, sigma) {
	var sx = Math.sqrt(sigma[0][0]);
	var sy = Math.sqrt(sigma[1][1]);
	var rho = sigma[1][0]/(sx*sy);

	var term1 = 1/(2*Math.PI*sx*sy*Math.sqrt(1- Math.pow(rho,2)));
	var term2 = -1/(2*(1-Math.pow(rho,2)));
	let term3 = (Math.pow((x-mux),2))/(Math.pow(sx,2));
	term3 += (Math.pow((y-muy),2))/(Math.pow(sy,2));
	term3 -= (2*rho*(x - mux)*(y - muy))/(sx*sy);

	return term1*Math.exp(term2*term3);
}

/**********************************************************
* shuffle purmutation array for randomization
* Fisher-Yates Algorithm 
************************************************************/
function shuffle(array)
{
	var m = array.length, t, i;

	// While there remain elements to shuffle…
	while (m) {

		// Pick a remaining element…
		i = Math.floor(Math.random() * m--);

		// And swap it with the current element.
		t = array[m];
		array[m] = array[i];
		array[i] = t;
	}

	return array;
}
/**********************************************************
* Display a round-end message.
* Web demo only
************************************************************/
function endRound(cumulative_score, perm)
{
	
	var oldcanv = document.getElementById('canvas1');
	document.getElementById(data.ID).removeChild(oldcanv);
	var endMessage = "<H1>Round Over</H1><br />Final score: " + Math.round(cumulative_score) + "<br />";
	if(data.blockNum < 8)
	{
		let nextBlock = block_num + 1;
		endMessage += '<a href="index.html?block=' + nextBlock + '&cond=' + cond + '&type=' + stype + '">Next block</a></br>';
	}
	endMessage += "<h2>Round Details</h2><br />"
	var j;
	for(j = 0; j < data.maxQuestions; j++)
	{
		endMessage += "" + j + ": " + data['TrainingBlock0'+data.blockNum+'_'+perm[j]] + "<br />";
	}
	document.getElementById(data.ID).innerHTML =  endMessage;
}