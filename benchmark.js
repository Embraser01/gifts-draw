const { createDirectedPairs, shuffleList, resolveCouples } = require('./index').__TESTS__;

const TIMES = 100_000;
const LIST = [
  { name: 'Ted' },
  { name: 'Lenard' },
  { name: 'Armida' },
  { name: 'Enedina' },
  { name: 'Aleida' },
  { name: 'Mariella' },
  { name: 'Ermelinda' },
  { name: 'Margit' },
  { name: 'Terrell' },
];
const RULES = [
  ['Ted', 'Lenard'],
  ['Armida', 'Enedina'],
  ['Aleida', 'Mariella'],
  ['Ermelinda', 'Margit'],
];


function test(list, rules, resMap, followRules = false) {
  let shuffled = shuffleList(list);

  if (followRules) {
    shuffled = resolveCouples(shuffled, rules);
  }

  const pairs = createDirectedPairs(shuffled);

  pairs.forEach(p => {
    const key = `${p[0].name}->${p[1].name}`;
    if (!resMap.has(key)) {
      resMap.set(key, 0);
    }
    resMap.set(key, resMap.get(key) + 1);
  });
}

const formattedRes = (results) => [...results.entries()]
  .map(([key, val]) => [key, val / TIMES * 100])
  .map(([key, val]) => [key, val.toFixed(1)])
  .sort((a, b) => b[1] - a[1])
  .map(([key, val]) => [key, `${val}%`]);

const resNoRules = new Map();
for (let i = 0; i < TIMES; i++) {
  test(LIST, RULES, resNoRules, false);
}

const resRules = new Map();
for (let i = 0; i < TIMES; i++) {
  test(LIST, RULES, resRules, true);
}

console.log(formattedRes(resNoRules).length, formattedRes(resNoRules));
console.log(formattedRes(resRules).length, formattedRes(resRules));
