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

function normalizeVec3(v){
  const length = Math.sqrt(v.x * v.y * v.z);
  return {x: v.x / length, y: v.y / length, z: v.z / length}
}

function getDeterminant(a, b, c){
  const ab = {x: b.x - a.x, y: b.y - a.y};
  const ac = {x: c.x - a.x, y: c.y - a.y};
  return ab.y * ac.x - ab.x * ac.y 
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

function drawFace(v0, v1, v2, r, g, b, a, imageData){
  const xmin = Math.min(v0.x, v1.x, v2.x);
  const ymin = Math.min(v0.y, v1.y, v2.y);

  const xmax = Math.max(v0.x, v1.x, v2.x);
  const ymax = Math.max(v0.y, v1.y, v2.y);

  for (let y = ymin; y <= ymax; y++){
    for (let x = xmin; x <= xmax; x++){
      const p = {x: x, y: y}

      const w0 = getDeterminant(v1, v2, p);
      const w1 = getDeterminant(v2, v0, p);
      const w2 = getDeterminant(v0, v1, p);

      if (w0 >= 0 && w1 >= 0 && w2 >= 0) setPixel(x, y, r, g, b, a, imageData);
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
    
    /*
    // Wireframe Drawing
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
    */

    const faces = model.models[0].faces;
    const vertices = model.models[0].vertices;
    const lightDir = {x: 0, y: 0.1, z: 1};

    for (let i = 0; i < faces.length; i++){
      const face = faces[i];
      const screenCoords = [];
      const worldCoords = [];
      for (let j = 0; j < 3; j++) {
        const worldCoord = vertices[face.vertices[j].vertexIndex - 1];
        const screenCoord = {
          x: Math.round((worldCoord.x + 1) * (canvasWidth / 2)),
          y: Math.round(canvasHeight + (((worldCoord.y + 1) * (canvasHeight / 2)) * -1))
        };
        screenCoords[j] = screenCoord;
        worldCoords[j] = worldCoord;
      }
      const U = {x: worldCoords[1].x - worldCoords[0].x, y: worldCoords[1].y - worldCoords[0].y, z: worldCoords[1].z - worldCoords[0].z};
      const V = {x: worldCoords[2].x - worldCoords[1].x, y: worldCoords[2].y - worldCoords[1]. y, z: worldCoords[2].z - worldCoords[1].z};
      const surfaceNormal = {
        x: U.y * V.z - U.z * V.y,
        y: U.z * V.x - U.x * V.z,
        z: U.x * V.y - U.y * V.x
      };
      const normalizedSurfaceNormal = normalizeVec3(surfaceNormal);
      const intensity = normalizedSurfaceNormal.x * lightDir.x + normalizedSurfaceNormal.y * lightDir.y + normalizedSurfaceNormal.z * lightDir.z; 
      
      if (intensity > 0) 
        drawFace(screenCoords[0], screenCoords[1], screenCoords[2], intensity * 255, intensity * 255, intensity * 255, 255, imageData.data)
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