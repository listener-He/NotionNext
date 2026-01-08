const Card = ({ children, headerSlot, className }) => {
  return <div className={className}>
    <>{headerSlot}</>
    <section className="card card-base card-shadow dark:text-gray-300 border border-gray-100 dark:border-white/10 card-focus-gradient bg-white/90 dark:bg-hexo-black-gray/60 backdrop-blur-md rounded-xl lg:p-6 p-4 lg:duration-100 transition-all ease-out author-info-card">
        {children}
    </section>
  </div>
}
export default Card