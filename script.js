/*
 * Example WebGL
 */

// the variable that will accommodate the WebGL context
// every call to the state machine will be done through this variable
var gl;

// Initialize WebGL
function initGL(canvas) {
	try {
		// Get webgl context
		gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
		// Assign a viewport width and height
		gl.viewportWidth = canvas.width;
		gl.viewportHeight = canvas.height;
	} catch (e) {}
	
	// If WebGL is not available
	if (!gl) {
		// Exit
		console.log("Could not initialise WebGL");
		return false;
	}	
	return true;
}

var shaderProgram;
var textureShaderProgram;

// Creates a program from a vertex + fragment shader pair
function initShaders() {
	var fragmentShader = getShader(gl, "shader-fs");
	var vertexShader = getShader(gl, "shader-vs");

	shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	// link the compiled binaries
	gl.linkProgram(shaderProgram);

	// check for errors, again
	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		console.log("Could not initialise shaders");
		return;
	}
	
	// Vertex position data
	shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
	gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

	// Vertex color data
	shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
	gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

	// Update uniform variables
	shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
	shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");

	var textureFragmentShader = getShader(gl, "texture-shader-fs");
	var textureVertexShader = getShader(gl, "texture-shader-vs");

	textureShaderProgram = gl.createProgram();
	gl.attachShader(textureShaderProgram, textureVertexShader);
	gl.attachShader(textureShaderProgram, textureFragmentShader);
	// link the compiled binaries
	gl.linkProgram(textureShaderProgram);

	// check for errors, again
	if (!gl.getProgramParameter(textureShaderProgram, gl.LINK_STATUS)) {
		console.log("Could not initialise texture shaders");
		return;
	}
	
	// Vertex position data
	textureShaderProgram.vertexPositionAttribute = gl.getAttribLocation(textureShaderProgram, "aVertexPosition");
	gl.enableVertexAttribArray(textureShaderProgram.vertexPositionAttribute);

	// Vertex texture data
	textureShaderProgram.textureCoordAttribute = gl.getAttribLocation(textureShaderProgram, "aTextureCoord");
	gl.enableVertexAttribArray(textureShaderProgram.textureCoordAttribute);

	// Update uniform variables
	textureShaderProgram.pMatrixUniform = gl.getUniformLocation(textureShaderProgram, "uPMatrix");
	textureShaderProgram.mvMatrixUniform = gl.getUniformLocation(textureShaderProgram, "uMVMatrix");
}


// Find and compile shaders (vertex + fragment shader)
function getShader(gl, id) {
	// gets the shader scripts (vertex + fragment)
	var shaderScript = document.getElementById(id);
	if (!shaderScript) {
		return null;
	}

	var str = "";
	var k = shaderScript.firstChild;
	while (k) {
		if (k.nodeType == 3) {
			str += k.textContent;
		}
		k = k.nextSibling;
	}

	var shader;
	// Create shaders
	if (shaderScript.type == "x-shader/x-fragment") {
		shader = gl.createShader(gl.FRAGMENT_SHADER);
	} else if (shaderScript.type == "x-shader/x-vertex") {
		shader = gl.createShader(gl.VERTEX_SHADER);
	} else {
		return null;
	}

	// Compile shaders
	gl.shaderSource(shader, str);
	gl.compileShader(shader);

	// Check for errors
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.log(gl.getShaderInfoLog(shader));
		return null;
	}

	return shader;
}

// ModelView and Projection matrices
var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();

// Push Matrix Operation
function mvPushMatrix() {
	var copy = mat4.create();
	mat4.set(mvMatrix, copy);
	mvMatrixStack.push(copy);
}

// Pop Matrix Operation
function mvPopMatrix() {
	if (mvMatrixStack.length == 0) {
		throw "Invalid popMatrix!";
	}
	mvMatrix = mvMatrixStack.pop();
}


// Sets + Updates matrix uniforms
function setMatrixUniforms() {
	gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
	gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}
function setMatrixUniformsTexture() {
	gl.uniformMatrix4fv(textureShaderProgram.pMatrixUniform, false, pMatrix);
	gl.uniformMatrix4fv(textureShaderProgram.mvMatrixUniform, false, mvMatrix);
}

// Rotation function helper
function degToRad(degrees) {
	return degrees * Math.PI / 180;
}

// Vertex, Index and Color Data
var headBuffers = {
	position : null,
	color : null,
	index : null,
	textureCoord : null
};
var bodyBuffers = {
	position : null,
	color : null,
	index : null,
	textureCoord : null
};
var armBuffers = {
	position : null,
	color : null,
	index : null
};
var legBuffers = {
	position : null,
	color : null,
	index : null,
	textureCoord : null
};

