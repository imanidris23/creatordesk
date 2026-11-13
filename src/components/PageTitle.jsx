export default function PageTitle({ eyebrow, title, text, action }) {
  return (
    <div className="page-title">
      <div>
        {eyebrow && <span>{eyebrow}</span>}
        <h1>{title}</h1>
        <p>{text}</p>
      </div>

      {action}
    </div>
  );
}
