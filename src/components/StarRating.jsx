/**
 * مكوّن عرض النجوم
 * @param {number} rating  - التقييم (1-5)
 * @param {number} size    - حجم النجمة بـ px (اختياري)
 */
export default function StarRating({ rating = 0, size }) {
  const style = size ? { fontSize: size + 'px' } : {}

  return (
    <div className="star-rating" style={style}>
      {[1, 2, 3, 4, 5].map((star) => {
        let cls = 'star'
        if (rating >= star) cls += ' filled'
        else if (rating >= star - 0.5) cls += ' half'
        return (
          <span key={star} className={cls}>★</span>
        )
      })}
    </div>
  )
}
