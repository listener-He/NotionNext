import SmartLink from '@/components/SmartLink'

const CategoryGroup = ({ currentCategory, categories }) => {
  if (!categories) {
    return <></>
  }
  return <>
    <div id='category-list' className='dark:border-gray-600 flex flex-wrap mx-md'>
      {categories.map(category => {
        const selected = currentCategory === category.name
        return (
          <SmartLink
            key={category.name}
            href={`/category/${category.name}`}
            passHref
            className={(selected
              ? 'hover:text-white dark:hover:text-white bg-primary text-white '
              : 'dark:text-gray-300 text-gray-700 hover:text-white dark:hover:text-white hover:bg-primary hover:text-white') +
              ' text-sm w-full items-center duration-300 ease-standard px-sm cursor-pointer py-xs font-light rounded-md bg-transparent'}>

            <div> <i className={`mr-2 fas ${selected ? 'fa-folder-open' : 'fa-folder'}`} />{category.name}({category.count})</div>

          </SmartLink>
        );
      })}
    </div>
  </>;
}

export default CategoryGroup