// Initialize VBOs, IBOs and color
function initBuffers() {
	var buffers;
	
	// Create head buffers
	buffers = createBuffers(8, 8, 8, textures.head);
	headBuffers.position = buffers.position;
	headBuffers.color = buffers.color;
	headBuffers.index = buffers.index;
	headBuffers.textureCoord = buffers.textureCoord;
	
	// Create body buffers
	buffers = createBuffers(8, 12, 4, textures.body);
	bodyBuffers.position = buffers.position;
	bodyBuffers.color = buffers.color;
	bodyBuffers.index = buffers.index;
	bodyBuffers.textureCoord = buffers.textureCoord;
	
	// Create arm buffers
	buffers = createBuffers(4, 12, 4, textures.arm);
	armBuffers.position = buffers.position;
	armBuffers.color = buffers.color;
	armBuffers.index = buffers.index;
	armBuffers.textureCoord = buffers.textureCoord;
	
	// Create leg buffers
	buffers = createBuffers(4, 12, 4, textures.leg);
	legBuffers.position = buffers.position;
	legBuffers.color = buffers.color;
	legBuffers.index = buffers.index;
	legBuffers.textureCoord = buffers.textureCoord;
	
}

var textures = {
	head_boy : {
		loaded : false,
		url : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAEABAMAAAA3vtNUAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4QQHEAot2o3rcQAAAB5QTFRFAAAAAQAAPRLgUzYWVDYWVDYXVDcX2riD/t6t/////XiPvgAAAAFiS0dEAIgFHUgAAAHASURBVHja7d3dCYMwFAZQu0pXCDiBdQJ1BFfoCl2h2/ZFXwRpMfX3nu9NCcEc4jUIIcUrM31mir0DAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAXACg3zkAAAAAAAAAAAALczMDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABYB6AKPwPq4ABtFRzg0TXBAZqqjl0E88Z/AYAmeA3oLIQshIJ/BaKvA9q2UwPOHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADA79n6YAYAAAAAAAAAAAAAAAAAAAAAwH4Aex/YCAAAAAAAAAAAAAAAAAAAAABYH2D64OP1e8h9yHSg4/2x3Vw/AAAAAAAAAAAAAAAAAAAAAIDjAnzLc5Kj/iABAAAAAAAAAAAAAAAAAAAAAOQPfK790n4AAAAAAAAAAAAAAAAAAAAAANsD/HsDxNE2VAAAAODcACk8QEoAogOk8AClVyA0QBkcIG/8V5gBANQAABn5APAxMa3EMaMkAAAAAElFTkSuQmCC",
		coordinates : [
			// Front
			0.25,  1.00,  0.50,  1.00,  0.50,  0.50,  0.25,  0.50,
			// Back
			0.75,  1.00,  0.75,  0.50,  1.00,  0.50,  1.00,  1.00,
			// Top
			0.50,  0.50,  0.25,  0.50,  0.25,  0.00,  0.50,  0.00,
			// Bottom
			0.25,  0.50,  0.00,  0.50,  0.00,  0.00,  0.25,  0.00,
			// Right
			0.75,  1.00,  0.75,  0.50,  0.50,  0.50,  0.50,  1.00,
			// Left
			0.00,  1.00,  0.25,  1.00,  0.25,  0.50,  0.00,  0.50
		]
	},

	body_boy : {
		loaded : false,
		url : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAEABAMAAAA3vtNUAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4QQHEREu63AbZgAAABJQTFRFAAAAAQAAAb2+NzeA/t6t////LflFPQAAAAFiS0dEBfhv6ccAAAFwSURBVHja7dtRDYAwDEXRYgUJzAL+NaGAQMeaLeFcBS8n/W203o59SDE7AAAAAAAAAAAAAAAAAAAAAMBngPMhAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMD8sg8QWYCvDxXlDxsAAAAAAAAAgFUBNhcAAAAAAAAArANwB1E1EAAAAAAAAAAAAAAAAAAAAACwDsCoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARbXDVANk9AAAAAAAAAAAAAAAAAAAAAIB6gCzEW4DeHQAAAAAAAAAAAAAAAAAAAMAPAS5Fk6rIpVbkSwAAAABJRU5ErkJggg==",
		coordinates : [
			// Front
			0.25,  1.00,  0.50,  1.00,  0.50,  0.25,  0.25,  0.25,
			// Back
			1.00,  1.00,  1.00,  0.25,  0.75,  0.25,  0.75,  1.00,
			// Top
			0.50,  0.00,  0.50,  0.25,  0.25,  0.25,  0.25,  0.00,
			// Bottom
			0.25,  0.25,  0.00,  0.25,  0.00,  0.00,  0.25,  0.00,
			// Right
			0.625, 1.00,  0.625, 0.50,  0.50,  0.50,  0.50,  1.00,
			// Left
			0.125, 1.00,  0.25,  1.00,  0.25,  0.50,  0.125, 0.50
		]
	},

	arm_boy : {
		loaded : false,
		url : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEAAgMAAAAhHED1AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4QQHEQg0jRJLBAAAAAxQTFRFAAAAAb2+/t6t////ucmKxQAAAAFiS0dEAxEMTPIAAABdSURBVHja7cwhAQAwCAAwSlKSlPeYCxxsARbVZBM/AoFAIBAIBAKBQCAQCNYHOSQQCAQCgUAgEAgEAoFgf1BDAoFAIBAIBAKBQCAQCAQCgUAgEAgEAoFAIBAIzgcPUDmNw2Vj5gEAAAAASUVORK5CYII=",
		coordinates : [
			// Front
			0.25,  1.00,  0.50,  1.00,  0.50,  0.25,  0.25,  0.25,
			// Back
			0.75,  1.00,  0.75,  0.25,  1.00,  0.25,  1.00,  1.00,
			// Top
			0.50,  0.25,  0.25,  0.25,  0.25,  0.00,  0.50,  0.00,
			// Bottom
			0.25,  0.25,  0.00,  0.25,  0.00,  0.00,  0.25,  0.00,
			// Right
			0.75,  1.00,  0.75,  0.25,  0.50,  0.25,  0.50,  1.00,
			// Left
			0.00,  1.00,  0.25,  1.00,  0.25,  0.25,  0.00,  0.25
		]
	},

	leg_boy : {
		loaded : false,
		url : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEAAgMAAAAhHED1AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4QQHERAFXtfTZwAAAAxQTFRFAAAANzeASUlJ////47F6IgAAAAFiS0dEAxEMTPIAAABhSURBVHja7cyxCQAwCAAwn/RJr+wuFAc3SQ5IVJNNTAQCgUAgEAgEAoFAIBCcD3JJIBAIBAKBQCAQCAQCgUAgEAgEAoFAIBAIBAKBQCAQCAQCgeAX1EAgENwPakkgEJwJHndH6zxm2HCRAAAAAElFTkSuQmCC",
		coordinates : [
			// Front
			0.25,  1.00,  0.50,  1.00,  0.50,  0.25,  0.25,  0.25,
			// Back
			0.75,  1.00,  0.75,  0.25,  1.00,  0.25,  1.00,  1.00,
			// Top
			0.50,  0.25,  0.25,  0.25,  0.25,  0.00,  0.50,  0.00,
			// Bottom
			0.25,  0.25,  0.00,  0.25,  0.00,  0.00,  0.25,  0.00,
			// Right
			0.75,  1.00,  0.75,  0.25,  0.50,  0.25,  0.50,  1.00,
			// Left
			0.00,  1.00,  0.25,  1.00,  0.25,  0.25,  0.00,  0.25
		]
	},




	head_girl : {
		loaded : false,
		url : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAEABAMAAAA3vtNUAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4QQHETANxYh/9wAAABVQTFRFAAAAAQAAHlcfzqGY7aBO/t6t////DQtU2QAAAAFiS0dEBmFmuH0AAAF3SURBVHja7dixDYAgFEBBXMUVXMEVWMH9R7CBhsQEgxEI90pCwT+oCLGxs7HQOwAAAAAAAAAAAAAAAAAAAGBBgHyQvwcHAAAAAAAAAAAAAAAAAAAAAPQH6BUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMBDmxcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAjAPQ/QIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAANXFlwEAAAAAAAAAAAAAAAAAAAAA5gWIjQEAAAAAAAAAAAAAAAAAAAAA5gW4UnuqHDSv530AAAAAAAAAAAAAAAAAAAAAgPkA4scBAAAAAAAAAAAAAAAAAAAAAMYFqB3oKBoVAgAAAAAAAAAAAAAAAAAAAADgQwQAAAAAAAAAAAAAAAAAAABYAOAGkFwBHUFPo3QAAAAASUVORK5CYII=",
		coordinates : [
			// Front
			0.25,  1.00,  0.50,  1.00,  0.50,  0.50,  0.25,  0.50,
			// Back
			0.75,  1.00,  0.75,  0.50,  1.00,  0.50,  1.00,  1.00,
			// Top
			0.50,  0.50,  0.25,  0.50,  0.25,  0.00,  0.50,  0.00,
			// Bottom
			0.25,  0.50,  0.00,  0.50,  0.00,  0.00,  0.25,  0.00,
			// Right
			0.75,  1.00,  0.75,  0.50,  0.50,  0.50,  0.50,  1.00,
			// Left
			0.00,  1.00,  0.25,  1.00,  0.25,  0.50,  0.00,  0.50
		]
	},

	body_girl : {
		loaded : false,
		url : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAEABAMAAAA3vtNUAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4QQHETAKW+zqVAAAACRQTFRFAAAAAQAAESsPEiwQEi0QEy0RUzgmc51xeHhY7aBO/t6t////NZ43jwAAAAFiS0dECx/XxMAAAAG3SURBVHja7dzBDYJAEAVQbcUWLEFbsAVaoAU7MLZglV7kQmKGcSAr8P6d5c/Lnsiyh/6TLpl+lHuQ55ccWgcAAAAAAAAAAAAAAAAAAAAAUAZ4BQEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAtAOoBgAAAAAAAAAAAAAAAAAAAACwHoC5gH4FiBL1y6437g0AAAAAAAAAWC3A0Q4AAAAAAAAA2gNEEBP7PbIFswMDAAAAAAAAAAAAAAAAAAAAAOYHGENEFypWC1YPdgAAAAAAAAAAAAAAAAAAAAAAlvuhIjs4AAAAAAAAAAAAAAAAAAAAAGA7AHMXBAAAAAAAAAAAAAAAAAAAAAD8L8BSBQEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAeYBTkOHCxOyLh+ei9av9qusDAAAAAAAAAAAAAAAAAAAAewSIBqkWWP0XIQAAAAAAAAAAAAAAAAAAAGBCztfbZUsATogAAAAAAAAAAAAAAAAAAAAA+wXokgEAAAAAAAAAAAAAAAAAAAAANAN4A9aeqqgS77CBAAAAAElFTkSuQmCC",
		coordinates : [
			// Front
			0.25,  1.00,  0.50,  1.00,  0.50,  0.25,  0.25,  0.25,
			// Back
			1.00,  1.00,  1.00,  0.25,  0.75,  0.25,  0.75,  1.00,
			// Top
			0.50,  0.00,  0.50,  0.25,  0.25,  0.25,  0.25,  0.00,
			// Bottom
			0.25,  0.25,  0.00,  0.25,  0.00,  0.00,  0.25,  0.00,
			// Right
			0.625, 1.00,  0.625, 0.50,  0.50,  0.50,  0.50,  1.00,
			// Left
			0.125, 1.00,  0.25,  1.00,  0.25,  0.50,  0.125, 0.50
		]
	},

	arm_girl : {
		loaded : false,
		url : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEABAMAAACuXLVVAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4QQHETAFy1P3xQAAAA9QTFRFAAAAc51xeHhY/t6t////lcT03wAAAAFiS0dEBI9o2VEAAACqSURBVHja7c4xAQAwCAMwLGBhFvDvDQkcO/okClJz6EP9EhAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEIgHOkxAQEBAQEBAQEBAQEBAQEBAQEBAQEBAIB94YQICAgICAgL5wIQJCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAjEAwsasIkARWqBIgAAAABJRU5ErkJggg==",
		coordinates : [
			// Front
			0.25,  1.00,  0.50,  1.00,  0.50,  0.25,  0.25,  0.25,
			// Back
			0.75,  1.00,  0.75,  0.25,  1.00,  0.25,  1.00,  1.00,
			// Top
			0.50,  0.25,  0.25,  0.25,  0.25,  0.00,  0.50,  0.00,
			// Bottom
			0.25,  0.25,  0.00,  0.25,  0.00,  0.00,  0.25,  0.00,
			// Right
			0.75,  1.00,  0.75,  0.25,  0.50,  0.25,  0.50,  1.00,
			// Left
			0.00,  1.00,  0.25,  1.00,  0.25,  0.25,  0.00,  0.25
		]
	},

	leg_girl : {
		loaded : false,
		url : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEAAgMAAAAhHED1AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4QQHETQ2EO9T1wAAAAxQTFRFAAAAUzgmdnZ2////YXAsqgAAAAFiS0dEAxEMTPIAAABdSURBVHja7cwhAQAwCAAwSlKSlPeYCxxsARbVZBM/AoFAIBAIBAKBQCAQCNYHOSQQCAQCgUAgEAgEAoFAIBAIBAKB4F5QQwKBQCAQCAQCgUAgEAgEAoFAIBAIzgUPYufllqXjnxAAAAAASUVORK5CYII=",
		coordinates : [
			// Front
			0.25,  1.00,  0.50,  1.00,  0.50,  0.25,  0.25,  0.25,
			// Back
			0.75,  1.00,  0.75,  0.25,  1.00,  0.25,  1.00,  1.00,
			// Top
			0.50,  0.25,  0.25,  0.25,  0.25,  0.00,  0.50,  0.00,
			// Bottom
			0.25,  0.25,  0.00,  0.25,  0.00,  0.00,  0.25,  0.00,
			// Right
			0.75,  1.00,  0.75,  0.25,  0.50,  0.25,  0.50,  1.00,
			// Left
			0.00,  1.00,  0.25,  1.00,  0.25,  0.25,  0.00,  0.25
		]
	}
};

