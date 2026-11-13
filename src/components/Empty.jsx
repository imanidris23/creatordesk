export default function Empty({ icon: Icon, title, text }) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon size={22} />
      </div>

      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
