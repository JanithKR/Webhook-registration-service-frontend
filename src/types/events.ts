// ✅ Every node always has children field
export interface EventNode {
  label: string;
  children: Record<string, EventNode>; // always present, can be empty {}
}

export type EventTree = Record<string, EventNode>;

// Collect all leaf keys (nodes with empty children)
export const getLeafEvents = (
  tree: Record<string, EventNode>,
  prefix = ''
): string[] => {
  const result: string[] = [];

  for (const [key, node] of Object.entries(tree)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (Object.keys(node.children).length > 0) {
      result.push(...getLeafEvents(node.children, fullKey));
    } else {
      result.push(fullKey);
    }
  }

  return result;
};

// Collect ALL keys including parents
export const collectAllKeys = (
  tree: Record<string, EventNode>,
  prefix = ''
): string[] => {
  const result: string[] = [];

  for (const [key, node] of Object.entries(tree)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    result.push(fullKey);

    if (Object.keys(node.children).length > 0) {
      result.push(...collectAllKeys(node.children, fullKey));
    }
  }

  return result;
};

// Collect leaves under a specific node
export const collectLeaves = (
  key: string,
  node: EventNode
): string[] => {
  // ✅ Guard against null/undefined children
  if (!node.children || Object.keys(node.children).length === 0) {
    return [key];
  }
  return Object.entries(node.children).flatMap(([k, n]) =>
    collectLeaves(`${key}.${k}`, n)
  );
};

// Insert a new node at a path in the tree
export const insertNode = (
  tree: Record<string, EventNode>,
  path: string[],
  newKey: string,
  newLabel: string
): Record<string, EventNode> => {
  if (path.length === 0) {
    return {
      ...tree,
      [newKey]: { label: newLabel, children: {} },
    };
  }

  const [head, ...rest] = path;
  return {
    ...tree,
    [head]: {
      ...tree[head],
      children: insertNode(tree[head].children, rest, newKey, newLabel),
    },
  };
};