function initTextures() {
	for (var i in textures) {
		textures[i].texture = gl.createTexture();
		textures[i].image = new Image();
		textures[i].image.onload = (function(i){
			return function() {
				handleTextureLoaded(textures[i].image, textures[i].texture);
				textures[i].loaded = true;
			}
		})(i);
		textures[i].image.src = textures[i].url;
	}

	// Set boy as active
	textures.head = textures.head_boy;
	textures.body = textures.body_boy;
	textures.arm = textures.arm_boy;
	textures.leg = textures.leg_boy;
}

var texturesBoy = true;
function toggleTextures() {
	if(texturesBoy){
		textures.head = textures.head_girl;
		textures.body = textures.body_girl;
		textures.arm = textures.arm_girl;
		textures.leg = textures.leg_girl;
	}
	else{
		textures.head = textures.head_boy;
		textures.body = textures.body_boy;
		textures.arm = textures.arm_boy;
		textures.leg = textures.leg_boy;
	}
	texturesBoy = !texturesBoy;
}

function handleTextureLoaded(image, texture) {
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
	gl.generateMipmap(gl.TEXTURE_2D);
	gl.bindTexture(gl.TEXTURE_2D, null);
}

// Create VBOs, IBOs and color
function createBuffers(w, h, d, t) {
	var x = w/2;
	var y = h/2;
	var z = d/2;
	
	var buffers = {};
	
	// Vertex Buffer Object
	buffers.position = gl.createBuffer();
	// Bind buffer to ARRAY_BUFFER
	gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
	vertices = [
		// Front face
		-x, -y,  z,
		 x, -y,  z,
		 x,  y,  z,
		-x,  y,  z,

		// Back face
		-x, -y, -z,
		-x,  y, -z,
		 x,  y, -z,
		 x, -y, -z,

		// Top face
		-x,  y, -z,
		-x,  y,  z,
		 x,  y,  z,
		 x,  y, -z,

		// Bottom face
		-x, -y, -z,
		 x, -y, -z,
		 x, -y,  z,
		-x, -y,  z,

		// Right face
		 x, -y, -z,
		 x,  y, -z,
		 x,  y,  z,
		 x, -y,  z,

		// Left face
		-x, -y, -z,
		-x, -y,  z,
		-x,  y,  z,
		-x,  y, -z
	];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	// every item has 3 coordinates (x,y,z)
	buffers.position.itemSize = 3;
	// we have 24 vertices
	buffers.position.numItems = 24;

	// Color
	buffers.color = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
	colors = [
		[1.0, 0.0, 0.0, 1.0], // Front face
		[1.0, 1.0, 0.0, 1.0], // Back face
		[0.0, 1.0, 0.0, 1.0], // Top face
		[1.0, 0.5, 0.5, 1.0], // Bottom face
		[1.0, 0.0, 1.0, 1.0], // Right face
		[0.0, 0.0, 1.0, 1.0]  // Left face
	];
	var unpackedColors = [];
	for (var i in colors) {
		var color = colors[i];
		// assign colors for each vertex of each face based on the packed representation above
		for (var j=0; j < 4; j++) {
			unpackedColors = unpackedColors.concat(color);
		}
	}
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(unpackedColors), gl.STATIC_DRAW);
	// every color has 4 values: red, green, blue and alpha (transparency: use 1.0 (opaque) for this demo)
	buffers.color.itemSize = 4;
	// 24 color values (we have 24 vertices to color...)
	buffers.color.numItems = 24;

	if(t){
		// Map the texture onto the cube's faces.
		buffers.textureCoord = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(t.coordinates), gl.STATIC_DRAW);
		buffers.textureCoord.itemSize = 2;
	}

	// Index Buffer Object
	// it joins sets of vertices into faces
	buffers.index = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);
	var cubeVertexIndices = [
	// this numbers are positions in the VBO array above
		0, 1, 2,      0, 2, 3,    // Front face
		4, 5, 6,      4, 6, 7,    // Back face
		8, 9, 10,     8, 10, 11,  // Top face
		12, 13, 14,   12, 14, 15, // Bottom face
		16, 17, 18,   16, 18, 19, // Right face
		20, 21, 22,   20, 22, 23  // Left face
	];
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
	// we have one item - the cube
	buffers.index.itemSize = 1;
	// we have 36 indices (6 faces, every face has 2 triangles, each triangle 3 vertices: 2x3x6=36)
	buffers.index.numItems = 36;
	
	return buffers;
}

