import { useState, isValidElement } from 'react'
import ShowMoreText from 'react-show-more-text'

/** Chuỗi phẳng để react-show-more-text (keepNewLines) giữ xuống dòng — Truncate gốc thay \n bằng space khi đo. */
function childrenToPlainString(node) {
  if (node == null || node === false) return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(childrenToPlainString).join('')
  if (isValidElement(node)) {
    if (node.props?.children != null) return childrenToPlainString(node.props.children)
    return ''
  }
  return ''
}

export default function ShowMoreContent({
  children,
  lines = 3,
  className = '',
  anchorClass = 'text-blue-500 cursor-pointer hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-500',
  more = 'Xem thêm',
  less = 'Thu gọn'
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const plain = childrenToPlainString(children)

  const executeOnClick = (currentIsExpanded) => {
    setIsExpanded(!currentIsExpanded)
  }

  return (
    <ShowMoreText
      lines={lines}
      more={more}
      less={less}
      className={className}
      anchorClass={anchorClass}
      onClick={executeOnClick}
      expanded={isExpanded}
      truncatedEndingComponent={'... '}
      keepNewLines
    >
      {plain}
    </ShowMoreText>
  )
}
