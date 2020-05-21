/*

Animation of a colorful fish swimming.

*/

var swim_clock = 0; // internal clock for animation timing
const wiggle_speed = 4; // frequency for sine function
const wiggle_amplitude = 0.4; // amplitude of distortion sine function
const wiggle2_amplitude = 0.2; // amplitude of movement sine function
const wiggle_phase = 5.5; // phase between curve distortion and movement
const wiggle_zcenter = 1.0; // Z reference point for wiggle
var wiggle = 0; // will vary sinusoidally between 0 and 1
var wiggle2 = 0; // slightly out of phase with wiggle

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

        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;

        varying lowp vec4 vColor;

        void main() {
            gl_Position = uProjectionMatrix * 
                uModelViewMatrix * 
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
            modelViewMatrix: gl.getUniformLocation(
                shaderProgram, 'uModelViewMatrix'),
        },
    };

    //Load model
    const koi_obj_iframe = document.getElementById("koi_obj");

    fetch("/assets/obj/koi.obj")
    .then(response => response.text())
    .then((koi_obj_string) => {

        const koi_model = loadOBJFromString(koi_obj_string);
        console.log(koi_model);

        const buffers = initBuffers(gl, koi_model);

        //Manage animation
        var then = 0;

        function render(now) {
            now *= 0.001; // convert to seconds
            const deltaTime = now - then;
            then = now;

            swim_clock += deltaTime;

            drawScene(gl, programInfo, buffers, deltaTime);

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
    var X = 1 - Math.abs((H % 2) - 1) // intermediate param

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

    //Color buffer: Build up color array procedurally
    var colors = [];
    const numFaces = model.vertexCount / 3;

    for (var j = 0; j < numFaces; j++) {

        //Generate a random color for each face
        var H = Math.random() * 6; // hue
        const c = getSaturatedRGBA(H);
        //Color must be duplicated for each of 3 vertices on face
        colors = colors.concat(c, c, c);
    }

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,
        new Float32Array(colors),
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
        color: colorBuffer,
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
function drawScene(gl, programInfo, buffers) {
    
    //Update canvas size if needed
    resize(gl);

    //Set drawing parameters
    gl.clearColor(50/255, 40/255, 60/255, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    //Clear canvas
    gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT);

    //Construct perspective matrix
    const fieldOfView = 45 * Math.PI / 180; //radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    //Set drawing position to "identity" point - at center of scene
    const modelViewMatrix = mat4.create();

    //Look at the origin from above and to the side
    mat4.lookAt(modelViewMatrix,    // destination matrix
        [0.0, 6.0, -6.0],           // eye - position of viewer 
        [0.0, 0.0, -0.5],            // center - position being looked at
        [0.0, 1.0, 1.0],            // up - which way is up
    );

    //Rotate slowly (using cubeRotation so that the cube can agitate it)
    mat4.rotate(modelViewMatrix,    // destination matrix
        modelViewMatrix,            // matrix to rotate
        cubeRotation * 0.3,         // amount to rotate - radians
        [0, 1, 0]                   // axis to rotate around
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

    //Animation: Update vertex colors.

    colors = []
    
    //Iterate over faces (3 vertices per face)
    for (i = 0; i < buffers.vertexCount / 3; i++) {
        //Get intermediate z coordinate of associated textures
        const z1 = deformedPositions[9*i+0+2];
        const z2 = deformedPositions[9*i+3+2];
        const z3 = deformedPositions[9*i+6+2];
        const z  = (Math.max(z1, z2, z3) + Math.min(z1, z2, z3)) / 2;

        const y1 = deformedPositions[9*i+0+1];
        const y2 = deformedPositions[9*i+3+1];
        const y3 = deformedPositions[9*i+6+1];
        const y  = (Math.max(y1, y2, y3) + Math.min(y1, y2, y3)) / 2;
        
        //Assign hue based on z coordinate and animation time
        const hue = ((z + 1) * 0.4 + (y * 0.5) + (swim_clock * 2)) % 6;
        const c = getSaturatedRGBA(hue);
        colors = colors.concat(c, c, c);
    }

    //Update color buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(colors));

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

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
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
        programInfo.uniformLocations.modelViewMatrix,
        false,
        modelViewMatrix);

    {
        const vertexCount = buffers.vertexCount;
        const type = gl.UNSIGNED_SHORT;
        const offset = 0;
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }
}

