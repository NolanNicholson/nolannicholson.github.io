/*

Animation of colorful fish swimming.

*/

//TODO make a 'fish' object that contains buffers, matrices, etc.
//TODO have two fish on screen at once

var swim_clock = 0; // internal clock for animation timing
const wiggle_speed = 4; // frequency for sine function
const wiggle_amplitude = 0.4; // amplitude of distortion sine function
const wiggle2_amplitude = 0.2; // amplitude of movement sine function
const wiggle_phase = 5.5; // phase between curve distortion and movement
const wiggle_zcenter = 1.0; // Z reference point for wiggle
var wiggle = 0; // will vary sinusoidally between 0 and 1
var wiggle2 = 0; // slightly out of phase with wiggle

class Fish {
    //
    // Constructor: initialize variables, set up color buffer
    //
    constructor(gl) {
        this.loc = [
            (Math.random() - 0.5) * 4,
            0.0,
            (Math.random() - 0.5) * 4,
        ];
        this.swimAngle = Math.random() * Math.PI * 2 // radians;

        this.colorBuffer = gl.createBuffer();
    }

    //
    // Initialize and assign color buffer (random color for each face)
    //
    initColorBuffer(gl, modelBuffers) {
        
        //Get info from model
        const numFaces = modelBuffers.vertexCount / 3;
        let positions = modelBuffers.originalPositionData;

        //"Central" hue
        const mainHue = Math.random() * 6;

        //Generate colors 
        var colors = [];
        for (var j = 0; j < numFaces; j++) {

            //Generate a random color for each face
            var H = mainHue + (Math.random() - 0.5) * 0.5; // hue
            const c = getSaturatedRGBA(H);

            //Darken color according to y coord
            var y_avg = (positions[9*j + 1] + positions[9*j + 4] + positions[9*j + 7]) / 3;
            for (var i = 0; i < 3; i++) {
                c[i] += y_avg / 2;
            }
            //Color must be duplicated for each of 3 vertices on face
            colors = colors.concat(c, c, c);
        }

        //Send colors to the fish's color buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        console.log("2");
        gl.bufferData(gl.ARRAY_BUFFER,
            new Float32Array(colors),
            gl.DYNAMIC_DRAW);

    }
}

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
    
    //Set up click callback to go full-screen
    canvas.onmousedown = function(e) {
        if (canvas.requestFullscreen) { canvas.requestFullscreen(); }
        else if (canvas.mozRequestFullscreen) { canvas.mozRequestFullscreen(); }
        else if (canvas.webkitRequestFullscreen) { canvas.webkitRequestFullscreen(); }
        else if (canvas.msRequestFullscreen) { canvas.msRequestFullscreen(); }
    }
    
    //Vertex shader program
    const vsSource = `
        attribute vec4 aVertexPosition;
        attribute vec4 aVertexColor;

        uniform mat4 uModelMatrix;
        uniform mat4 uViewMatrix;
        uniform mat4 uProjectionMatrix;

        varying lowp vec4 vColor;

        void main() {
            gl_Position = uProjectionMatrix * 
                uViewMatrix * 
                uModelMatrix *
                aVertexPosition;
            vColor = aVertexColor;
        }
    `;

    //Fragment shader program
    const fsSource = `
        varying lowp vec4 vColor;

        void main() {
            gl_FragColor = vColor;
        }
    `;

    //Initialize shader program
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(
                shaderProgram, 'aVertexPosition'),
            vertexColor: gl.getAttribLocation(
                shaderProgram, 'aVertexColor'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(
                shaderProgram, 'uProjectionMatrix'),
            viewMatrix: gl.getUniformLocation(
                shaderProgram, 'uViewMatrix'),
            modelMatrix: gl.getUniformLocation(
                shaderProgram, 'uModelMatrix'),
        },
    };

    //Initialize objects
    let fishes = [new Fish(gl), new Fish(gl), new Fish(gl)];

    //Load model
    const koi_obj_iframe = document.getElementById("koi_obj");

    fetch("./koi.obj")
    .then(response => response.text())
    .then((koi_obj_string) => {

        const koi_model = loadOBJFromString(koi_obj_string);
        console.log(koi_model);

        //Initialize buffers
        //Global model buffers: position, indices
        const buffers = initBuffers(gl, koi_model);
        //Object-specific buffers: color
        for (i = 0; i < fishes.length; i++) {
            let fish = fishes[i];
            fish.initColorBuffer(gl, buffers);
        }

        //Manage animation
        var then = 0;

        function render(now) {
            now *= 0.001; // convert to seconds
            const deltaTime = now - then;
            then = now;

            swim_clock += deltaTime;

            drawScene(gl, fishes, programInfo, buffers, deltaTime);

            requestAnimationFrame(render);
        }
        requestAnimationFrame(render);

    })
}

//
//Initialize shader program
//
function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    //Create shader program
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    //If creating the program failed, throw error
    if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error("Unable to initialize shader program: " +
            gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
}

//
//Creates shader, uploads, compiles
//
function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    //If compile failed, throw error
    if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Unable to compile shader: " +
            gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

