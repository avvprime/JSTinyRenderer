import './style.css'
import ObjFileParser from 'obj-file-parser';

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d', {willReadFrequently: true });


let model = undefined;

let readyToDraw = false;

let canvasWidth = 600;
let canvasHeight = 600;

let frameId = 0;

function swap(a, b)
{
    a = a + b;
    b = a - b;
    a = a - b;
    return [a, b];
}

function setPixel(x, y, r, g, b, a, imageData){
    const red = y * (canvasWidth * 4) + x * 4;

    // RED
    imageData[red] = r;
    // GREEN
    imageData[red + 1] = g;
    // BLUE
    imageData[red + 2] = b;
    // ALPHA
    imageData[red + 3] = a;
}

function drawLine(x0, y0, x1, y1, r, g, b, a, imageData){
    const dx = Math.abs(x1 - x0);
    const sx = x0 < x1 ? 1 : -1;
    const dy = -Math.abs(y1 - y0);
    const sy = y0 < y1 ? 1: -1;
    let err = dx + dy;

    let x = x0;
    let y = y0;

    while(true)
    {
        setPixel(x, y, r, g, b, a, imageData)

        let e2 = err * 2;
        
        if (e2 >= dy)
        {
            if (x == x1) break;
            err += dy;
            x += sx;
        }
        if (e2 <= dx)
        {
            if (y == y1) break;
            err += dx;
            y += sy;
        }
    }
}


function draw(elapsedTimeInMillis){
    frameId = requestAnimationFrame(draw);
    
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!readyToDraw) return;
    
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    console.log("drawing started");
    
    for (let i = 0; i < model.models[0].faces.length; i++)
    {
      const face = model.models[0].faces[i];
      
      for (let j = 0; j < 3; j++)
      {
        const v0 = model.models[0].vertices[face.vertices[j].vertexIndex - 1];
        const v1 = model.models[0].vertices[face.vertices[(j + 1) % 3].vertexIndex - 1];

        const x0 = Math.round((v0.x + 1) * canvasWidth / 2);
        const y0 = Math.round((v0.y + 1) * canvasHeight / 2);

        const x1 = Math.round((v1.x + 1) * canvasWidth / 2);
        const y1 = Math.round((v1.y + 1) * canvasHeight / 2);

        drawLine(x0, canvasHeight + y0 * -1, x1, canvasHeight + y1 * -1, 255, 255, 255, 255, imageData.data);
      }
    }

    ctx.putImageData(imageData, 0, 0);
    console.log("drawing ended");

    cancelAnimationFrame(frameId);
}

function handleResize(){
  const smallestSide = Math.min(window.innerWidth, window.innerHeight);
    
    canvas.style.width = smallestSide + 'px';
    canvas.style.height = smallestSide + 'px';
    canvas.width = smallestSide;
    canvas.height = smallestSide;

    canvasWidth = smallestSide;
    canvasHeight = smallestSide;
}

window.addEventListener('resize', handleResize);

handleResize();

fetch("public/african_head.obj")
.then(response => {
  response.text()
  .then(text => {

    const objFile = new ObjFileParser(text, "model");
    model = objFile.parse();
    readyToDraw = true;
  });
});



frameId = requestAnimationFrame(draw);