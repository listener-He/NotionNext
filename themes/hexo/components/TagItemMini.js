import SmartLink from '@/components/SmartLink'

const TagItemMini = ({ tag, selected = false }) => {
  return (
    <SmartLink
      key={tag}
      href={selected ? '/' : `/tag/${encodeURIComponent(tag.name)}`}
      passHref
      className={`cursor-pointer inline-block rounded duration-300 ease-standard
        mr-2 py-xs px-sm text-xs whitespace-nowrap 
         ${selected
        ? 'text-white dark:text-gray-300 bg-black/80 dark:bg-white/20'
        : `tag-badge-day dark:tag-badge-night`}` }>

      <div className='font-medium'>{selected && <i className='mr-1 fa-tag'/>} {tag.name + (tag.count ? `(${tag.count})` : '')} </div>

    </SmartLink>
  );
}

export default TagItemMini
