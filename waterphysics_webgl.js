/* 
 * Initializing GL object
 */
var gl;
function initGL(canvas) {
    try {
        gl = canvas.getContext("experimental-webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;


    } catch (e) {
    }
    if ( !gl ) alert("Could not initialise WebGL, sorry :-(");

    gl = WebGLDebugUtils.makeDebugContext(gl, throwOnGLError, validateNoneOfTheArgsAreUndefined);
}


/*
 * Initializing shaders 
 */
var shaderPrograms_arr;
var shaderProgram;
var shaderProgram_t;
function createShader(vs_id, fs_id) {
    var shaderProg = createShaderProg(vs_id, fs_id);

    shaderProg.vertexPositionAttribute = gl.getAttribLocation(shaderProg, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProg.vertexPositionAttribute);
    shaderProg.vertexNormalAttribute = gl.getAttribLocation(shaderProg, "aVertexNormal");
    gl.enableVertexAttribArray(shaderProg.vertexNormalAttribute);        

    shaderProg.pMatrixUniform = gl.getUniformLocation(shaderProg, "uPMatrix");
    shaderProg.mvMatrixUniform = gl.getUniformLocation(shaderProg, "uMVMatrix");
    shaderProg.nMatrixUniform = gl.getUniformLocation(shaderProg, "uNMatrix");
    shaderProg.lightPosUniform = gl.getUniformLocation(shaderProg, "uLightPos");
    shaderProg.lightPowerUniform = gl.getUniformLocation(shaderProg, "uLightPower");
    shaderProg.kdUniform = gl.getUniformLocation(shaderProg, "uDiffuseColor");
    shaderProg.ksUniform = gl.getUniformLocation(shaderProg, "uSpecularColor");
    shaderProg.ambientUniform = gl.getUniformLocation(shaderProg, "uAmbient");

    return shaderProg;
}

function initShaders() {
    //todo add translucent as well as my own blinn phong as a possibility
    shaderPrograms_arr = [
        createShader("shader-vs", "shader-fs-bp"),
        createShader("shader-vs", "shader-fs-t"),
        //createShader("shader-vs", "shader-fs"),
    ];
    if(translucent){
        shaderProgram = shaderPrograms_arr[1];
    }else{
        shaderProgram = shaderPrograms_arr[0];
    }
    
    //my blinn-phong

    shaderPrograms_arr[0].exponentUniform = gl.getUniformLocation(shaderPrograms_arr[0], "uExponent");
    gl.useProgram(shaderPrograms_arr[0]);
    gl.uniform1f(shaderPrograms_arr[0].exponentUniform, 50.0);

    //translucent (temp blinn fong shaders)
    shaderPrograms_arr[1].exponentUniform = gl.getUniformLocation(shaderPrograms_arr[1], "uExponent");
    shaderPrograms_arr[1].alphaUniform = gl.getUniformLocation(shaderPrograms_arr[1], "uAlpha");
    gl.useProgram(shaderPrograms_arr[1]);
    gl.uniform1f(shaderPrograms_arr[1].exponentUniform, 50.0);
    gl.uniform1f(shaderPrograms_arr[1].alphaUniform, .9);
}


/*
 * Initializing and updating buffers
 */
var vertexPositionBuffer, vertexNormalBuffer, indexBuffer, wireIndexBuffer;
function initBuffers(createBuffers) {
    if ( createBuffers ) {
        vertexPositionBuffer = gl.createBuffer();
        vertexNormalBuffer = gl.createBuffer();        
        indexBuffer = gl.createBuffer();
        wireIndexBuffer = gl.createBuffer();        
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, Float32Array.from(vertexPosition), gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, Float32Array.from(vertexNormal), gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, Uint16Array.from(clothIndex), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, wireIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, Uint16Array.from(clothWireIndex), gl.STATIC_DRAW);    
}

function updateBuffers() {
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, Float32Array.from(vertexPosition), gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, Float32Array.from(vertexNormal), gl.DYNAMIC_DRAW);
}

function resetMesh() {
    initMesh();
    initBuffers(false);
}


/*
 * Main rendering code 
 */

// Basic rendering parameters
var mvMatrix = mat4.create();                   // Model-view matrix for the main object
var pMatrix = mat4.create();                    // Projection matrix