//
//Converts a hue value H (bounded 0 to 6) to an RGBA array.
//Based on Wikipedia's descript of HSL->RGB conversion,
//with S and L equal to 1 (for fully saturated pretty colors)
///
function getSaturatedRGBA(H) {
    H = H % 6;
    var X = 1 - Math.abs((H % 2) - 1); // intermediate param

    var R, G, B;

    if      (H < 1) { R = 1; G = X; B = 0; }
    else if (H < 2) { R = X; G = 1; B = 0; }
    else if (H < 3) { R = 0; G = 1; B = X; }
    else if (H < 4) { R = 0; G = X; B = 1; }
    else if (H < 5) { R = X; G = 0; B = 1; }
    else if (H < 6) { R = 1; G = 0; B = X; }

    const c = [R, G, B, 1.0]; // alpha set to 1
    return c;
}

//
//Initializes buffers for a model.
//
function initBuffers(gl, model) {

    //Position buffer
    const positions = model.vertices;
    
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,
        new Float32Array(positions),
        gl.DYNAMIC_DRAW);
 
    //Index buffer
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    const indices = [];
    for (var i = 0; i < model.vertexCount; i++) {
        indices.push(i);
    }

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices), gl.STATIC_DRAW);
    
   return {
        originalPositionData: positions,
        position: positionBuffer,
        indices: indexBuffer,
        vertexCount: model.vertexCount
    };
}

//
//Resize GL canvas to match actual dimensions if needed
//
function resize(gl) {
    var width = gl.canvas.clientWidth;
    var height = gl.canvas.clientHeight;

    if (gl.canvas.width != width || gl.canvas.height != height) {
        gl.canvas.width = width;
        gl.canvas.height = height;
        gl.viewport(0, 0, width, height);
    }
}

//
//Draw the scene
//
function drawScene(gl, fishes, programInfo, buffers) {
    
    // Updating logic
    for (var i = 0; i < fishes.length; i++) {
        let fish = fishes[i];
        const swim_speed = 0.05;
        // Update rotation (using cubeRotation so that the cube can agitate it)
        fish.swimAngle += cubeRotationSpeed * 0.005;
        fish.loc[0] += Math.sin(fish.swimAngle) * swim_speed;
        fish.loc[2] += Math.cos(fish.swimAngle) * swim_speed;
    }
        
    // Rendering
    //Update canvas size if needed
    resize(gl);

    //Set drawing parameters
    gl.clearColor(50/255, 40/255, 60/255, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    //Clear canvas
    gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT);

    //Draw each fish
    for (var i = 0; i < fishes.length; i++) {
        let fish = fishes[i];
        drawFish(gl, fish, programInfo, buffers);
    }
}

//
//Draws an individual fish.
//
function drawFish(gl, fish, programInfo, buffers) {
    //Construct perspective matrix
    const fieldOfView = 45 * Math.PI / 180; //radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    //Set drawing position to "identity" point - at center of scene
    const modelMatrix = mat4.create();
    const viewMatrix = mat4.create();

    //Move model according to its position
    mat4.translate(modelMatrix, // destination matrix
        modelMatrix,            // starting matrix
        fish.loc                // translation vector
    );

    //Rotate model 
    mat4.rotate(modelMatrix,    // destination matrix
        modelMatrix,            // matrix to rotate
        fish.swimAngle,         // amount to rotate - radians
        [0, 1, 0]               // axis to rotate around
    );

    //Look at the origin from above and to the side
    mat4.lookAt(viewMatrix,     // destination matrix
        [0.0, 12.0, -12.0],     // eye - position of viewer 
        [0.0, 0.0, 0.0],        // center - position being looked at
        [0.0, 1.0, 1.0],        // up - which way is up
    );

    //Animation: Deform positions of model vertices.

    //Update input params to animation ("wiggle")
    wiggle = wiggle_amplitude * Math.sin(swim_clock * wiggle_speed)
    wiggle2 = wiggle2_amplitude * Math.sin(
        (swim_clock * wiggle_speed) + wiggle_phase);

    //Deform the contents of the Position buffer to animate the fish
    deformedPositions = new Float32Array(buffers.originalPositionData);
    
    for (i = 0; i < buffers.vertexCount; i++) {
        const x = deformedPositions[3*i];
        const y = deformedPositions[3*i + 1];
        const z = deformedPositions[3*i + 2] - wiggle_zcenter;

        //move left and right
        deformedPositions[3*i] += wiggle2;

        //deform left and right according to position
        deformedPositions[3*i] -= wiggle * (z*z/10)
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, deformedPositions);

    //Tell WebGL how to move data from position buffer
    //into the vertexPosition attribute
    {
        const numComponents = 3;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            numComponents, type, normalize, stride, offset);
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexPosition);
    }

    //Tell WebGL how to move data from color buffer
    //into the vertexColor attribute
    {
        const numComponents = 4;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;

        gl.bindBuffer(gl.ARRAY_BUFFER, fish.colorBuffer);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexColor,
            numComponents, type, normalize, stride, offset);
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexColor);
    }

    //Tell WebGL about vertex indices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

    //Specify shader program
    gl.useProgram(programInfo.program);

    //Set shader uniforms
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        projectionMatrix);
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.viewMatrix,
        false,
        viewMatrix);
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.modelMatrix,
        false,
        modelMatrix);

    {
        const vertexCount = buffers.vertexCount;
        const type = gl.UNSIGNED_SHORT;
        const offset = 0;
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }
};
