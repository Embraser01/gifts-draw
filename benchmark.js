const { createDirectedPairs, shuffleList, resolveCouples } = require('./index').__TESTS__;

const TIMES = 10000;
const LIST = [
  { 'name': 'Ted' },
  { 'name': 'Lenard' },
  { 'name': 'Armida' },
  { 'name': 'Enedina' },
  { 'name': 'Aleida' },
  { 'name': 'Mariella' },
  { 'name': 'Ermelinda' },
  { 'name': 'Margit' },
  { 'name': 'Terrell' },
];
const RULES = [
  ['Ted', 'Lenard'],
  ['Armida', 'Enedina'],
  ['Aleida', 'Mariella'],
  ['Ermelinda', 'Margit'],
];

const results = new Map();

function test(followRules = false) {
  let shuffled = shuffleList(LIST);

  if (followRules) {
    shuffled = resolveCouples(shuffled, RULES);
  }

  const pairs = createDirectedPairs(shuffled);

  pairs.forEach(p => {
    const key = `${p[0].name}->${p[1].name}`;
    if (!results.has(key)) {
      results.set(key, 0);
    }
    results.set(key, results.get(key) + 1);
  });
}


for (let i = 0; i < TIMES; i++) {
  test(false);
}

const formattedRes = [...results.entries()]
  .map(([key, val]) => [key, val / TIMES * 100])
  .map(([key, val]) => [key, val.toFixed(1)])
  .sort((a, b) => b[1] - a[1])
  .map(([key, val]) => [key, `${val}%`]);

console.log(formattedRes);
console.log(formattedRes.length);