// Lighting control
var lightMatrix = mat4.create();                // Model-view matrix for the point light source
var lightPos = vec3.create();                   // Camera-space position of the light source

// Animation related variables
var rotY = 0.0;                                 // object rotation
var rotY_light = 0.0;                           // light position rotation

//my vars
var diffuseColor = [0.2392, 0.5216, 0.7765];    // Diffuse color
var specularColor = [1.0, 1.0, 1.0];    // specular color
var ambientIntensity = 0.1;
var lightPower = 5.0;

function setUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);

    var nMatrix = mat4.transpose(mat4.inverse(mvMatrix));
    gl.uniformMatrix4fv(shaderProgram.nMatrixUniform, false, nMatrix);

    gl.uniform3fv(shaderProgram.lightPosUniform, lightPos);
    gl.uniform1f(shaderProgram.lightPowerUniform, lightPower);
    gl.uniform3fv(shaderProgram.kdUniform, diffuseColor);
    gl.uniform3fv(shaderProgram.ksUniform, specularColor);
    gl.uniform1f(shaderProgram.ambientUniform, ambientIntensity);
}

var drawMode;
function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(35, gl.viewportWidth/gl.viewportHeight, 0.1, 100.0, pMatrix);

    mat4.identity(lightMatrix);
    mat4.translate(lightMatrix, [0.0, 0.5, -10.0]);
    mat4.rotateY(lightMatrix, rotY_light);

    lightPos.set([0.0, 2.5, 3.0]);
    mat4.multiplyVec3(lightMatrix, lightPos);

    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, [0.0, 0.5, -10.0]);
    mat4.rotateY(mvMatrix, rotY);

    //my code
    gl.useProgram(shaderProgram);
    setUniforms(shaderProgram); 
    

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);

    if ( drawMode == 0 ) {
        // Normal mode
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);        
        gl.drawElements(gl.TRIANGLES, clothIndex.length, gl.UNSIGNED_SHORT, 0);
    }
    else {
        // Wire-frame mode
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, wireIndexBuffer);        
        gl.drawElements(gl.LINES, clothWireIndex.length, gl.UNSIGNED_SHORT, 0);
    }
}



//Zach
//These 2 functions are for background imgs
function initBkgnd() {
    backTex = gl.createTexture();
    backTex.Img = new Image();
    backTex.Img.onload = function() {
        handleBkTex(backTex);
    }

    //************
    //Change this src for new img
    //Also need to change in html file under canvas background section
    //backTex.Img.src =  "floor_tile2.jpg";
    //************

}

function handleBkTex(tex) {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex.Img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

var lastTime = 0;
var rotSpeed = 60, rotSpeed_light = 60;
var rotating = false, rotating_light = false;
var animated = true;
function tick() {
    requestAnimationFrame(tick);
    initBkgnd();
    var timeNow = new Date().getTime();
    if ( lastTime != 0 ) {
      var elapsed = timeNow - lastTime;
      if ( rotating )
        rotY += rotSpeed*0.0175*elapsed/1000.0;
      if ( rotating_light )
        rotY_light += rotSpeed_light*0.0175*elapsed/1000.0;
    }
    lastTime = timeNow;        

    drawScene();
    //todo draw skybox when working
    //drawSkybox();
    if ( animated ) {
        var timeStep = 0.001;
        var n = Math.ceil(0.01/timeStep);
        for ( var i = 0; i < n; ++i ) simulate(timeStep);
        computeNormals();
        updateBuffers();
    }
}

function webGLStart() {
    var canvas = $("#canvas0")[0];

    meshResolution = 25;
    mass = 1.0;
    restLength = vec3.create();
    K = vec3.create([25000.0, 25000.0, 25000.0]);
    Cd = 0.5;

    pokeS = 1.0;
    pokeArea = 1.0;
    translucent = false;
    view_type = 1;
    poke_time = 1;
    box_mass = 1.0;
    gravity = 9.8;
    raining = 0;
    raininess = 5;
    poke_locat_x = meshResolution*.5;
	poke_locat_y = meshResolution*.5;
    droplet_mass = 1.0;

    initGL(canvas); 
    initShaders();
    shaderProgram = shaderPrograms_arr[0];

    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    
    initMesh();
    initBuffers(true);

    //my blending
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    initBkgnd();
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    drawMode = 0;

    tick();
}