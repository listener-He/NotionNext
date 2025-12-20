const Card = ({ children, headerSlot, className }) => {
  return <div className={className}>
    <>{headerSlot}</>
    <section className="card card-base shadow-md hover:shadow-md dark:text-gray-300 rounded-xl lg:p-6 p-4 glass-layer-soft lg:duration-100 transition-all ease-out author-info-card">
        {children}
    </section>
  </div>
}
export default Card