export type Node = {
  name: string,
  email: string,
  candidates: Set<any>,
};
export type Graph = Map<string, Node>;
export type Rules = Array<[string, string]>;
export type Path = Array<Node>;


export function shuffleArray<T>(array: Array<T>): Array<T> {
  array = [...array];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Return pairs.
 */
export function createDirectedPairs<T>(list: Array<T>): Array<[T, T]> {
  return list.map((p, i, arr) => [p, arr[i + 1] || arr[0]]);
}


/**
 * Create a node.
 */
export function createNode({ name, email }: { name: string; email: string }): Node {
  return {
    name,
    email,
    candidates: new Set(),
  };
}

/**
 * Initialize graph
 */
export function initGraph(list: Path): Graph {
  const graph = new Map(shuffleArray(list).map(item => [item.name, createNode(item)]));

  const allCandidates = [...graph.values()];

  for (const node of graph.values()) {
    allCandidates
      .filter(n => node !== n)
      .forEach(c => node.candidates.add(c));
  }

  return graph;
}


/**
 * Apply rules to a graph
 */
export function applyOrientedRules(graph: Graph, rules: Rules): void {
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
export function applyExclusions(graph: Graph, exclusions): void {
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
 * Find a path in the graph.
 */
export function findLongestPaths(graph: Graph, maxPath = 500): Path | undefined {
  const paths: Array<Path> = [];
  const nodes = Array.from(graph.values());

  const [node] = nodes;
  const visited = new Set<Node>();
  const path: Path = [];
  let pathIdx = 0;
  let nPath = 0;

  const findAllPath = (curr: Node, end: Node, skipVisited: boolean = false) => {
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
 */

/* istanbul ignore next */
export function logPairs(pairs: Array<[Node, Node]>) {
  pairs
    .map(([src, dest]) => `${src.name} offre à ${dest.name}`)
    .forEach(str => console.log(str));
}

/* istanbul ignore next */
async function createDraw(
  list,
  {
    log = false,
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
}
