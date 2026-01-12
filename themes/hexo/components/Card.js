const Card = ({ children, headerSlot, className }) => {
  return <div className={className}>
    <>{headerSlot}</>
    <section className="card card-base card-shadow dark:text-gray-300 card-focus-gradient glass-morphism dark:glass-morphism-dark rounded-xl lg:p-6 p-4 lg:duration-100 transition-all ease-out author-info-card">
        {children}
    </section>
  </div>
}
export default Card
