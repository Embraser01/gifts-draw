const { get, createDirectedPairs, shuffleList, createEmails } = require('../index').__TESTS__;

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

describe('shuffleList', () => {
  it('should shuffle list', () => {
    const list = [0, 1, 2, 3, 4, 5, 6, 7];

    const shuffle = shuffleList(list);

    expect(shuffle).not.toBe(list);
    expect(shuffle).not.toEqual(list);
    expect(list.length).toEqual(shuffle.length);
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
