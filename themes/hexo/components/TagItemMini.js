import SmartLink from '@/components/SmartLink'

const TagItemMini = ({ tag, selected = false }) => {
  return (
    <SmartLink
      key={tag}
      href={selected ? '/' : `/tag/${encodeURIComponent(tag.name)}`}
      passHref
      className={`cursor-pointer inline-block rounded duration-200
        mr-2 py-0.5 px-1 text-xs whitespace-nowrap 
         ${selected
        ? 'text-white dark:text-gray-300 bg-black/80 dark:bg-white/20'
        : `text-secondary dark:text-gray-300 border border-black/10 dark:border-white/10 hover:bg-black/80 hover:text-white`}` }>

      <div className='font-light'>{selected && <i className='mr-1 fa-tag'/>} {tag.name + (tag.count ? `(${tag.count})` : '')} </div>

    </SmartLink>
  );
}

export default TagItemMini
