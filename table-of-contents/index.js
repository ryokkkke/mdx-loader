const toJSX = require("@mdx-js/mdx/mdx-hast-to-jsx").toJSX;

function toFragment(nodes) {
  if (nodes.length === 1 && nodes[0].type === "text") {
    return JSON.stringify(nodes[0].value);
  } else {
    return "<React.Fragment>" + nodes.map(toJSX).join("") + "</React.Fragment>";
  }
}

const tableOfContentsListSerializer = (nodes) =>
  nodes.map((node) => tableOfContentsNodeSerializer(node));

function tableOfContentsNodeSerializer(node) {
  return {
    id: JSON.stringify(node.id),
    level: node.level,
    title: node.title,
    children: tableOfContentsListSerializer(node.children),
  };
}

function scanAstTree(
  root,
  { minTableOfContentsLevel = 1, maxTableOfContentsLevel = 3 } = {}
) {
  const info = {
    hasTableOfContentsExport: false,
    tableOfContents: [],
  };

  const levelIds = [];
  const tableOfContentsIds = {};

  root.children.forEach((node) => {
    // whether node has "export const tableOfContents" or not
    if (
      node.type === "export" &&
      node.value.indexOf("tableOfContents") !== -1
    ) {
      info.hasTableOfContentsExport = true;
    }

    if (node.type !== "element") return;
    if (!/^h\d$/.test(node.tagName)) return;

    const level = parseInt(node.tagName[1]);
    if (level < minTableOfContentsLevel) return;
    if (level > maxTableOfContentsLevel) return;

    const id = node.properties.id;
    levelIds[level - 1] = id;
    const parent = tableOfContentsIds[levelIds[level - 2]];
    const item = {
      id,
      level,
      title: toFragment(node.children),
      children: [],
    };
    if (parent) {
      parent.children.push(item);
    } else {
      info.tableOfContents.push(item);
    }
    tableOfContentsIds[id] = item;
  });

  return info;
}

// for an item options.rehypePlugins of mdx function of @mdx-js/mdx
module.exports = () => (astTree) => {
  const children = astTree.children;
  if (children == undefined) return;
  if (children.length === 0) return;

  const treeinfo = scanAstTree(astTree);
  console.log(treeinfo);
  if (treeinfo.hasTableOfContentsExport) return astTree;

  astTree.children = children.concat([treeinfo.tableOfContents]);
  return astTree;
};
