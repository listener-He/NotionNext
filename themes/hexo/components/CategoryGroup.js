import SmartLink from '@/components/SmartLink'

const CategoryGroup = ({ currentCategory, categories }) => {
  if (!categories) {
    return <></>
  }
  return <>
    <div id='category-list' className='dark:border-neutral-700 flex flex-wrap mx-md'>
      {categories.map(category => {
        const selected = currentCategory === category.name
        return (
          <SmartLink
            key={category.name}
            href={`/category/${category.name}`}
            passHref
            className={(selected
              ? 'hover:text-white dark:hover:text-white bg-primary-500 text-white shadow-elevation-sm'
              : 'dark:text-neutral-300 text-neutral-600 hover:text-white dark:hover:text-white hover:bg-primary-500') +
              ' text-sm w-full items-center duration-300 ease-standard px-sm cursor-pointer py-xs font-light rounded-md bg-transparent transform transition-all hover:scale-105 active:scale-95 hover:shadow-elevation-md hover:translate-y-[-2px]'}>

            <div> <i className={`mr-2 fas ${selected ? 'fa-folder-open' : 'fa-folder'}`} />{category.name}({category.count})</div>

          </SmartLink>
        );
      })}
    </div>
  </>;
}

export default CategoryGroup
