function Benchmark(println) {
  var LENGTH = 2048;
  var MIN_ITERATIONS = 10000;
  var MIN_DT = 1000;

  var showResult = function (name, samples, dt) {
    var samplesPerSec = samples / (dt * 0.001);
    println(name + ": " + (0.000001 * samplesPerSec).toFixed(1) + " Ms/s");
  };

  // Time getter function.
  var time;
  if (self.performance) {
    if (self.performance.now)
      time = function () { return self.performance.now(); };
    else if (self.performance.webkitNow)
      time = function () { return self.performance.webkitNow(); };
  }
  if (!time) {
    if (Date.now)
      time = function () { return Date.now(); };
    else
      time = function () { return new Date().getTime(); };
  }

  println("---Benchmark---");

  var x = new Float32Array(LENGTH);
  var y = new Float32Array(LENGTH);
  var z = new Float32Array(LENGTH);
  var xIm = new Float32Array(LENGTH);
  var yIm = new Float32Array(LENGTH);
  var zIm = new Float32Array(LENGTH);
  var p = new Uint8Array(LENGTH * 4);
  var t0, dt, total_t = 0, total_samples = 0, k, filter, fft;

  // ...just warm up the CPU...
  println("(warming up...)");
  ArrayMath.ramp(x, -1000, 1000);
  ArrayMath.ramp(y, -1000, 1000);
  ArrayMath.ramp(xIm, -1000, 1000);
  ArrayMath.ramp(yIm, -1000, 1000);
  dt = 0;
  for (k = 0; k < MIN_ITERATIONS || dt < MIN_DT; ++k) {
    t0 = time();
    ArrayMath.mulCplx(z, xIm, x, xIm, y, yIm);
    dt += time() - t0;
  }

  // add
  ArrayMath.ramp(x, -1000, 1000);
  ArrayMath.ramp(y, -1000, 1000);
  dt = 0;
  for (k = 0; k < MIN_ITERATIONS || dt < MIN_DT; ++k) {
    t0 = time();
    ArrayMath.add(z, x, y);
    dt += time() - t0;
  }
  total_t += dt;
  total_samples += k * LENGTH;
  showResult("add", k * LENGTH, dt);

  // sub
  ArrayMath.ramp(x, -1000, 1000);
  ArrayMath.ramp(y, -1000, 1000);
  dt = 0;
  for (k = 0; k < MIN_ITERATIONS || dt < MIN_DT; ++k) {
    t0 = time();
    ArrayMath.sub(z, x, y);
    dt += time() - t0;
  }
  total_t += dt;
  total_samples += k * LENGTH;
  showResult("sub", k * LENGTH, dt);

  // mul
  ArrayMath.ramp(x, -1000, 1000);
  ArrayMath.ramp(y, -1000, 1000);
  dt = 0;
  for (k = 0; k < MIN_ITERATIONS || dt < MIN_DT; ++k) {
    t0 = time();
    ArrayMath.mul(z, x, y);
    dt += time() - t0;
  }
  total_t += dt;
  total_samples += k * LENGTH;
  showResult("mul", k * LENGTH, dt);

  // mulCplx
  ArrayMath.ramp(x, -1000, 1000);
  ArrayMath.ramp(xIm, -1000, 1000);
  ArrayMath.ramp(y, -1000, 1000);
  ArrayMath.ramp(yIm, -1000, 1000);
  dt = 0;
  for (k = 0; k < MIN_ITERATIONS || dt < MIN_DT; ++k) {
    t0 = time();
    ArrayMath.mulCplx(z, xIm, x, xIm, y, yIm);
    dt += time() - t0;
  }
  total_t += dt;
  total_samples += k * LENGTH;
  showResult("mulCplx", k * LENGTH, dt);

  // div
  ArrayMath.ramp(x, -1000, 1000);
  ArrayMath.ramp(y, 10, 100);
  dt = 0;
  for (k = 0; k < MIN_ITERATIONS || dt < MIN_DT; ++k) {
    t0 = time();
    ArrayMath.div(z, x, y);
    dt += time() - t0;
  }
  total_t += dt;
  total_samples += k * LENGTH;
  showResult("div", k * LENGTH, dt);

  // divCplx
  ArrayMath.ramp(x, -1000, 1000);
  ArrayMath.ramp(xIm, -1000, 1000);
  ArrayMath.ramp(y, 10, 1000);
  ArrayMath.ramp(yIm, 10, 1000);
  dt = 0;
  for (k = 0; k < MIN_ITERATIONS || dt < MIN_DT; ++k) {
    t0 = time();
    ArrayMath.divCplx(z, xIm, x, xIm, y, yIm);
    dt += time() - t0;
  }
  total_t += dt;
  total_samples += k * LENGTH;
  showResult("divCplx", k * LENGTH, dt);

  // madd
  ArrayMath.ramp(x, -1000, 1000);
  ArrayMath.ramp(y, -1000, 1000);
  dt = 0;
  for (k = 0; k < MIN_ITERATIONS || dt < MIN_DT; ++k) {
    t0 = time();
    ArrayMath.madd(z, 0.5, x, y);
    dt += time() - t0;
  }
  total_t += dt;
  total_samples += k * LENGTH;
  showResult("madd", k * LENGTH, dt);

  // abs
  ArrayMath.ramp(x, -1000, 1000);
  dt = 0;
  for (k = 0; k < MIN_ITERATIONS || dt < MIN_DT; ++k) {
    t0 = time();
    ArrayMath.abs(z, x);
    dt += time() - t0;
  }
  total_t += dt;
  total_samples += k * LENGTH;
  showResult("abs", k * LENGTH, dt);

  // absCplx
  ArrayMath.ramp(x, -1000, 1000);
  ArrayMath.ramp(xIm, 10, 1000);
  dt = 0;
  for (k = 0; k < MIN_ITERATIONS || dt < MIN_DT; ++k) {
    t0 = time();
    ArrayMath.absCplx(z, x, xIm);
    dt += time() - t0;
  }
  total_t += dt;
  total_samples += k * LENGTH;
  showResult("absCplx", k * LENGTH, dt);

  // acos
  ArrayMath.ramp(x, -1, 1);
  dt = 0;
  for (k = 0; k < MIN_ITERATIONS || dt < MIN_DT; ++k) {
    t0 = time();
    ArrayMath.acos(z, x);
    dt += time() - t0;
  }
  total_t += dt;
  total_samples += k * LENGTH;
  showResult("acos", k * LENGTH, dt);

  // asin
  ArrayMath.ramp(x, -1, 1);
  dt = 0;
  for (k = 0; k < MIN_ITERATIONS || dt < MIN_DT; ++k) {
    t0 = time();
    ArrayMath.asin(z, x);
    dt += time() - t0;
  }
  total_t += dt;
  total_samples += k * LENGTH;
  showResult("asin", k * LENGTH, dt);

  // atan
  ArrayMath.ramp(x, -1, 1);
  dt = 0;
  for (k = 0; k < MIN_ITERATIONS || dt < MIN_DT; ++k) {
    t0 = time();
    ArrayMath.atan(z, x);
    dt += time() - t0;
  }
  total_t += dt;
  total_samples += k * LENGTH;
  showResult("atan", k * LENGTH, dt);

  // atan2
  ArrayMath.ramp(x, -1, 1);
  ArrayMath.ramp(y, 1, 0);
  dt = 0;
  for (k = 0; k < MIN_ITERATIONS || dt < MIN_DT; ++k) {
    t0 = time();
    ArrayMath.atan2(z, x, y);
    dt += time() - t0;
  }
  total_t += dt;
  total_samples += k * LENGTH;
  showResult("atan2", k * LENGTH, dt);

  // ceil
  ArrayMath.ramp(x, -1000, 1000);
  dt = 0;
  for (k = 0; k < MIN_ITERATIONS || dt < MIN_DT; ++k) {
    t0 = time();
    ArrayMath.ceil(z, x);
    dt += time() - t0;
  }
  total_t += dt;
  total_samples += k * LENGTH;
  showResult("ceil", k * LENGTH, dt);

  // cos
  ArrayMath.ramp(x, -1000, 1000);
  dt = 0;
  for (k = 0; k < MIN_ITERATIONS || dt < MIN_DT; ++k) {
    t0 = time();
    ArrayMath.cos(z, x);
    dt += time() - t0;
  }
  total_t += dt;
  total_samples += k * LENGTH;
  showResult("cos", k * LENGTH, dt);

  // exp
  ArrayMath.ramp(x, -1000, 1000);
  dt = 0;
  for (k = 0; k < MIN_ITERATIONS || dt < MIN_DT; ++k) {
    t0 = time();
    ArrayMath.exp(z, x);
    dt += time() - t0;
  }
  total_t += dt;
  total_samples += k * LENGTH;
  showResult("exp", k * LENGTH, dt);

  // floor
  ArrayMath.ramp(x, -1000, 1000);
  dt = 0;
  for (k = 0; k < MIN_ITERATIONS || dt < MIN_DT; ++k) {
    t0 = time();
    ArrayMath.floor(z, x);
    dt += time() - t0;
  }
  total_t += dt;
  total_samples += k * LENGTH;
  showResult("floor", k * LENGTH, dt);

  // log
  ArrayMath.ramp(x, 1, 1000);
  dt = 0;
  for (k = 0; k < MIN_ITERATIONS || dt < MIN_DT; ++k) {
    t0 = time();
    ArrayMath.log(z, x);
    dt += time() - t0;
  }
  total_t += dt;
  total_samples += k * LENGTH;
  showResult("log", k * LENGTH, dt);

  // max
  ArrayMath.ramp(x, -1000, 1000);
  dt = 0;
  for (k = 0; k < MIN_ITERATIONS || dt < MIN_DT; ++k) {
    t0 = time();
    ArrayMath.max(z, x);
    dt += time() - t0;
  }
  total_t += dt;
  total_samples += k * LENGTH;
  showResult("max", k * LENGTH, dt);

  // min
  ArrayMath.ramp(x, -1000, 1000);
  dt = 0;
  for (k = 0; k < MIN_ITERATIONS || dt < MIN_DT; ++k) {
    t0 = time();
    ArrayMath.min(z, x);
    dt += time() - t0;
  }
  total_t += dt;
  total_samples += k * LENGTH;
  showResult("min", k * LENGTH, dt);

  // pow
  ArrayMath.ramp(x, 1, 1000);
  ArrayMath.ramp(y, 1.1, 99.9);
  dt = 0;
  for (k = 0; k < MIN_ITERATIONS || dt < MIN_DT; ++k) {
    t0 = time();
    ArrayMath.pow(z, x, y);
    dt += time() - t0;
  }
  total_t += dt;
  total_samples += k * LENGTH;
  showResult("pow", k * LENGTH, dt);

  // random
  dt = 0;
  for (k = 0; k < MIN_ITERATIONS || dt < MIN_DT; ++k) {
    t0 = time();
    ArrayMath.random(z, -1000, 1000);
    dt += time() - t0;
  }
  total_t += dt;
  total_samples += k * LENGTH;
  showResult("random", k * LENGTH, dt);

  // round
  ArrayMath.ramp(x, -1000, 1000);
  dt = 0;
  for (k = 0; k < MIN_ITERATIONS || dt < MIN_DT; ++k) {
    t0 = time();
    ArrayMath.round(z, x);
    dt += time() - t0;
  }
  total_t += dt;
  total_samples += k * LENGTH;
  showResult("round", k * LENGTH, dt);

  // sin
  ArrayMath.ramp(x, -1000, 1000);
  dt = 0;
  for (k = 0; k < MIN_ITERATIONS || dt < MIN_DT; ++k) {
    t0 = time();
    ArrayMath.sin(z, x);
    dt += time() - t0;
  }
  total_t += dt;
  total_samples += k * LENGTH;
  showResult("sin", k * LENGTH, dt);

  // sqrt
  ArrayMath.ramp(x, 10, 1000);
  dt = 0;
  for (k = 0; k < MIN_ITERATIONS || dt < MIN_DT; ++k) {
    t0 = time();
    ArrayMath.sqrt(z, x);
    dt += time() - t0;
  }
  total_t += dt;
  total_samples += k * LENGTH;
  showResult("sqrt", k * LENGTH, dt);

  // tan
  ArrayMath.ramp(x, -1000, 1000);
  dt = 0;
  for (k = 0; k < MIN_ITERATIONS || dt < MIN_DT; ++k) {
    t0 = time();
    ArrayMath.tan(z, x);
    dt += time() - t0;
  }
  total_t += dt;
  total_samples += k * LENGTH;
  showResult("tan", k * LENGTH, dt);

  // clamp
  ArrayMath.ramp(x, -1000, 1000);
  dt = 0;
  for (k = 0; k < MIN_ITERATIONS || dt < MIN_DT; ++k) {
    t0 = time();
    ArrayMath.clamp(z, x, -100, 100);
    dt += time() - t0;
  }
  total_t += dt;
  total_samples += k * LENGTH;
  showResult("clamp", k * LENGTH, dt);

  // fract
  ArrayMath.ramp(x, -1000, 1000);
  dt = 0;
  for (k = 0; k < MIN_ITERATIONS || dt < MIN_DT; ++k) {
    t0 = time();
    ArrayMath.fract(z, x);
    dt += time() - t0;
  }
  total_t += dt;
  total_samples += k * LENGTH;
  showResult("fract", k * LENGTH, dt);

  // fill
  dt = 0;
  for (k = 0; k < MIN_ITERATIONS || dt < MIN_DT; ++k) {
    t0 = time();
    ArrayMath.fill(z, 123);
    dt += time() - t0;
  }
  total_t += dt;
  total_samples += k * LENGTH;
  showResult("fill", k * LENGTH, dt);

  // ramp
  dt = 0;
  for (k = 0; k < MIN_ITERATIONS || dt < MIN_DT; ++k) {
    t0 = time();
    ArrayMath.ramp(z, -1000, 1000);
    dt += time() - t0;
  }
  total_t += dt;
  total_samples += k * LENGTH;
  showResult("ramp", k * LENGTH, dt);

  // sign
  ArrayMath.ramp(x, -1000, 1000);
  dt = 0;
  for (k = 0; k < MIN_ITERATIONS || dt < MIN_DT; ++k) {
    t0 = time();
    ArrayMath.sign(z, x);
    dt += time() - t0;
  }
  total_t += dt;
  total_samples += k * LENGTH;
  showResult("sign", k * LENGTH, dt);

  // sum
  ArrayMath.ramp(x, -1000, 1000);
  dt = 0;
  for (k = 0; k < MIN_ITERATIONS || dt < MIN_DT; ++k) {
    t0 = time();
    ArrayMath.sum(x);
    dt += time() - t0;
  }
  total_t += dt;
  total_samples += k * LENGTH;
  showResult("sum", k * LENGTH, dt);

  // sampleLinear
  ArrayMath.ramp(x, -1000, 1000);
  ArrayMath.ramp(y, x.length / 4, x.length / 3);
  dt = 0;
  for (k = 0; k < MIN_ITERATIONS || dt < MIN_DT; ++k) {
    t0 = time();
    ArrayMath.sampleLinear(z, x, y);
    dt += time() - t0;
  }
  total_t += dt;
  total_samples += k * LENGTH;
  showResult("sampleLinear", k * LENGTH, dt);

  // sampleLinearRepeat
  ArrayMath.ramp(x, -1000, 1000);
  ArrayMath.ramp(y, x.length / 4, x.length / 3);
  dt = 0;
  for (k = 0; k < MIN_ITERATIONS || dt < MIN_DT; ++k) {
    t0 = time();
    ArrayMath.sampleLinearRepeat(z, x, y);
    dt += time() - t0;
  }
  total_t += dt;
  total_samples += k * LENGTH;
  showResult("sampleLinearRepeat", k * LENGTH, dt);

  // sampleCubic
  ArrayMath.ramp(x, -1000, 1000);
  ArrayMath.ramp(y, x.length / 4, x.length / 3);
  dt = 0;
  for (k = 0; k < MIN_ITERATIONS || dt < MIN_DT; ++k) {
    t0 = time();
    ArrayMath.sampleCubic(z, x, y);
    dt += time() - t0;
  }
  total_t += dt;
  total_samples += k * LENGTH;
  showResult("sampleCubic", k * LENGTH, dt);

  // sampleCubicRepeat
  ArrayMath.ramp(x, -1000, 1000);
  ArrayMath.ramp(y, x.length / 4, x.length / 3);
  dt = 0;
  for (k = 0; k < MIN_ITERATIONS || dt < MIN_DT; ++k) {
    t0 = time();
    ArrayMath.sampleCubicRepeat(z, x, y);
    dt += time() - t0;
  }
  total_t += dt;
  total_samples += k * LENGTH;
  showResult("sampleCubicRepeat", k * LENGTH, dt);

  // pack
  ArrayMath.ramp(x, -1000, 1000);
  ArrayMath.ramp(y, -1000, 1000);
  ArrayMath.ramp(z, -1000, 1000);
  ArrayMath.ramp(xIm, -1000, 1000);
  dt = 0;
  for (k = 0; k < MIN_ITERATIONS || dt < MIN_DT; ++k) {
    t0 = time();
    ArrayMath.pack(p, 0, 4, x, y, z, xIm);
    dt += time() - t0;
  }
  total_t += dt;
  total_samples += k * LENGTH;
  showResult("pack", k * LENGTH, dt);

  // unpack
  dt = 0;
  for (k = 0; k < MIN_ITERATIONS || dt < MIN_DT; ++k) {
    t0 = time();
    ArrayMath.unpack(p, 0, 4, x, y, z, xIm);
    dt += time() - t0;
  }
  total_t += dt;
  total_samples += k * LENGTH;
  showResult("unpack", k * LENGTH, dt);

  // filter - first order IIR
  filter = new Filter(1, 1);
  ArrayMath.ramp(x, -1000, 1000);
  dt = 0;
  for (k = 0; k < MIN_ITERATIONS || dt < MIN_DT; ++k) {
    t0 = time();
    filter.filter(z, x);
    dt += time() - t0;
  }
  total_t += dt;
  total_samples += k * LENGTH;
  showResult("filter(1st order IIR)", k * LENGTH, dt);

  // filter - biquad
  filter = new Filter(3, 2);
  ArrayMath.ramp(x, -1000, 1000);
  dt = 0;
  for (k = 0; k < MIN_ITERATIONS || dt < MIN_DT; ++k) {
    t0 = time();
    filter.filter(z, x);
    dt += time() - t0;
  }
  total_t += dt;
  total_samples += k * LENGTH;
  showResult("filter(biquad)", k * LENGTH, dt);

  // filter - 32-tab FIR
  filter = new Filter(32);
  ArrayMath.ramp(x, -1000, 1000);
  dt = 0;
  for (k = 0; k < MIN_ITERATIONS || dt < MIN_DT; ++k) {
    t0 = time();
    filter.filter(z, x);
    dt += time() - t0;
  }
  total_t += dt;
  total_samples += k * LENGTH;
  showResult("filter(32-tab FIR)", k * LENGTH, dt);

  // FFT(256)
  fft = new FFT(256);
  ArrayMath.ramp(x, -1000, 1000);
  dt = 0;
  for (k = 0; k < MIN_ITERATIONS || dt < MIN_DT; ++k) {
    t0 = time();
    fft.forward(y, z, x);
    dt += time() - t0;
  }
  total_t += dt;
  total_samples += k * fft.size;
  showResult("FFT(256)", k * fft.size, dt);

  // FFT(2048)
  fft = new FFT(2048);
  ArrayMath.ramp(x, -1000, 1000);
  dt = 0;
  for (k = 0; k < MIN_ITERATIONS || dt < MIN_DT; ++k) {
    t0 = time();
    fft.forward(y, z, x);
    dt += time() - t0;
  }
  total_t += dt;
  total_samples += k * fft.size;
  showResult("FFT(2048)", k * fft.size, dt);

  println("---Done---");
  showResult("Total", total_samples, total_t);
}

