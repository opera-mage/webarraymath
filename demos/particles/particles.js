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

	var
		m_fpsCounter = new FPSCounter(),
		m_fpsElement = document.getElementById("fps"),
		m_colorTimeout,
		m_canvas,
		gl,
		m_screenRatio,
		m_vertX1, m_vertY1, m_vertX2, m_vertY2,
		m_velX, m_velY, m_inertia,
		m_vertices,
		m_colorLoc,
		m_cw, m_ch,
		m_cr = 0, m_cg = 0, m_cb = 0,
		m_tr, m_tg, m_tb,
		m_touches = [],
		m_numLines = 500000,
		m_tmp = new Float32Array( m_numLines ),
		m_dx = new Float32Array( m_numLines ),
		m_dy = new Float32Array( m_numLines ),
		m_dist = new Float32Array( m_numLines );

	// setup webGL
	loadScene();

	// add listeners
	window.addEventListener( "resize", onResize, false );
	document.addEventListener( "mousedown", onMouseDown, false );
	document.addEventListener( "touchstart", onTouch, false );
	document.addEventListener( "touchmove", onTouch, false );
	document.addEventListener( "touchend", onTouch, false );

	// start animation
	animate();

	function updateCanvasSize(w, h) {
		m_cw = w;
		m_ch = h;
		m_screenRatio = m_cw / m_ch;
		m_canvas.width = m_cw;
		m_canvas.height = m_ch;
		gl.viewport(0, 0, m_canvas.width, m_canvas.height);
	}

	function updatePerspectiveMatrix(w, h) {
		//    Define the viewing frustum parameters
		//    More info: http://en.wikipedia.org/wiki/Viewing_frustum
		//    More info: http://knol.google.com/k/view-frustum
		var fieldOfView = 30.0;
		var aspectRatio = w / h;
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
		//     Get the location of the "perspectiveMatrix" uniform variable from the
		//     shader program
		var uPerspectiveMatrix = gl.getUniformLocation(gl.program, "perspectiveMatrix");
		//     Set the values
		gl.uniformMatrix4fv(uPerspectiveMatrix, false, new Float32Array(perspectiveMatrix));
	}

	function onResize(e) {
		var w = window.innerWidth, h = window.innerHeight;
		updateCanvasSize(w, h);
		updatePerspectiveMatrix(w, h);
	}  

	function registerTouch(px, py){
		m_touches.push((px/m_cw-.5)*2*m_screenRatio);
		m_touches.push((py/m_ch-.5)*-2);
	}

	function onMouseDown(e) {
		m_touches.length = 0;
		registerTouch( e.pageX, e.pageY );
		document.addEventListener( "mousemove", onMouseMove );
		document.addEventListener( "mouseup", onMouseUp );
		e.preventDefault();
	}

	function onMouseMove(e) {
		m_touches.length = 0;
		registerTouch( e.pageX, e.pageY );
	}

	function onMouseUp(e) {
		m_touches.length = 0;
		document.removeEventListener( "mousemove", onMouseMove );
		document.removeEventListener( "mouseup", onMouseUp );
	}

	function onTouch(e) {
		m_touches.length = 0;
		for (var i = 0; i < e.touches.length; i++) {
			var pos = e.touches[i];
			registerTouch( pos.clientX, pos.clientY );
		}
		e.preventDefault();
	}

	function animate() {
		m_fpsCounter.update();

		requestAnimationFrame( animate );
		redraw();

		var fps = m_fpsCounter.get();
		if (fps > 0) {
			var fpsDisp = Math.round(fps * 10) / 10;
			m_fpsElement.innerHTML = "" + fpsDisp + " fps";
		}
	}

	function animateParticles()
	{
		var p, i, j, nt;

		// copy old positions
		m_vertX1.set( m_vertX2 );
		m_vertY1.set( m_vertY2 );

		// inertia
		ArrayMath.mul( m_velX, m_inertia, m_velX );
		ArrayMath.mul( m_velY, m_inertia, m_velY );

		// horizontal
		ArrayMath.add( m_vertX2, m_vertX2, m_velX );
		ArrayMath.abs( m_tmp, m_vertX2 );
		ArrayMath.sub( m_tmp, m_screenRatio, m_tmp );
		ArrayMath.sign( m_tmp, m_tmp );
		ArrayMath.mul( m_velX, m_velX, m_tmp );
		ArrayMath.clamp( m_vertX2, m_vertX2, -m_screenRatio, m_screenRatio );

		// vertical
		ArrayMath.add( m_vertY2, m_vertY2, m_velY );
		ArrayMath.abs( m_tmp, m_vertY2 );
		ArrayMath.sub( m_tmp, 1, m_tmp );
		ArrayMath.sign( m_tmp, m_tmp );
		ArrayMath.mul( m_velY, m_velY, m_tmp );
		ArrayMath.clamp( m_vertY2, m_vertY2, -1, 1 );

		// attraction when touched
		nt = m_touches.length;
		for( j=0; j<nt; j+=2 )
		{
			// m_dist = distance to touch point
			ArrayMath.sub( m_dx, m_touches[j], m_vertX1 );
			ArrayMath.sub( m_dy, m_touches[j+1], m_vertY1 );
			ArrayMath.absCplx( m_dist, m_dx, m_dy );

			// (m_dx, m_dy) = normalized direction
			ArrayMath.div( m_dx, m_dx, m_dist );
			ArrayMath.div( m_dy, m_dy, m_dist );

			// m_dist = attraction factor = (0.1 * (1 - m_dist / 4))²
			ArrayMath.sub( m_dist, 4, m_dist );
			ArrayMath.mul( m_dist, 0.1 / 4, m_dist );
			ArrayMath.mul( m_dist, m_dist, m_dist );

			// velocity += attraction * dir
			ArrayMath.madd( m_velX, m_dx, m_dist, m_velX );
			ArrayMath.madd( m_velY, m_dy, m_dist, m_velY );
		}
	}

	function redraw()
	{
		// animate color
		m_cr = m_cr * .99 + m_tr * .01;
		m_cg = m_cg * .99 + m_tg * .01;
		m_cb = m_cb * .99 + m_tb * .01;
		gl.uniform4f( m_colorLoc, m_cr, m_cg, m_cb, .5 );

		// animate and attract particles
		animateParticles();
		updateVertexBuffer();

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			
		gl.lineWidth(1);
		gl.drawArrays( gl.LINES, 0, m_numLines );
	}

	function switchColor() {
		var a = .5,
			c1 = .3+Math.random()*.2,
			c2 = Math.random()*.06+0.01,
			c3 = Math.random()*.06+0.02;
			
		switch( Math.floor( Math.random() * 3 ) ) {
			case 0 :
				m_tr = c1;
				m_tg = c2;
				m_tb = c3;
				break;
			case 1 :
				m_tr = c2;
				m_tg = c1;
				m_tb = c3;
				break;
			case 2 :
				m_tr = c3;
				m_tg = c2;
				m_tb = c1;
				break;
		}

		if ( m_colorTimeout )
			clearTimeout( m_colorTimeout );
		m_colorTimeout = setTimeout( switchColor, 500 + Math.random() * 4000 );
	}

	function updateVertexBuffer() {
		ArrayMath.pack(m_vertices, 0, 4, m_vertX1, m_vertY1, m_vertX2, m_vertY2);
		gl.bufferData(gl.ARRAY_BUFFER, m_vertices, gl.DYNAMIC_DRAW);
	}

	function loadScene()
	{
		//    Get the canvas element
		m_canvas = document.getElementById("webGLCanvas");
		//    Get the WebGL context
		gl = m_canvas.getContext("experimental-webgl");
		//    Check whether the WebGL context is available or not
		//    if it's not available exit
		if(!gl)
		{
			alert("There's no WebGL context available.");
			return;
		}
		//    Set the viewport to the canvas width and height
		updateCanvasSize(window.innerWidth, window.innerHeight);
		
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
		m_colorLoc = gl.getUniformLocation( gl.program, "color" );
		gl.uniform4f( m_colorLoc, 0.4, 0.01, 0.08, 0.5 );
		
		
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

		m_vertX1 = new Float32Array( m_numLines );
		m_vertY1 = new Float32Array( m_numLines );
		m_vertX2 = new Float32Array( m_numLines );
		m_vertY2 = new Float32Array( m_numLines );
		m_velX = new Float32Array( m_numLines );
		m_velY = new Float32Array( m_numLines );
		m_inertia = new Float32Array( m_numLines );
		ArrayMath.random( m_velX, -0.05, 0.05 );
		ArrayMath.random( m_velY, -0.05, 0.05 );
		ArrayMath.random( m_inertia, 0.93, 0.96 );
		m_vertices = new Float32Array( m_numLines * 2 * 2 );
		updateVertexBuffer();
		
		//    Clear the color buffer and the depth buffer
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		//     Get the vertex position attribute location from the shader program
		var vertexPosAttribLocation = gl.getAttribLocation(gl.program, "vertexPosition");
		//     Specify the location and format of the vertex position attribute
		gl.vertexAttribPointer(vertexPosAttribLocation, 2.0, gl.FLOAT, false, 0, 0);
		
		updatePerspectiveMatrix(window.innerWidth, window.innerHeight);

		switchColor();
	}

}());

