const toJSX = require("@mdx-js/mdx/mdx-hast-to-jsx").toJSX;

const toFragment = (nodes) => {
  if (nodes.length === 1 && nodes[0].type === "text") {
    return JSON.stringify(nodes[0].value);
  } else {
    return "<React.Fragment>" + nodes.map(toJSX).join("") + "</React.Fragment>";
  }
};

// Markdownなので、第一階層にしか見出し要素が無い前提
const scanAstTree = (root) => {
  return root.children.map((node) => {
    if (node.type !== "element") return;
    if (!/^h\d$/.test(node.tagName)) return;

    const id = node.properties.id;
    const level = parseInt(node.tagName[1]);

    return {
      id,
      level,
      title: toFragment(node.children),
    };
  });
};

const codeifyTreeInfoItem = (info) =>
  `{ id: ${JSON.stringify(info.id)}, level: ${info.level}, title: ${
    info.title
  } }`;

const codelifyTreeInfo = (tableOfContents) => {
  const tableOfContentsCodes = tableOfContents
    .map(codeifyTreeInfoItem)
    .join(",");

  return `export const tableOfContents = (components={}) => [${tableOfContentsCodes}];`;
};

// for an item options.rehypePlugins of mdx function of @mdx-js/mdx
module.exports = () => (astTree) => {
  const children = astTree.children;
  if (children == undefined) return;
  if (children.length === 0) return;

  const tableOfContents = scanAstTree(astTree);
  const tableOfContentsExportNode = {
    type: "export",
    value: codelifyTreeInfo(tableOfContents),
  };
  astTree.children = children.concat([tableOfContentsExportNode]);
  return astTree;
};
