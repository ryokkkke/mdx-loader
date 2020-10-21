const toJSX = require("@mdx-js/mdx/mdx-hast-to-jsx").toJSX;

module.exports = () => (astTree) => {
  console.log(astTree);
  if (astTree == undefined) {
    console.error("astTree is undefined");
    return;
  }

  const children = astTree.children;
  if (children == undefined) {
    console.error("children is undefined");
    return;
  }
  if (children.length === 0) {
    console.error("children is empty");
    return;
  }

  astTree.children = children.concat([
    /* info.tableOfContents */
  ]);
  return astTree;
};

// function mdxTableOfContents(options = {}) {
//   let OldCompiler = this.Compiler;
//   let info;

//   this.Compiler = (tree) => {
//     let code = OldCompiler(tree, {}, options);

//     if (!info.hasTableOfContentsExport) {
//       code += `\nexport const tableOfContents = (components={}) => ${tableOfContentsListSerializer(
//         info.tableOfContents
//       )}\n`;
//     }

//     return code;
//   };

//   return function transformer(node) {
//     info = getInfo(node, options);
//   };
// }

function getInfo(
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
    // export tableOfContents
    if (
      node.type === "export" &&
      node.value.indexOf("tableOfContents") !== -1
    ) {
      info.hasTableOfContentsExport = true;
    }

    //
    if (node.type === "element" && /^h\d$/.test(node.tagName)) {
      const level = parseInt(node.tagName[1]);
      if (
        level >= minTableOfContentsLevel &&
        level <= maxTableOfContentsLevel
      ) {
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
      }
    }
  });

  return info;
}

function toFragment(nodes) {
  if (nodes.length === 1 && nodes[0].type === "text") {
    return JSON.stringify(nodes[0].value);
  } else {
    return "<React.Fragment>" + nodes.map(toJSX).join("") + "</React.Fragment>";
  }
}

const tableOfContentsListSerializer = (nodes) =>
  nodes.map((node) => tableOfContentsNodeSerializer(node));

const tableOfContentsNodeSerializer = (node) => ({
  id: JSON.stringify(node.id),
  level: node.level,
  title: node.title,
  children: tableOfContentsListSerializer(node.children),
});

// function indentString(size, string) {
//   return string
//     .split("\n")
//     .map((x) => " ".repeat(size) + x)
//     .join("\n")
//     .trim();
// }

// module.exports = mdxTableOfContents;
