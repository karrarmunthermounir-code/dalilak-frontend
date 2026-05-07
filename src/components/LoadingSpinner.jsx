export default function LoadingSpinner({ text = 'جاري التحميل...' }) {
  return (
    <div className="spinner-wrap">
      <div className="spinner" />
      <p className="spinner-text">{text}</p>
    </div>
  )
}
