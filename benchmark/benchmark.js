function Benchmark(println) {
  var LENGTH = 2048;
  var ITERATIONS = 80000;

  var showResult = function (name, dt) {
    var samplesPerSec = (LENGTH * ITERATIONS) / (dt * 0.001);
    println(name + ": " + dt + "ms (" + Math.round(0.000001 * samplesPerSec) + "Ms/s)");
  };

  var time = function () {
    return (new Date()).getTime();
  };

  println("---Benchmark---");

  var x = new Float32Array(LENGTH);
  var y = new Float32Array(LENGTH);
  var z = new Float32Array(LENGTH);
  var t0, dt, total = 0, k;

  // ramp
  t0 = time();
  for (k = 0; k < ITERATIONS; ++k)
    ArrayMath.ramp(x, -1000, 1000);
  dt = time() - t0;
  total += dt;
  showResult("ramp", dt);

  // add
  ArrayMath.ramp(x, -1000, 1000);
  ArrayMath.ramp(y, -1000, 1000);
  t0 = time();
  for (k = 0; k < ITERATIONS; ++k)
    ArrayMath.add(z, x, y);
  dt = time() - t0;
  total += dt;
  showResult("add", dt);

  // madd
  ArrayMath.ramp(x, -1000, 1000);
  ArrayMath.ramp(y, -1000, 1000);
  t0 = time();
  for (k = 0; k < ITERATIONS; ++k)
    ArrayMath.madd(z, 0.5, x, y);
  dt = time() - t0;
  total += dt;
  showResult("madd", dt);

  // div
  ArrayMath.ramp(x, -1000, 1000);
  ArrayMath.ramp(y, 10, 100);
  t0 = time();
  for (k = 0; k < ITERATIONS; ++k)
    ArrayMath.div(z, x, y);
  dt = time() - t0;
  total += dt;
  showResult("div", dt);

  // round
  ArrayMath.ramp(x, -1000, 1000);
  t0 = time();
  for (k = 0; k < ITERATIONS; ++k)
    ArrayMath.round(z, x);
  dt = time() - t0;
  total += dt;
  showResult("round", dt);

  // sqrt
  ArrayMath.ramp(x, 10, 1000);
  t0 = time();
  for (k = 0; k < ITERATIONS; ++k)
    ArrayMath.sqrt(z, x);
  dt = time() - t0;
  showResult("sqrt", dt);

  // max
  ArrayMath.ramp(x, -1000, 1000);
  t0 = time();
  for (k = 0; k < ITERATIONS; ++k)
    ArrayMath.max(z, x);
  dt = time() - t0;
  total += dt;
  showResult("max", dt);

  // clamp
  ArrayMath.ramp(x, -1000, 1000);
  t0 = time();
  for (k = 0; k < ITERATIONS; ++k)
    ArrayMath.clamp(z, x, -100, 100);
  dt = time() - t0;
  total += dt;
  showResult("clamp", dt);

  // random
  t0 = time();
  for (k = 0; k < ITERATIONS; ++k)
    ArrayMath.random(x, -1000, 1000);
  dt = time() - t0;
  total += dt;
  showResult("random", dt);

  // sin
  ArrayMath.ramp(x, -1000, 1000);
  t0 = time();
  for (k = 0; k < ITERATIONS; ++k)
    ArrayMath.sin(z, x);
  dt = time() - t0;
  total += dt;
  showResult("sin", dt);

  // sampleLinear
  ArrayMath.ramp(x, -1000, 1000);
  ArrayMath.ramp(y, x.length / 4, x.length / 3);
  t0 = time();
  for (k = 0; k < ITERATIONS; ++k)
    ArrayMath.sampleLinear(z, x, y);
  dt = time() - t0;
  total += dt;
  showResult("sampleLinear", dt);

  println("---Done---");
  println("Total: " + total + "ms\n");
}