// Helper Variables
var rPlayer = 0;

var xPlayer = 0.0;
var yPlayer = 0.0;
var isMoving = false;

// array for keeping pressed keys
var currentlyPressedKeys = {};

// Keyboard handlers
function handleKeyDown(event) {
	currentlyPressedKeys[event.keyCode] = true;
}
function handleKeyUp(event) {
	currentlyPressedKeys[event.keyCode] = false;
}

var speedPlayerConstant = 2;

// Key pressed callback
function handleKeys() {
	var moving = false;
	if (currentlyPressedKeys[37]) {
		// Left cursor key
		xPlayer -= speedPlayerConstant * animData.factor;
		moving = true;
	}
	else if (currentlyPressedKeys[39]) {
		// Right cursor key
		xPlayer += speedPlayerConstant * animData.factor;
		moving = true;
	}
	if (currentlyPressedKeys[38]) {
		// Up cursor key
		yPlayer -= speedPlayerConstant * animData.factor;
		moving = true;
	}
	else if (currentlyPressedKeys[40]) {
		// Down cursor key
		yPlayer += speedPlayerConstant * animData.factor;
		moving = true;
	}
	
	isMoving = moving;
	
	// Up cursor key
	if(currentlyPressedKeys[38]){
		if (currentlyPressedKeys[37]) {
			// Left cursor key
			rPlayer = -135;
		}
		else if (currentlyPressedKeys[39]) {
			// Right cursor key
			rPlayer = 135;
		}
		else {
			// Up
			rPlayer = 180;
		}
	}
	// Down cursor key
	else if(currentlyPressedKeys[40]){
		if (currentlyPressedKeys[37]) {
			// Left cursor key
			rPlayer = -45;
		}
		else if (currentlyPressedKeys[39]) {
			// Right cursor key
			rPlayer = 45;
		}
		else {
			// Down
			rPlayer = 0;
		}
	}
	else if (currentlyPressedKeys[37]) {
		// Left cursor key
		rPlayer = -90;
	}
	else if (currentlyPressedKeys[39]) {
		// Right cursor key
		rPlayer = 90;
	}
}

