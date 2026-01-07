const Card = ({ children, headerSlot, className }) => {
  return <div className={className}>
    <>{headerSlot}</>
    <section className="card card-base shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:text-gray-300 border border-gray-100 dark:border-white/10 bg-white/90 dark:bg-hexo-black-gray/60 backdrop-blur-md rounded-xl lg:p-6 p-4 lg:duration-100 transition-all ease-out author-info-card">
        {children}
    </section>
  </div>
}
export default Card