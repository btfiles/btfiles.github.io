console.log('graze.js loading.');
const angleCanvas = document.getElementById('angleCanvas');
const angleDiv = document.getElementById('graze-container');
const grazeIcon = document.getElementById('graze-icon');
const grazeIconImg = document.getElementById('graze-icon-img');

const canvasRect = angleCanvas.getBoundingClientRect();
const parentRect = angleDiv.getBoundingClientRect();

angleCanvas.width = angleDiv.clientWidth;
angleCanvas.height = angleDiv.clientHeight;

const ctx = angleCanvas.getContext('2d');
const bg_color = '#AAA';
const fg_color = '#F33';
const ground_color = '#A71';
//var graze_list = [18, 24, 30];
//var graze_index = 0;

const canvas_buffer = grazeIcon.clientWidth;
const line_width = 2;

const baseGrazeRotation = 45;

const radiusExtension = grazeIcon.clientWidth / 2;

// Calculate coordinates for drawing angles
function calculateCoordinates(angle) {
  const originX = canvas_buffer; //angleCanvas.width / 2;
  const originY = angleCanvas.height - canvas_buffer;

  const radius = angleCanvas.width - (2*canvas_buffer); //Math.min(centerX, centerY) - 10;
  const endAngle = angle * (Math.PI / 180);

  const startX = originX; //centerX + radius * Math.cos(startAngle);
  const startY = originY; //centerY - radius * Math.sin(startAngle);
  const endX = originX + radius * Math.cos(endAngle);
  const endY = originY - radius * Math.sin(endAngle);
  
  const icoX = originX + (radius + radiusExtension) * Math.cos(endAngle);
  const icoY = originY - (radius + radiusExtension) * Math.sin(endAngle);
  
  const groundX = originX + radius;
  const groundY = originY;
  return { startX, startY, endX, endY, groundX, groundY, icoX, icoY };
}

// Clear the canvas
function clearCanvas() {
  ctx.clearRect(0, 0, angleCanvas.width, angleCanvas.height);
}

// Draw an angle on the canvas
function drawAngle(angle, color) {

  const { startX, startY, endX, endY, groundX, groundY, icoX, icoY } = calculateCoordinates(angle);
  
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(groundX, groundY);
  ctx.lineWidth = line_width;
  ctx.strokeStyle = ground_color;
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.lineWidth = line_width;
  ctx.strokeStyle = color;
  ctx.stroke();
  return { icoX, icoY };
}

function drawAngles() {
	clearCanvas();
	for (var i = 0; i < shared.grazeList.length; i++) {
		drawAngle(shared.grazeList[i], bg_color);
	}
}
function drawHighlight() {
	const { icoX, icoY } = drawAngle(shared.grazeList[shared.currentGrazeIndex], fg_color);
	const x = icoX - (canvasRect.left - parentRect.left) - grazeIcon.clientWidth / 2;
	const y = icoY - (canvasRect.top - parentRect.top) - grazeIcon.clientHeight / 2;
	
	grazeIcon.style.left = x  + 'px';
	grazeIcon.style.top = y + 'px';

	const rotationAngle = baseGrazeRotation - shared.grazeList[shared.currentGrazeIndex]; // Negative angle to rotate in the opposite direction
	grazeIconImg.style.transform = `rotate(${rotationAngle}deg)`;
}
function updateGrazeWidget() {
	drawAngles();
	drawHighlight();
}

// button callbacks are in main.js