cameraDistance = 60;
cameraAngle = 35;

// For every frame this function draws the complete scene from the beginning
function drawScene() {
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	mat4.perspective(cameraDistance, gl.viewportWidth / gl.viewportHeight, 0.1, 1000.0, pMatrix);
	mat4.identity(mvMatrix);
	mat4.translate(mvMatrix, [0.0, 0.0, -100.0]);
	mat4.rotate(mvMatrix, degToRad(cameraAngle), [1, 0, 0]);
	mvPushMatrix();
	
		mat4.translate(mvMatrix, [xPlayer, 0.0, yPlayer]);
		mat4.rotate(mvMatrix, degToRad(rPlayer), [0, 1, 0]);
		
		
		// HEAD
		mvPushMatrix();
			if(!textures.head.loaded){
				gl.useProgram(shaderProgram);
			}
			else{
				gl.useProgram(textureShaderProgram);
			}

			mat4.translate(mvMatrix, [0.0, 28, 0.0]);

			gl.bindBuffer(gl.ARRAY_BUFFER, headBuffers.position);
			gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, headBuffers.position.itemSize, gl.FLOAT, false, 0, 0);
			
			if(!textures.head.loaded){
				gl.bindBuffer(gl.ARRAY_BUFFER, headBuffers.color);
				gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, headBuffers.color.itemSize, gl.FLOAT, false, 0, 0);
			}
			else{
				gl.bindBuffer(gl.ARRAY_BUFFER, headBuffers.textureCoord);
				gl.vertexAttribPointer(textureShaderProgram.textureCoordAttribute, headBuffers.textureCoord.itemSize, gl.FLOAT, false, 0, 0);
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, textures.head.texture);
				gl.uniform1i(gl.getUniformLocation(textureShaderProgram, "uSampler"), 0);
			}
			
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, headBuffers.index);

			if(!textures.head.loaded){
				setMatrixUniforms();
			}
			else{
				setMatrixUniformsTexture();
			}
			gl.drawElements(gl.TRIANGLES, headBuffers.index.numItems, gl.UNSIGNED_SHORT, 0);
		mvPopMatrix();
		
		
		// BODY
		mvPushMatrix();
			if(!textures.body.loaded){
				gl.useProgram(shaderProgram);
			}
			else{
				gl.useProgram(textureShaderProgram);
			}

			mat4.translate(mvMatrix, [0.0, 18, 0.0]);

			gl.bindBuffer(gl.ARRAY_BUFFER, bodyBuffers.position);
			gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, bodyBuffers.position.itemSize, gl.FLOAT, false, 0, 0);
			

			if(!textures.body.loaded){
				gl.bindBuffer(gl.ARRAY_BUFFER, bodyBuffers.color);
				gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, bodyBuffers.color.itemSize, gl.FLOAT, false, 0, 0);
			}
			else{
				gl.bindBuffer(gl.ARRAY_BUFFER, bodyBuffers.textureCoord);
				gl.vertexAttribPointer(textureShaderProgram.textureCoordAttribute, bodyBuffers.textureCoord.itemSize, gl.FLOAT, false, 0, 0);
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, textures.body.texture);
				gl.uniform1i(gl.getUniformLocation(textureShaderProgram, "uSampler"), 0);
			}

			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bodyBuffers.index);

			if(!textures.body.loaded){
				setMatrixUniforms();
			}
			else{
				setMatrixUniformsTexture();
			}
			gl.drawElements(gl.TRIANGLES, bodyBuffers.index.numItems, gl.UNSIGNED_SHORT, 0);
		mvPopMatrix();
	
		// ARM LEFT
		mvPushMatrix();
			if(!textures.arm.loaded){
				gl.useProgram(shaderProgram);
			}
			else{
				gl.useProgram(textureShaderProgram);
			}
			mat4.translate(mvMatrix, [-6, 18+3, 0.0]);
			mat4.rotate(mvMatrix, degToRad(animData.value * 30 * -1), [1, 0, 0]);
			mat4.translate(mvMatrix, [0, -3, 0.0]);

			gl.bindBuffer(gl.ARRAY_BUFFER, armBuffers.position);
			gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, armBuffers.position.itemSize, gl.FLOAT, false, 0, 0);

			if(!textures.arm.loaded){
				gl.bindBuffer(gl.ARRAY_BUFFER, armBuffers.color);
				gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, armBuffers.color.itemSize, gl.FLOAT, false, 0, 0);
			}
			else{
				gl.bindBuffer(gl.ARRAY_BUFFER, armBuffers.textureCoord);
				gl.vertexAttribPointer(textureShaderProgram.textureCoordAttribute, armBuffers.textureCoord.itemSize, gl.FLOAT, false, 0, 0);
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, textures.arm.texture);
				gl.uniform1i(gl.getUniformLocation(textureShaderProgram, "uSampler"), 0);
			}

			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, armBuffers.index);

			if(!textures.arm.loaded){
				setMatrixUniforms();
			}
			else{
				setMatrixUniformsTexture();
			}
			gl.drawElements(gl.TRIANGLES, armBuffers.index.numItems, gl.UNSIGNED_SHORT, 0);
		mvPopMatrix();
	

		// ARM RIGHT
		mvPushMatrix();
			if(!textures.arm.loaded){
				gl.useProgram(shaderProgram);
			}
			else{
				gl.useProgram(textureShaderProgram);
			}
			mat4.translate(mvMatrix, [6, 18+3, 0.0]);
			mat4.rotate(mvMatrix, degToRad(animData.value * 30), [1, 0, 0]);
			mat4.translate(mvMatrix, [0, -3, 0.0]);

			gl.bindBuffer(gl.ARRAY_BUFFER, armBuffers.position);
			gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, armBuffers.position.itemSize, gl.FLOAT, false, 0, 0);

			if(!textures.arm.loaded){
				gl.bindBuffer(gl.ARRAY_BUFFER, armBuffers.color);
				gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, armBuffers.color.itemSize, gl.FLOAT, false, 0, 0);
			}
			else{
				gl.bindBuffer(gl.ARRAY_BUFFER, armBuffers.textureCoord);
				gl.vertexAttribPointer(textureShaderProgram.textureCoordAttribute, armBuffers.textureCoord.itemSize, gl.FLOAT, false, 0, 0);
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, textures.arm.texture);
				gl.uniform1i(gl.getUniformLocation(textureShaderProgram, "uSampler"), 0);
			}

			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, armBuffers.index);

			if(!textures.arm.loaded){
				setMatrixUniforms();
			}
			else{
				setMatrixUniformsTexture();
			}
			gl.drawElements(gl.TRIANGLES, armBuffers.index.numItems, gl.UNSIGNED_SHORT, 0);
		mvPopMatrix();

		// LEG LEFT
		mvPushMatrix();
			if(!textures.leg.loaded){
				gl.useProgram(shaderProgram);
			}
			else{
				gl.useProgram(textureShaderProgram);
			}

			if(animData.value > 0){
				mat4.translate(mvMatrix, [-2, 6+6, -2]);
				mat4.rotate(mvMatrix, degToRad(animData.value * 30), [1, 0, 0]);
				mat4.translate(mvMatrix, [0, -6, 2]);
			} else {
				mat4.translate(mvMatrix, [-2, 6+6, 2]);
				mat4.rotate(mvMatrix, degToRad(animData.value * 30), [1, 0, 0]);
				mat4.translate(mvMatrix, [0, -6, -2]);
			}

			gl.bindBuffer(gl.ARRAY_BUFFER, legBuffers.position);
			gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, legBuffers.position.itemSize, gl.FLOAT, false, 0, 0);

			if(!textures.leg.loaded){
				gl.bindBuffer(gl.ARRAY_BUFFER, legBuffers.color);
				gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, legBuffers.color.itemSize, gl.FLOAT, false, 0, 0);
			}
			else{
				gl.bindBuffer(gl.ARRAY_BUFFER, legBuffers.textureCoord);
				gl.vertexAttribPointer(textureShaderProgram.textureCoordAttribute, legBuffers.textureCoord.itemSize, gl.FLOAT, false, 0, 0);
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, textures.leg.texture);
				gl.uniform1i(gl.getUniformLocation(textureShaderProgram, "uSampler"), 0);
			}

			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, legBuffers.index);

			if(!textures.leg.loaded){
				setMatrixUniforms();
			}
			else{
				setMatrixUniformsTexture();
			}
			gl.drawElements(gl.TRIANGLES, legBuffers.index.numItems, gl.UNSIGNED_SHORT, 0);
		mvPopMatrix();
	

		// LEG RIGHT
		mvPushMatrix();
			if(!textures.leg.loaded){
				gl.useProgram(shaderProgram);
			}
			else{
				gl.useProgram(textureShaderProgram);
			}

			if(animData.value < 0){
				mat4.translate(mvMatrix, [2, 6+6, -2]);
				mat4.rotate(mvMatrix, degToRad(animData.value * 30 * -1), [1, 0, 0]);
				mat4.translate(mvMatrix, [0, -6, 2]);
			} else {
				mat4.translate(mvMatrix, [2, 6+6, 2]);
				mat4.rotate(mvMatrix, degToRad(animData.value * 30 * -1), [1, 0, 0]);
				mat4.translate(mvMatrix, [0, -6, -2]);
			}

			gl.bindBuffer(gl.ARRAY_BUFFER, legBuffers.position);
			gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, legBuffers.position.itemSize, gl.FLOAT, false, 0, 0);

			if(!textures.leg.loaded){
				gl.bindBuffer(gl.ARRAY_BUFFER, legBuffers.color);
				gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, legBuffers.color.itemSize, gl.FLOAT, false, 0, 0);
			}
			else{
				gl.bindBuffer(gl.ARRAY_BUFFER, legBuffers.textureCoord);
				gl.vertexAttribPointer(textureShaderProgram.textureCoordAttribute, legBuffers.textureCoord.itemSize, gl.FLOAT, false, 0, 0);
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, textures.leg.texture);
				gl.uniform1i(gl.getUniformLocation(textureShaderProgram, "uSampler"), 0);
			}

			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, legBuffers.index);

			if(!textures.leg.loaded){
				setMatrixUniforms();
			}
			else{
				setMatrixUniformsTexture();
			}
			gl.drawElements(gl.TRIANGLES, legBuffers.index.numItems, gl.UNSIGNED_SHORT, 0);
		mvPopMatrix();		
	mvPopMatrix();
}

