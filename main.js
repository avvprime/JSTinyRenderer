const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');


function draw(elapsedTime){
    requestAnimationFrame(draw);
    
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

requestAnimationFrame(draw);