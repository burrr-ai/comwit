/** Use the source heading's explicit anchor in translations so language switches retain hashes. */
export default function remarkStableAnchors() {
  return function transform(tree) {
    function visit(node) {
      if (!node.children) return
      for (let index = 0; index < node.children.length; index++) {
        const anchor = node.children[index]
        const heading = node.children[index + 1]
        if (
          anchor.type === 'mdxJsxFlowElement' &&
          anchor.name === 'a' &&
          anchor.children.length === 0 &&
          heading?.type === 'heading'
        ) {
          const id = anchor.attributes.find((attribute) => attribute.name === 'id')?.value
          if (typeof id === 'string') {
            heading.data = {
              ...heading.data,
              hProperties: { ...heading.data?.hProperties, id },
            }
            node.children.splice(index, 1)
            index--
            continue
          }
        }
        visit(anchor)
      }
    }
    visit(tree)
  }
}