// Animation data
var animData = {
	state : true,
	value : 0.0,
	factor : 0.1
};

// Animate function
function animate() {
	if(isMoving){
		animData.value += ((animData.state) ? animData.factor : -animData.factor)
		if(animData.value <= -1 || animData.value >= 1) {
			animData.state = !animData.state;
		}
	}
	else if(Math.abs(animData.value) > animData.factor * 2) {
		animData.value += ((animData.value > 0)? -animData.factor : animData.factor);
	}
	else {
		animData.value = 0;
	}
}


var info = {
	last_update : 0,

	show : {
		position : null,
		degrees : null,
		cameraAngle : null,
		cameraDistance : null,
		speed : null
	},

	input : {
		position : null,
		degrees : null,
		cameraAngle : null,
		cameraDistance : null,
		speed : null
	}
};

function showInfo () {
	var now = new Date().getTime();

	// Return if lass than 1 sec ago
	if (now - info.last_update < 1000) {
		return;
	}

	info.show.position.textContent = '<' + Math.round(xPlayer) + ', ' + 0 + ', ' + Math.round(yPlayer) + '>';
	info.show.degrees.textContent = '<' + Math.round(rPlayer) + '>';
	info.show.cameraAngle.textContent = '<' + Math.round(cameraAngle) + '>';
	info.show.cameraDistance.textContent = '<' + Math.round(cameraDistance) + '>';
	info.show.speed.textContent = '<' + animData.factor + '>';
}

