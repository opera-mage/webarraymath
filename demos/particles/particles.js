"use strict";

(function(){
	/**
	 * Most of the WebGL-related code in this demo 
	 * comes from this tutorial by Dennis Ippel (thanks!) :
	 * http://www.rozengain.com/blog/2010/02/22/beginning-webgl-step-by-step-tutorial/
	 * 
	 */

	// requestAnimationFrame polyfill
	if ( !window.requestAnimationFrame ) {
		window.requestAnimationFrame =
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			function ( callback ) { setTimeout( callback, 1000/60 ); };
	}

	var offset = 0,
		deadTimeOut = 1000,
		i, n,
		canvas, gl,
		ratio,
		vertX1, vertY1, vertX2, vertY2,
		velX, velY, velZ,
		vertices,
		colorLoc,
		cw, 
		ch, 
		cr = 0, cg = 0, cb = 0,
		tr, tg, tb,
		rndX = 0,
		rndY = 0,
		rndOn = false,
		rndSX = 0,
		rndSY = 0,
		lastUpdate = 0,
		IDLE_DELAY = 6000,
		touches = [],
		totalLines = 500000,
		renderMode = 0,
		numLines = totalLines,
		tmp = new Float32Array( totalLines ),
		dx = new Float32Array( totalLines ),
		dy = new Float32Array( totalLines ),
		dist = new Float32Array( totalLines );

	// setup webGL
	loadScene();

	// add listeners
	window.addEventListener( "resize", onResize, false );
	document.addEventListener( "mousedown", onMouseDown, false );
	document.addEventListener( "keydown", onKey, false );
	document.addEventListener( "touchstart", onTouchStart, false );
	onResize();

	// start animation
	animate();

	function onResize(e) {
		cw = window.innerWidth; 
		ch = window.innerHeight;
	}  

	function registerTouch(px, py){
		touches.push((px/cw-.5)*3);
		touches.push((py/ch-.5)*-2);
	}

	function onMouseDown(e) {
		touches.length = 0;
		registerTouch( e.pageX, e.pageY );
		document.addEventListener( "mousemove", onMouseMove );
		document.addEventListener( "mouseup", onMouseUp );
		e.preventDefault();
	}

	function onMouseMove(e) {
		touches.length = 0;
		registerTouch( e.pageX, e.pageY );
	}

	function onMouseUp(e) {
		touches.length = 0;
		document.removeEventListener( "mousemove", onMouseMove );
		document.removeEventListener( "mouseup", onMouseUp );
	}

	function onTouchStart(e) {
		touches.length = 0;
		for (var i = 0; i < e.touches.length; i++) {
			var pos = e.touches[i];
			registerTouch( pos.clientX, pos.clientY );
		}
		document.addEventListener( "touchmove", onTouchMove );
		document.addEventListener( "touchend", onTouchEnd );
		e.preventDefault();
	}

	function onTouchMove(e) {
		touches.length = 0;
		for (var i = 0; i < e.touches.length; i++) {
			var pos = e.touches[i];
			registerTouch( pos.clientX, pos.clientY );
		}
		e.preventDefault();
	}

	function onTouchEnd(e) {
		touches.length = 0;
		document.removeEventListener( "touchmove", onTouchMove );
		document.removeEventListener( "touchend", onTouchEnd );
	}

	function animate() {
		requestAnimationFrame( animate );
		redraw();
	}

	function animateParticles()
	{
		var p, i, j, nt;

		// copy old positions
		vertX1.set( vertX2 );
		vertY1.set( vertY2 );

		// inertia
		ArrayMath.mul( velX, velX, velZ );
		ArrayMath.mul( velY, velY, velZ );

		// horizontal
		ArrayMath.add( vertX2, vertX2, velX );
		ArrayMath.abs( tmp, vertX2 );
		ArrayMath.sub( tmp, ratio, tmp );
		ArrayMath.sign( tmp, tmp );
		ArrayMath.mul( velX, velX, tmp );
		ArrayMath.clamp( vertX2, vertX2, -ratio, ratio );

		// vertical
		ArrayMath.add( vertY2, vertY2, velY );
		ArrayMath.abs( tmp, vertY2 );
		ArrayMath.sub( tmp, 1, tmp );
		ArrayMath.sign( tmp, tmp );
		ArrayMath.mul( velY, velY, tmp );
		ArrayMath.clamp( vertY2, vertY2, -1, 1 );

		// attraction when touched
		nt = touches.length;
		for( j=0; j<nt; j+=2 )
		{
			// dist = distance to touch point
			ArrayMath.sub( dx, touches[j], vertX1 );
			ArrayMath.sub( dy, touches[j+1], vertY1 );
			ArrayMath.absCplx( dist, dx, dy );

			// (dx, dy) = normalized direction
			ArrayMath.div( dx, dx, dist );
			ArrayMath.div( dy, dy, dist );

			// dist = attraction factor = (0.1 * 0.5 * (2 - dist))²
			ArrayMath.sub( dist, 2, dist );
			ArrayMath.mul( dist, 0.1 * 0.5, dist );
			ArrayMath.mul( dist, dist, dist );

			// velocity += attraction * dir
			ArrayMath.madd( velX, dx, dist, velX );
			ArrayMath.madd( velY, dy, dist, velY );
		}
	}

	function redraw()
	{
		// animate color
		cr = cr * .99 + tr * .01;
		cg = cg * .99 + tg * .01;
		cb = cb * .99 + tb * .01;
		gl.uniform4f( colorLoc, cr, cg, cb, .5 );

		// animate and attract particles
		animateParticles();
		updateVertexBuffer();

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			
		switch( renderMode ) {
			case 0 :
				gl.lineWidth(1);
				gl.drawArrays( gl.LINES, 0, numLines );
				break;
				
			case 1:
				gl.drawArrays( gl.TRIANGLE_STRIP, 0, numLines ); 
				break;
				
			case 2 :
				gl.lineWidth(1);
				gl.drawArrays( gl.LINE_STRIP, 0, numLines );
				break;
				
			case 3:
				gl.drawArrays( gl.TRIANGLE_FAN, 0, numLines ); 
				break;
		}
		
	}

	var colorTimeout;

	function switchColor() {
		var a = .5,
			c1 = .3+Math.random()*.2,
			c2 = Math.random()*.06+0.01,
			c3 = Math.random()*.06+0.02;
			
		switch( Math.floor( Math.random() * 3 ) ) {
			case 0 :
				//gl.uniform4f( colorLoc, c1, c2, c3, a );
				tr = c1;
				tg = c2;
				tb = c3;
				break;
			case 1 :
				//gl.uniform4f( colorLoc, c2, c1, c3, a );
				tr = c2;
				tg = c1;
				tb = c3;
				break;
			case 2 :
				//gl.uniform4f( colorLoc, c3, c2, c1, a );
				tr = c3;
				tg = c2;
				tb = c1;
				break;
		}

		if ( colorTimeout ) clearTimeout( colorTimeout );
		colorTimeout = setTimeout( switchColor, 500 + Math.random() * 4000 );
	}

	function updateVertexBuffer() {
		ArrayMath.pack(vertices, 0, 4, vertX1, vertY1, vertX2, vertY2);
		gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
	}

	function loadScene()
	{
		//    Get the canvas element
		canvas = document.getElementById("webGLCanvas");
		//    Get the WebGL context
		gl = canvas.getContext("experimental-webgl");
		//    Check whether the WebGL context is available or not
		//    if it's not available exit
		if(!gl)
		{
			alert("There's no WebGL context available.");
			return;
		}
		//    Set the viewport to the canvas width and height
		cw = window.innerWidth;
		ch = window.innerHeight;
		canvas.width = cw;
		canvas.height = ch;
		gl.viewport(0, 0, canvas.width, canvas.height);
		
		//    Load the vertex shader that's defined in a separate script
		//    block at the top of this page.
		//    More info about shaders: http://en.wikipedia.org/wiki/Shader_Model
		//    More info about GLSL: http://en.wikipedia.org/wiki/GLSL
		//    More info about vertex shaders: http://en.wikipedia.org/wiki/Vertex_shader
		
		//    Grab the script element
		var vertexShaderScript = document.getElementById("shader-vs");
		var vertexShader = gl.createShader(gl.VERTEX_SHADER);
		gl.shaderSource(vertexShader, vertexShaderScript.text);
		gl.compileShader(vertexShader);
		if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
			alert("Couldn't compile the vertex shader");
			gl.deleteShader(vertexShader);
			return;
		}
		
		//    Load the fragment shader that's defined in a separate script
		//    More info about fragment shaders: http://en.wikipedia.org/wiki/Fragment_shader
		//var fragmentShaderScript = document.getElementById("shader-fs");
		var fragmentShaderScript = document.getElementById("shader-fs");
		
		var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(fragmentShader, fragmentShaderScript.text);
		gl.compileShader(fragmentShader);
		if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
			alert("Couldn't compile the fragment shader");
			gl.deleteShader(fragmentShader);
			return;
		}

		//    Create a shader program. 
		gl.program = gl.createProgram();
		gl.attachShader(gl.program, vertexShader);
		gl.attachShader(gl.program, fragmentShader);
		gl.linkProgram(gl.program);
		if (!gl.getProgramParameter(gl.program, gl.LINK_STATUS)) {
			alert("Unable to initialise shaders");
			gl.deleteProgram(gl.program);
			gl.deleteProgram(vertexShader);
			gl.deleteProgram(fragmentShader);
			return;
		}
		//    Install the program as part of the current rendering state
		gl.useProgram(gl.program);
		
		
		// get the color uniform location
		colorLoc = gl.getUniformLocation( gl.program, "color" );
		gl.uniform4f( colorLoc, 0.4, 0.01, 0.08, 0.5 );
		
		
		//    Get the vertexPosition attribute from the linked shader program
		var vertexPosition = gl.getAttribLocation(gl.program, "vertexPosition");
		//    Enable the vertexPosition vertex attribute array. If enabled, the array
		//    will be accessed an used for rendering when calls are made to commands like
		//    gl.drawArrays, gl.drawElements, etc.
		gl.enableVertexAttribArray(vertexPosition);
		
		//    Clear the color buffer (r, g, b, a) with the specified color
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		//    Clear the depth buffer. The value specified is clamped to the range [0,1].
		//    More info about depth buffers: http://en.wikipedia.org/wiki/Depth_buffer
		gl.clearDepth(1.0);
		//    Enable depth testing. This is a technique used for hidden surface removal.
		//    It assigns a value (z) to each pixel that represents the distance from this
		//    pixel to the viewer. When another pixel is drawn at the same location the z
		//    values are compared in order to determine which pixel should be drawn.
		//gl.enable(gl.DEPTH_TEST);
		gl.enable(gl.BLEND);
		gl.disable(gl.DEPTH_TEST);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
		//    Specify which function to use for depth buffer comparisons. It compares the
		//    value of the incoming pixel against the one stored in the depth buffer.
		//    Possible values are (from the OpenGL documentation):
		//    GL_NEVER - Never passes.
		//    GL_LESS - Passes if the incoming depth value is less than the stored depth value.
		//    GL_EQUAL - Passes if the incoming depth value is equal to the stored depth value.
		//    GL_LEQUAL - Passes if the incoming depth value is less than or equal to the stored depth value.
		//    GL_GREATER - Passes if the incoming depth value is greater than the stored depth value.
		//    GL_NOTEQUAL - Passes if the incoming depth value is not equal to the stored depth value.
		//    GL_GEQUAL - Passes if the incoming depth value is greater than or equal to the stored depth value.
		//    GL_ALWAYS - Always passes.                        
		//gl.depthFunc(gl.LEQUAL);
		
		//    Now create a shape.
		//    First create a vertex buffer in which we can store our data.
		var vertexBuffer = gl.createBuffer();
		//    Bind the buffer object to the ARRAY_BUFFER target.
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);


		//    
		vertX1 = new Float32Array( totalLines );
		vertY1 = new Float32Array( totalLines );
		vertX2 = new Float32Array( totalLines );
		vertY2 = new Float32Array( totalLines );
		velX = new Float32Array( totalLines );
		velY = new Float32Array( totalLines );
		velZ = new Float32Array( totalLines );
		ratio = cw / ch;
		for ( var i=0; i<totalLines; i++ )
		{
			velX[i] = (Math.random() * 2 - 1)*.05;
			velY[i] = (Math.random() * 2 - 1)*.05;
			velZ[i] = .93 + Math.random()*.02;
		}
		vertices = new Float32Array( totalLines * 2 * 2 );
		updateVertexBuffer();
		
		//    Clear the color buffer and the depth buffer
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		//    Define the viewing frustum parameters
		//    More info: http://en.wikipedia.org/wiki/Viewing_frustum
		//    More info: http://knol.google.com/k/view-frustum
		var fieldOfView = 30.0;
		var aspectRatio = canvas.width / canvas.height;
		var nearPlane = 1.0;
		var farPlane = 10000.0;
		var top = nearPlane * Math.tan(fieldOfView * Math.PI / 360.0);
		var bottom = -top;
		var right = top * aspectRatio;
		var left = -right;

		//     Create the perspective matrix. The OpenGL function that's normally used for this,
		//     glFrustum() is not included in the WebGL API. That's why we have to do it manually here.
		//     More info: http://www.cs.utk.edu/~vose/c-stuff/opengl/glFrustum.html
		var a = (right + left) / (right - left);
		var b = (top + bottom) / (top - bottom);
		var c = (farPlane + nearPlane) / (farPlane - nearPlane);
		var d = (2 * farPlane * nearPlane) / (farPlane - nearPlane);
		var x = (2 * nearPlane) / (right - left);
		var y = (2 * nearPlane) / (top - bottom);
		var perspectiveMatrix = [
			x, 0, a, 0,
			0, y, b, 0,
			0, 0, c, d,
			0, 0, -1, 0
		];
		
		//     Create the modelview matrix
		//     More info about the modelview matrix: http://3dengine.org/Modelview_matrix
		//     More info about the identity matrix: http://en.wikipedia.org/wiki/Identity_matrix
		var modelViewMatrix = [
			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1
		];
		//     Get the vertex position attribute location from the shader program
		var vertexPosAttribLocation = gl.getAttribLocation(gl.program, "vertexPosition");
	//				colorLoc = gl.getVaryingLocation(gl.program, "vColor");
	//				alert("color loc : " + colorLoc );
		//     Specify the location and format of the vertex position attribute
		gl.vertexAttribPointer(vertexPosAttribLocation, 2.0, gl.FLOAT, false, 0, 0);
		//     Get the location of the "modelViewMatrix" uniform variable from the 
		//     shader program
		var uModelViewMatrix = gl.getUniformLocation(gl.program, "modelViewMatrix");
		//     Get the location of the "perspectiveMatrix" uniform variable from the 
		//     shader program
		var uPerspectiveMatrix = gl.getUniformLocation(gl.program, "perspectiveMatrix");
		//     Set the values
		gl.uniformMatrix4fv(uModelViewMatrix, false, new Float32Array(perspectiveMatrix));
		gl.uniformMatrix4fv(uPerspectiveMatrix, false, new Float32Array(modelViewMatrix));
	//	gl.varyingVector4fv( 
		//     Draw the triangles in the vertex buffer. The first parameter specifies what
		//     drawing mode to use. This can be GL_POINTS, GL_LINE_STRIP, GL_LINE_LOOP, 
		//     GL_LINES, GL_TRIANGLE_STRIP, GL_TRIANGLE_FAN, GL_TRIANGLES, GL_QUAD_STRIP, 
		//     GL_QUADS, and GL_POLYGON
		
		switchColor();
	}

	function onKey( e ) {
		setRenderMode( ++renderMode % 4 );
	}

	function setRenderMode( n ) {
		renderMode = n;
		switch(renderMode) {
			case 0: // lines
				numLines = totalLines;
				break;
			case 1: // triangle strip
				numLines = 600;
				break;
			case 2: // lines strip
				numLines = 7000;
				break;
			case 3: // quad strip
				numLines = 400;
				break;
		}
	}
}());

