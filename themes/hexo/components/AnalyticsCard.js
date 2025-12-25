import Card from './Card'

export function AnalyticsCard (props) {
  const { postCount } = props
  return <Card>
    <div className='ml-sm mb-md bg-transparent'>
      <i className='fas fa-chart-area' /> 统计
    </div>
    <div className='text-xs font-light justify-center mx-xl bg-transparent'>
      <div className='inline'>
        <div className='flex justify-between'>
          <div>文章数:</div>
          <div>{postCount}</div>
        </div>
      </div>
      <div className='hidden busuanzi_container_page_pv ml-2'>
        <div className='flex justify-between'>
          <div>总访问:</div>
          <div className='busuanzi_value_site_pv' />
        </div>
      </div>
      <div className='hidden busuanzi_container_site_uv ml-2'>
        <div className='flex justify-between'>
          <div>总访客:</div>
          <div className='busuanzi_value_site_uv' />
        </div>
      </div>
    </div>
  </Card>
}