function infoInit () {
	info.show.position = document.getElementById('info-position');

	info.show.degrees = document.getElementById('info-degrees');
	info.input.degrees = document.getElementById('info-range-degrees');
	info.input.degrees.value = rPlayer;
	info.input.degrees.addEventListener('input', function(){
		window.rPlayer = parseInt(this.value, 10);
	}, false);

	info.show.cameraAngle = document.getElementById('info-camera-angle');
	info.input.cameraAngle = document.getElementById('info-range-camera-angle');
	info.input.cameraAngle.value = cameraAngle;
	info.input.cameraAngle.addEventListener('input', function(){
		window.cameraAngle = parseInt(this.value, 10);
	}, false);

	info.show.cameraDistance = document.getElementById('info-camera-distance');
	info.input.cameraDistance = document.getElementById('info-range-camera-distance');
	info.input.cameraDistance.value = cameraDistance;
	info.input.cameraDistance.addEventListener('input', function(){
		window.cameraDistance = parseInt(this.value, 10);
	}, false);

	info.show.speed = document.getElementById('info-speed');
	info.input.speed = document.getElementById('info-range-speed');
	info.input.speed.value = animData.factor;
	info.input.speed.addEventListener('input', function(){
		window.animData.factor = parseFloat(this.value);
	}, false);

}



