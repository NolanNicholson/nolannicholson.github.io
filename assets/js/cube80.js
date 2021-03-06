/*
    The goal of this one is to draw a basic cube (rotating in sync with
    the header cube), but to draw its edges as lines too.
*/

// Animation parameter for big cube
var bigCubeRotation = 0;

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

    //Fragment shader program for drawing faces
    const fsSource_faces = `
        varying lowp vec4 vColor;

        void main() {
            gl_FragColor = vColor;
        }
    `;

    //Fragment shader program for drawing lines
    const fsSource_lines = `
        varying lowp vec4 vColor;

        void main() {
            gl_FragColor = vec4(0.4, 1.0, 1.0, 1.0);
        }
    `;

    //Initialize shader program: one to draw faces, one to draw lines
    const shaderProgram_faces = initShaderProgram(gl, vsSource, fsSource_faces);
    const shaderProgram_lines = initShaderProgram(gl, vsSource, fsSource_lines);

    const programInfo_faces = {
        program: shaderProgram_faces,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(
                shaderProgram_faces, 'aVertexPosition'),
            vertexColor: gl.getAttribLocation(
                shaderProgram_faces, 'aVertexColor'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(
                shaderProgram_faces, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(
                shaderProgram_faces, 'uModelViewMatrix'),
        },
        primitive: gl.TRIANGLES,
    };

    const programInfo_lines = {
        program: shaderProgram_lines,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(
                shaderProgram_lines, 'aVertexPosition'),
            vertexColor: gl.getAttribLocation(
                shaderProgram_lines, 'aVertexColor'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(
                shaderProgram_lines, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(
                shaderProgram_lines, 'uModelViewMatrix'),
        },
        primitive: gl.LINES,
    };

    const buffers = initBuffers(gl);

    //Manage animation
    var then = 0;

    function render(now) {
        now *= 0.001; // convert to seconds
        const deltaTime = now - then;
        then = now;

        bigCubeRotation += 0.4 * cubeRotationSpeed * deltaTime;

        drawScene(gl, programInfo_faces, programInfo_lines, buffers, deltaTime);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

//
//Initialize shader program
//
function initShaderProgram(gl, vsSource, fsSource_faces) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource_faces);

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
        [0.0,  0.0,  0.4,  1.0],  // navy
        [0.0,  0.0,  0.4,  1.0],  // navy
        [0.0,  0.0,  0.4,  1.0],  // navy
        [0.3,  0.0,  0.6,  1.0],  // purple
        [0.3,  0.0,  0.6,  1.0],  // purple
        [0.3,  0.0,  0.6,  1.0],  // purple
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
function drawScene(gl, programInfo_faces, programInfo_lines, buffers) {

    resize(gl);

    //Set drawing parameters
    gl.clearColor(0.0, 0.0, 0.2, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.lineWidth(5);

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
        bigCubeRotation,               // amount to rotate - radians
        [0, 0, 1]);                 // axis to rotate around
    mat4.rotate(modelViewMatrix, modelViewMatrix, 
        bigCubeRotation * 0.7,
        [0, 1, 0]);

    programInfoObjects = [programInfo_faces, programInfo_lines]
    programInfoObjects.forEach(function(programInfo) {

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

        //Draw the object
        {
            const vertexCount = 36;
            const type = gl.UNSIGNED_SHORT;
            const offset = 0;
            gl.drawElements(programInfo.primitive, vertexCount, type, offset);
        }

    });
}

