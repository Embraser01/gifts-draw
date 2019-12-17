require('dotenv').config();
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const get = (obj, path, defaultValue) => {
  const res = path.split('.')
    .reduce((acc, part) => acc ? acc[part] : acc, obj);
  return res === undefined ? defaultValue : res;
};

/**
 * @typedef Node
 * @type {object}
 * @property {string} email - Email
 * @property {string} name - Name.
 * @property {Set<Node>} candidates - Edges.
 */

/**
 *
 * @param list
 * @param subject
 * @param content
 * @param from
 * @returns {*}
 */
function createEmails(list, {
  subject,
  content,
  from = 'no-reply@example.com',
}) {
  const INTERPOLATION_TOKEN = /{\s*([.\w]+)\s*}/g;
  return list.map(([src, dest]) => ({
    to: src.email,
    from,
    subject: subject.replace(INTERPOLATION_TOKEN, (_, p) => get({ src, dest }, p)),
    text: content.replace(INTERPOLATION_TOKEN, (_, p) => get({ src, dest }, p)),
  }));
}

/**
 * Return pairs.
 *
 * @param list {Array<Object>}
 */
function createDirectedPairs(list) {
  return list.map((p, i, arr) => [p, arr[i + 1] || arr[0]]);
}


/**
 * Create a node.
 * @param name
 * @param email
 * @return {Node}
 */
const createNode = ({ name, email }) => ({
  name,
  email,
  candidates: new Set(),
});

/**
 *
 * @param list {Array<{name: string, email?: string}>}
 * @return {Map<string, {}>}
 */
function initGraph(list) {
  const graph = new Map();

  list
    .sort(() => 0.5 - Math.random())
    .forEach(item => graph.set(item.name, createNode(item)));

  const allCandidates = Array.from(graph.values());

  for (const node of graph.values()) {
    allCandidates
      .filter(n => node !== n)
      .forEach(c => node.candidates.add(c));
  }

  return graph;
}

/**
 *
 * @param graph {Map<string, Node>}
 * @param rules {Array<[string, string]>}
 */
function applyOrientedRules(graph, rules) {
  for (const [src, dest] of rules) {
    const srcNode = graph.get(src);
    const destNode = graph.get(dest);

    if (!srcNode || !destNode) {
      throw new Error(`Unable to find persons (${src}, ${dest}).`);
    }

    srcNode.candidates.delete(destNode);
  }
}

/**
 * Apply exclusion rules.
 * For each rule, it removes link between each element.
 *
 * @param graph {Map<string, Node>}
 * @param exclusions {Array<Array<string>>}
 */
function applyExclusions(graph, exclusions) {
  for (const exclusion of exclusions) {
    const nodes = exclusion.map(e => graph.get(e));

    if (nodes.includes(undefined)) {
      throw new Error(`One or more persons could not be found in (${exclusion.join(', ')}).`);
    }

    nodes.forEach(origin => nodes
      .filter(n => n !== origin)
      .forEach(n => origin.candidates.delete(n)),
    );
  }
}

/**
 * Find a path in the graph
 *
 * @param graph {Map<string, Node>}
 * @param maxPath {number}
 */
function findLongestPaths(graph, maxPath = 500) {
  const paths = [];
  const nodes = Array.from(graph.values()).sort(() => 0.5 - Math.random());
  // Add some noise everywhere
  nodes.forEach(n => n.candidates = new Map(Array.from(n.candidates.entries()).sort(() => 0.5 - Math.random())));

  const node = nodes[Math.floor(Math.random() * nodes.length)];
  const visited = new Set();
  const path = [];
  let pathIdx = 0;
  let nPath = 0;

  const findAllPath = (curr, end, skipVisited) => {
    if (!skipVisited) visited.add(curr);
    path[pathIdx] = curr;
    pathIdx++;

    if (curr === end && pathIdx > 1) {
      if (pathIdx === nodes.length + 1) {
        paths.push([...path.slice(0, nodes.length)]);
        nPath++;

        if (nPath > maxPath) {
          throw new Error('To many paths');
        }
      }
    } else if (pathIdx === 0) {
      return;
    } else {
      for (const n of curr.candidates.values()) {
        if (!visited.has(n)) {
          findAllPath(n, end);
        }
      }
    }

    pathIdx--;
    visited.delete(curr);
  };

  // First one should not be added to visited because we
  // search for a cyclic path.
  try {
    findAllPath(node, node, true);
  } catch (e) {
    // ignored
  }


  return paths[Math.floor(Math.random() * paths.length)];
}

/**
 * console.log Pairs
 *
 * @param pairs {Array<Object>}
 */
function logPairs(pairs) {
  pairs
    .map(([src, dest]) => `${src.name} offre à ${dest.name}`)
    .forEach(str => console.log(str));
}


async function main(
  list,
  {
    sendEmails = false,
    log = false,
    subject,
    content,
    from,
    rules,
    exclusions,
  },
) {
  const graph = initGraph(list);

  if (rules) {
    applyOrientedRules(graph, rules);
  }

  if (exclusions) {
    applyExclusions(graph, exclusions);
  }

  const path = findLongestPaths(graph);

  if (!path) {
    throw new Error('No combinaison was found, try to remove some rules');
  }

  const pairs = createDirectedPairs(path);

  if (log) {
    logPairs(pairs);
  }

  if (sendEmails) {
    const emails = createEmails(pairs, { subject, content });
    await sgMail.send(emails);
  }
}

module.exports = main;
module.exports.__TESTS__ = {
  get,
  applyOrientedRules,
  applyExclusions,
  findLongestPaths,
  initGraph,
  createNode,
  createEmails,
  createDirectedPairs,
};
