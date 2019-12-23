const {
  get,
  createDirectedPairs,
  createEmails,
  createNode,
  findLongestPaths,
  applyExclusions,
  initGraph,
  applyOrientedRules,
} = require('../index');

describe('get', () => {
  const obj = {
    a: 1,
    b: {},
    c: { d: 2 },
    e: { f: null },
  };

  const TESTS = [
    ['a', 1, undefined],
    ['a.s', undefined, undefined],
    ['b', obj.b, undefined],
    ['b', obj.b, 3],
    ['c.d', 2, undefined],
    ['e.f', null, undefined],
    ['e.f', null, 3],
    ['s', 3, 3],
    ['a.s', 3, 3],
  ];

  it.each(TESTS)('should find %s equal %p (default %p)', (path, expected, defaultValue) => {
    expect(get(obj, path, defaultValue)).toBe(expected);
  });

  it('should find', () => {
    expect(get(null, 'a.b.c')).toBe(null);
  });
});

describe('createDirectedPairs', () => {
  it('should create a pair for each person', () => {
    const list = [0, 1, 2, 3, 4, 5, 6, 7];
    const length = list.length;

    const pairs = createDirectedPairs(list);

    expect.assertions(length);
    pairs.forEach(([src, dest]) => expect((src + 1) % length).toBe(dest));
  });
});

describe('createEmails', () => {
  it('should interpolate subject', () => {
    const list = [
      [{ prop: 1 }, { prop: 2 }],
    ];

    const emails = createEmails(list, { subject: 'Hi {src.prop}, it\'s { dest.prop}', content: '' });

    expect(emails[0]).toMatchObject({
      subject: 'Hi 1, it\'s 2',
    });
  });

  it('should interpolate content', () => {
    const list = [
      [{ prop: 1 }, { prop: 2 }],
    ];

    const emails = createEmails(list, { subject: '', content: 'Hi { src.prop }, it\'s {dest.prop}' });

    expect(emails[0]).toMatchObject({
      text: 'Hi 1, it\'s 2',
    });
  });

  it('should set email from source', () => {
    const list = [
      [{ prop: 1, email: 'test@example.com' }, { prop: 2, email: 'test2@example.com' }],
    ];

    const emails = createEmails(list, { subject: '', content: '' });

    expect(emails[0]).toMatchObject({
      to: 'test@example.com',
    });
  });
});

describe('createNode', () => {
  it('should create a simple node', () => {
    const node = createNode({ name: 2 });

    expect(node).toEqual({ name: 2, candidates: new Set() });
  });
});

describe('initGraph', () => {
  it('should create a graph with all elements from the list', () => {
    const list = [{ name: 1 }, { name: 2 }, { name: 3 }, { name: 4 }];

    const graph = initGraph(list);

    expect(graph.size).toBe(list.length);
    expect(Array.from(graph.keys())).toEqual(expect.arrayContaining(list.map(l => l.name)));
  });

  it('should create all candidates for each node', () => {
    const list = [{ name: 1 }, { name: 2 }, { name: 3 }, { name: 4 }];

    const graph = initGraph(list);

    expect.assertions(graph.size * 2);

    for (const n of graph.values()) {
      expect(n.candidates.size).toBe(list.length - 1);
      expect(n.candidates.has(n)).toBe(false);
    }
  });
});

describe('applyOrientedRules', () => {
  it('should apply rules correctly', () => {
    const list = [{ name: 1 }, { name: 2 }, { name: 3 }];
    const rules = [[1, 2]];

    const graph = initGraph(list);

    applyOrientedRules(graph, rules);

    expect(Array
      .from(graph.get(1).candidates.keys())
      .map(n => n.name),
    ).toEqual([3]);
  });

  it('should apply multiple rules', () => {
    const list = [{ name: 1 }, { name: 2 }, { name: 3 }];
    const rules = [[1, 2], [1, 3]];

    const graph = initGraph(list);

    applyOrientedRules(graph, rules);

    expect(graph.get(1).candidates.size).toBe(0);
  });

  it('should throw if no consistent data', () => {
    const list = [{ name: 1 }, { name: 2 }, { name: 3 }];
    const rules = [[1, 2], [1, 4]];

    const graph = initGraph(list);

    expect(() => applyOrientedRules(graph, rules)).toThrowError(Error);
  });
});

describe('applyExclusions', () => {
  it('should apply simple exclusions correctly', () => {
    const list = [{ name: 1 }, { name: 2 }, { name: 3 }];
    const rules = [[1, 2]];

    const graph = initGraph(list);

    applyExclusions(graph, rules);

    expect(Array
      .from(graph.get(1).candidates.keys())
      .map(n => n.name),
    ).toEqual([3]);

    expect(Array
      .from(graph.get(2).candidates.keys())
      .map(n => n.name),
    ).toEqual([3]);
  });

  it('should apply complex exclusions', () => {
    const list = [{ name: 1 }, { name: 2 }, { name: 3 }];
    const rules = [[1, 2, 3]];

    const graph = initGraph(list);

    applyExclusions(graph, rules);

    expect(graph.get(1).candidates.size).toBe(0);
    expect(graph.get(2).candidates.size).toBe(0);
    expect(graph.get(3).candidates.size).toBe(0);
  });

  it('should throw if no consistent data', () => {
    const list = [{ name: 1 }, { name: 2 }, { name: 3 }];
    const rules = [[1, 2, 4]];

    const graph = initGraph(list);

    expect(() => applyExclusions(graph, rules)).toThrowError(Error);
  });
});

describe('findLongestPaths', () => {
  it('should find a path', () => {
    const a = createNode({ name: 'a' });
    const b = createNode({ name: 'b' });
    const c = createNode({ name: 'c' });

    const graph = new Map([a, b, c].map(n => [n.name, n]));

    a.candidates.add(b);
    b.candidates.add(c);
    c.candidates.add(a);

    const path = findLongestPaths(graph);

    expect(path).toHaveLength(3);
    expect(path).toEqual(expect.arrayContaining([a, b, c]));
  });

  it('should return undefined if no solution', () => {
    const a = createNode({ name: 'a' });
    const b = createNode({ name: 'b' });
    const c = createNode({ name: 'c' });

    const graph = new Map([a, b, c].map(n => [n.name, n]));

    a.candidates.add(b);
    b.candidates.add(c);

    const path = findLongestPaths(graph);

    expect(path).not.toBeDefined();
  });

  it('should handle high number of nodes', () => {
    const list = Array.from({ length: 1000 }, (_, idx) => ({ name: idx }));
    const graph = initGraph(list);

    const path = findLongestPaths(graph);

    expect(path).toHaveLength(list.length);
  });
});
