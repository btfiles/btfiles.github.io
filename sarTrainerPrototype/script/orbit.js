// Get the required elements from the DOM
const orbitingIcon = document.getElementById('orbiting-icon');
const orbitRect = orbitingIcon.getBoundingClientRect();
const icon = document.getElementById('orbiting-icon-img');
const container = document.getElementById('orbit-container');
const centralPoint = document.getElementById('central-point');

const containerRect = container.getBoundingClientRect();
const centralPointRect = centralPoint.getBoundingClientRect();

const centerX = centralPointRect.left - containerRect.left + centralPointRect.width / 2;
const centerY = centralPointRect.top - containerRect.top + centralPointRect.height / 2;

const orbitOffset = (orbitRect.bottom - orbitRect.top) / 2;
const radius = (centralPointRect.right - centralPointRect.left) / 2 + orbitOffset;


// Define the angle increment and decrement values
const angleIncrement = 15;
const angleDecrement = -15;
const rotation_offset = -45;

// Function to update the position and rotation of the orbiting icon
function updateAzimuthWidget() {
  console.log('updating icon position');
  const radians = (shared.getCurrentAzimuth() * Math.PI) / 180;
  const y = centerY - radius * Math.cos(radians) - orbitOffset;
  const x = centerX + radius * Math.sin(radians) - orbitOffset;

  orbitingIcon.style.left = x  + 'px';
  orbitingIcon.style.top = y + 'px';

  const rotationAngle = rotation_offset + shared.getCurrentAzimuth();
  icon.style.transform = `rotate(${rotationAngle}deg)`;
  console.log(`x: ${x}, y: ${y}, rot: ${rotationAngle}`);
}

// button callbacks are in main.js