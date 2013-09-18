importScripts("../polyfill/webarraymath.js");
importScripts("benchmark.js");

onmessage = function (oEvent) {
  Benchmark(postMessage);
};

