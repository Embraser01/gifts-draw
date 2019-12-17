const { initGraph, findLongestPaths, createDirectedPairs } = require('./index').__TESTS__;

const TIMES = 1000;
const createList = size => Array.from({ length: size }, (_, idx) => ({ name: `Person ${idx}` }));

function time(list, resMap) {
  const graph = initGraph(list);
  const start = process.hrtime.bigint();

  const path = findLongestPaths(graph);

  const pairs = createDirectedPairs(path);

  pairs.forEach(p => {
    const key = `${p[0].name}->${p[1].name}`;
    if (!resMap.has(key)) {
      resMap.set(key, 0);
    }
    resMap.set(key, resMap.get(key) + 1);
  });

  return [process.hrtime.bigint() - start, !!path];
}

const formattedRes = (results) => [...results.entries()]
  .map(([key, val]) => [key, val / TIMES * 100])
  .map(([key, val]) => [key, val.toFixed(1)])
  .sort((a, b) => b[1] - a[1])
  .map(([key, val]) => [key, `${val}%`]);

function testFor(n) {
  let totalNanoseconds = 0n;
  let totalPath = 0;

  const resMap = new Map();
  for (let i = 0; i < TIMES; i++) {
    const [ns, hasPath] = time(createList(n), resMap);
    totalNanoseconds += ns;
    if (hasPath) totalPath++;
  }

  console.log(`For ${n} persons: ${BigInt.asIntN(64, totalNanoseconds / BigInt(1e6) / BigInt(TIMES))}ms with ${Math.ceil(totalPath / TIMES * 100)}%`);
  console.log(formattedRes(resMap));
}

console.time('Processing');
testFor(3);
testFor(9);
testFor(25);
testFor(40);
testFor(50);
console.timeEnd('Processing');
