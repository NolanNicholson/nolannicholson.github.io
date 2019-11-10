/*

Code to put a spinning cube in a canvas (particularly in the
header of my homepage.) This code is based on a WebGL tutorial from the
Mozilla Developer Network:

https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Creating_3D_objects_using_WebGL

*/

// Variables for the cube's movement

// Rotation (radians)
var cubeRotation = 0.0;
// Rotation click and cooldown
const clickSuperSpeed = 20.0;
var cubeRotationSpeed = 1.0;
var rotationSlowdown = 0.97;
var cubeBgR = 1.0, cubeBgG = 1.0, cubeBgB = 1.0;

main();

function main() {
    //Grab canvas
    const headerCubeCanvas = document.querySelector("#headercanvas");
    //Initialize GL context
    const gl = headerCubeCanvas.getContext("webgl");

    //Halt if WebGL is not working
    if (gl == null) {
        console.error("Unable to initialize WebGL!");
        return;
    }
        
    headerCubeCanvas.addEventListener('mousedown', function(e) {
        cubeRotationSpeed = clickSuperSpeed;
    });
    
    //Vertex shader program
    const vsSource = `
        attribute vec4 aVertexPosition;
        attribute vec4 aVertexColor;

        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;

        varying lowp vec4 vColor;

        void main() {
            gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
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

    const buffers = initBuffers(gl);

    //Manage animation
    var then = 0;

    function render(now) {
        now *= 0.001; // convert to seconds
        const deltaTime = now - then;
        then = now;

        drawHeaderCube(gl, programInfo, buffers, deltaTime);

        //Update square angle
        cubeRotation += deltaTime * cubeRotationSpeed;
        //Descend cube rotation closer to 1
        cubeRotationSpeed = cubeRotationSpeed ** rotationSlowdown;

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
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
//Initializes buffers 
//
function initBuffers(gl) {

    //Position buffer
    const positions = [
        // Front face
        -1.0, -1.0,  1.0,
         1.0, -1.0,  1.0,
         1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0,

        // Back face
        -1.0, -1.0, -1.0,
        -1.0,  1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0, -1.0, -1.0,

        // Top face
        -1.0,  1.0, -1.0,
        -1.0,  1.0,  1.0,
         1.0,  1.0,  1.0,
         1.0,  1.0, -1.0,

        // Bottom face
        -1.0, -1.0, -1.0,
         1.0, -1.0, -1.0,
         1.0, -1.0,  1.0,
        -1.0, -1.0,  1.0,

        // Right face
         1.0, -1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0,  1.0,  1.0,
         1.0, -1.0,  1.0,

        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0,  1.0,
        -1.0,  1.0,  1.0,
        -1.0,  1.0, -1.0,
    ];
    
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    gl.bufferData(gl.ARRAY_BUFFER,
        new Float32Array(positions),
        gl.STATIC_DRAW);

    //Specify face colors
    const faceColors = [
        [1.0,  0.2,  0.3,  1.0],  // red
        [1.0,  0.2,  0.3,  1.0],  // red
        [1.0,  0.2,  0.3,  1.0],  // red
        [1.0,  0.5,  0.4,  1.0],  // pink
        [1.0,  0.5,  0.4,  1.0],  // pink
        [1.0,  0.5,  0.4,  1.0],  // pink
    ]

    //Build up color array procedurally
    var colors = [];

    for (var j = 0; j < faceColors.length; j++) {
        const c = faceColors[j];
        colors = colors.concat(c, c, c, c);
    }

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,
        new Float32Array(colors),
        gl.STATIC_DRAW);

    //Index buffer
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    const indices = [
        0,  1,  2,      0,  2,  3,  //front
        4,  5,  6,      4,  6,  7,  //back
        8,  9,  10,     8,  10, 11, //top
        12, 13, 14,     12, 14, 15, //bottom
        16, 17, 18,     16, 18, 19, //right
        20, 21, 22,     20, 22, 23, //left
    ];

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices), gl.STATIC_DRAW);

    return {
        position: positionBuffer,
        color: colorBuffer,
        indices: indexBuffer,
    };
}

//
//Draw the scene
//
function drawHeaderCube(gl, programInfo, buffers) {
    //Set drawing parameters
    gl.clearColor(cubeBgR, cubeBgG, cubeBgB, 1.0);
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

    mat4.translate(modelViewMatrix, modelViewMatrix,
        [-0.0, 0.0, -5.0]); //amount to translate

    mat4.rotate(modelViewMatrix,    // destination matrix
        modelViewMatrix,            // matrix to rotate
        cubeRotation,               // amount to rotate - radians
        [0, 0, 1]);                 // axis to rotate around
    mat4.rotate(modelViewMatrix, modelViewMatrix, 
        cubeRotation * 0.7,
        [0, 1, 0]);

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
        const vertexCount = 36;
        const type = gl.UNSIGNED_SHORT;
        const offset = 0;
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }
}

