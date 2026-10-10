import { createElement } from 'react'
import type { CSSProperties, Ref, ReactElement } from 'react'
import type { IconDefinition, IconNode, IconProps } from './types'

function renderNode(node: IconNode, key: number): ReactElement {
  return createElement(
    node.tag,
    {
      ...node.attrs,
      key,
      ...(node.part
        ? {
            'data-icon-part': node.part,
            style: { transformBox: 'fill-box', transformOrigin: 'center' } as CSSProperties,
          }
        : {}),
    },
    node.children?.map(renderNode)
  )
}

/** Pure SVG rendering: no hooks, context, client directive, stylesheet or runtime dependency. */
export function Icon({
  definition,
  size = 24,
  title,
  ...props
}: IconProps & { definition: IconDefinition; ref?: Ref<SVGSVGElement> }) {
  const labelled = !!(title || props['aria-label'] || props['aria-labelledby'])
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.65}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      aria-hidden={labelled ? undefined : true}
      role={labelled ? 'img' : undefined}
      aria-label={title}
      data-comwit-icon={definition.name}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {definition.nodes.map(renderNode)}
    </svg>
  )
}

export function createIcon(definition: IconDefinition) {
  function ComwitIcon(props: IconProps) {
    return <Icon definition={definition} {...props} />
  }
  ComwitIcon.displayName = `${definition.name}Icon`
  return ComwitIcon
}
