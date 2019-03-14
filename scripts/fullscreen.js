/*

For now, just configures a canvas so that it can run full-screen.

*/

main();

function main() {
    //Grab canvas
    const canvas = document.querySelector("#maincanvas");
    //Initialize GL context
    const gl = canvas.getContext("webgl");
    
    //Halt if WebGL is not working
    if (gl == null) {
        console.error("Unable to initialize WebGL!");
        return;
    }
    
    //Set color and clear out canvas
    gl.clearColor(51/255, 215/255, 244/255, 1.0);
    gl.clearDepth(1.0);

    //Clear canvas 
    gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT);
        
    canvas.onmousedown = function(e) {
        if (canvas.requestFullscreen) { canvas.requestFullscreen(); }
        else if (canvas.mozRequestFullscreen) { canvas.mozRequestFullscreen(); }
        else if (canvas.webkitRequestFullscreen) { canvas.webkitRequestFullscreen(); }
        else if (canvas.msRequestFullscreen) { canvas.msRequestFullscreen(); }
    }
}