// For every tick, request another frame
// each time we :
//  - handle keyboard events
//  - update animation variebles
//  - draw the scene
//  - show info
function tick() {
	requestAnimFrame(tick);
	handleKeys();
	animate();
	drawScene();
	showInfo();
}


// Set up the WebGL context 
// Start rendering content
function webGLStart() {
	// Get canvas element
	var canvas = document.getElementById("canvasWebGL");
	
	// Initialize canvas
	var support = initGL(canvas);
	
	// Check support
	if (!support) {
		// Not supported, so exit
		return;
	}

	// Initialize
	initTextures();
	initShaders();
	initBuffers();
	infoInit();

	// Canvas Background Color
	gl.clearColor(0.3, 0.3, 0.3, 1.0);
	
	// Enable z-buffer
	gl.enable(gl.DEPTH_TEST);

	// Attach keyboard listenes
	document.onkeydown = handleKeyDown;
	document.onkeyup = handleKeyUp;
	
	// Start ticking
	tick();
}

// cross browser requestAnimationFrame
window.requestAnimFrame = (function() {
  return window.requestAnimationFrame ||
         window.webkitRequestAnimationFrame ||
         window.mozRequestAnimationFrame ||
         window.oRequestAnimationFrame ||
         window.msRequestAnimationFrame ||
         function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
           window.setTimeout(callback, 1000/60);
         };
})();

// Start WebGL after page has loaded
window.addEventListener("load", function(){
	// My code here ...
	webGLStart();
}, false);
