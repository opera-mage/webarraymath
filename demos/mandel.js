importScripts("../polyfill/webarraymath.js");

// Simple Uint8ClampedArray polyfill (for IE).
if (!self.Uint8ClampedArray) {
  if (self.CanvasPixelArray)
    self.Uint8ClampedArray = self.CanvasPixelArray;
  else
    self.Uint8ClampedArray = self.Uint8Array;
}

onmessage = function (e) {
  // Get working set parameters.
  var width = e.data.width;
  var height = e.data.height;
  var reMin = e.data.reMin;
  var reMax = e.data.reMax;
  var imMin = e.data.imMin;
  var imMax = e.data.imMax;

  // Create the work data arrays.
  var reC = new Float32Array(width);
  var imC = new Float32Array(width);
  var reZ = new Float32Array(width);
  var imZ = new Float32Array(width);

  var imagRamp = new Float32Array(height);
  ArrayMath.ramp(imagRamp, imMin, imMax);
  ArrayMath.ramp(reC, reMin, reMax);

  // Create color component arrays.
  var r = new Float32Array(width);
  var g = new Float32Array(width);
  var b = new Float32Array(width);
  var a = new Float32Array(width);
  ArrayMath.fill(a, 255);

  // Create the target pixel array.
  var pixels = new Uint8ClampedArray(width * height * 4);

  var bytePos = 0, byteStride = width * 4;
  for (var y = 0; y < height; ++y) {
    // Clear work arrays.
    ArrayMath.fill(reZ, 0);
    ArrayMath.fill(imZ, 0);

    // Do work (z = z^2 + c)...
    for (var k = 0; k < 100; ++k) {
      ArrayMath.mulCplx(reZ, imZ, reZ, imZ, reZ, imZ);
      ArrayMath.add(reZ, reC, reZ);
      ArrayMath.add(imZ, imagRamp[y], imZ);
    }

    // Convert complex data into some nice colors.
    ArrayMath.mul(reZ, 50, reZ);
    ArrayMath.mul(imZ, 50, imZ);
    ArrayMath.cos(r, reZ);
    ArrayMath.sin(g, imZ);
    ArrayMath.add(b, reZ, imZ);
    ArrayMath.fract(b, b);
    ArrayMath.abs(r, r);
    ArrayMath.abs(g, g);
    ArrayMath.mul(r, 256, r);
    ArrayMath.mul(g, 256, g);
    ArrayMath.mul(b, 256, b);
    var pixelRow = pixels.subarray(bytePos, bytePos + byteStride);
    bytePos += byteStride;
    ArrayMath.pack(pixelRow, 0, 4, r, g, b, a);
  }

  // Post result back to the main thread.
  postMessage({
    pixels: pixels
  });
};

