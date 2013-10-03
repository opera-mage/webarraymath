importScripts("../polyfill/webarraymath.js");

// Simple Uint8ClampedArray polyfill (for IE).
if (!self.Uint8ClampedArray) {
  if (self.CanvasPixelArray)
    self.Uint8ClampedArray = self.CanvasPixelArray;
  else
    self.Uint8ClampedArray = self.Uint8Array;
}

// Persistent data.
var m_width = -1;
var m_height = -1;
var m_reC, m_imC, m_reZ, m_imZ;
var m_r, m_g, m_b, m_a;

onmessage = function (e) {
  // Get working set parameters.
  var width = e.data.width;
  var height = e.data.height;
  var reMin = e.data.reMin;
  var reMax = e.data.reMax;
  var imMin = e.data.imMin;
  var imMax = e.data.imMax;

  // New width?
  if (width != m_width) {
    m_width = width;

    // Create the work data arrays.
    m_reC = new Float32Array(width);
    m_reZ = new Float32Array(width);
    m_imZ = new Float32Array(width);

    // Create color component arrays.
    m_r = new Float32Array(width);
    m_g = new Float32Array(width);
    m_b = new Float32Array(width);
    m_a = new Float32Array(width);
    ArrayMath.fill(m_a, 255);
  }

  // New height?
  if (height != m_height) {
    m_imC = new Float32Array(height);
    m_height = height;
  }

  // Update work area.
  ArrayMath.ramp(m_reC, reMin, reMax);
  ArrayMath.ramp(m_imC, imMin, imMax);

  // Create the target pixel array.
  var pixels = new Uint8ClampedArray(width * height * 4);

  // We process one row at a time since that typically gives better cache
  // performance (all data is pretty much guaranteed to fit in the L1 cache),
  // and it simplifies the m_reC & m_imC handling.
  var bytePos = 0, byteStride = width * 4;
  for (var y = 0; y < height; ++y) {
    // Clear work arrays.
    ArrayMath.fill(m_reZ, 0);
    ArrayMath.fill(m_imZ, 0);

    // Do work (z = z^2 + c)...
    for (var k = 0; k < 100; ++k) {
      ArrayMath.mulCplx(m_reZ, m_imZ, m_reZ, m_imZ, m_reZ, m_imZ);
      ArrayMath.add(m_reZ, m_reC, m_reZ);
      ArrayMath.add(m_imZ, m_imC[y], m_imZ);
    }

    // Convert complex data into some nice colors.
    ArrayMath.mul(m_reZ, 50, m_reZ);
    ArrayMath.mul(m_imZ, 50, m_imZ);
    ArrayMath.cos(m_r, m_reZ);
    ArrayMath.sin(m_g, m_imZ);
    ArrayMath.add(m_b, m_reZ, m_imZ);
    ArrayMath.fract(m_b, m_b);
    ArrayMath.abs(m_r, m_r);
    ArrayMath.abs(m_g, m_g);
    ArrayMath.mul(m_r, 256, m_r);
    ArrayMath.mul(m_g, 256, m_g);
    ArrayMath.mul(m_b, 256, m_b);
    var pixelRow = pixels.subarray(bytePos, bytePos + byteStride);
    bytePos += byteStride;
    ArrayMath.pack(pixelRow, 0, 4, m_r, m_g, m_b, m_a);
  }

  // Post result back to the main thread.
  postMessage({
    pixels: pixels
  });
};

