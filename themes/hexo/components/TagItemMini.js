import SmartLink from '@/components/SmartLink'
import { useGlobal } from '@/lib/global'

const TagItemMini = ({ tag, selected = false }) => {
  const { isDarkMode } = useGlobal()
  const name = tag?.name || ''

  const gradient = getAccessibleGradient(name, isDarkMode)
  const borderColor = isDarkMode ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)'
  const style = {
    backgroundImage: selected ? undefined : gradient,
    backgroundColor: selected ? (isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.82)') : undefined,
    border: `1px solid ${borderColor}`
  }

  return (
    <SmartLink
      key={tag}
      href={selected ? '/' : `/tag/${encodeURIComponent(tag.name)}`}
      passHref
      className={`cursor-pointer inline-block rounded-md duration-300 ease-standard
        mr-2 mb-2 py-xs px-sm text-xs whitespace-nowrap 
        ${selected ? 'text-white dark:text-white hover:opacity-90' : `${isDarkMode ? 'text-white' : 'text-gray-900'} hover:opacity-95`}
        shadow-sm hover:shadow-md`}
      style={style}>

      <div className='font-medium'>{selected && <i className='mr-1 fa-tag'/>} {tag.name + (tag.count ? `(${tag.count})` : '')} </div>

    </SmartLink>
  );
}

export default TagItemMini

function getAccessibleGradient(text, isDark) {
  const hue = hashHue(text)
  const s = isDark ? 55 : 35
  const l1 = isDark ? 38 : 90
  const l2 = isDark ? 22 : 80
  const c1 = `hsl(${hue} ${s}% ${l1}%)`
  const c2 = `hsl(${(hue + 20) % 360} ${s}% ${l2}%)`
  return `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`
}

function hashHue(text) {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash) % 360
}
