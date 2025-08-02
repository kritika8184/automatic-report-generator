import Card from "react-bootstrap/Card";

function DisclosureCard({ data }) {
  if (!data) return null;
  const {
    requirement_title,
    category,
    importance_summary,
    generated_disclosure
  } = data;
  
  return (
    <Card bg="dark" text="white" className="mb-4 shadow border border-secondary h-100">
      <Card.Body>
        <Card.Title className="text-subheading fs-5">{requirement_title}</Card.Title>
        <Card.Subtitle className="text-light mb-2">
          Category: {category}
        </Card.Subtitle>
        <Card.Text className="small">{importance_summary}</Card.Text>

        <hr />
        <h6 className="text-light">{generated_disclosure?.section_title}</h6>
        <p className="text-white-50 small">{generated_disclosure?.narrative}</p>

        {/* {generated_disclosure?.suggested_metrics?.length > 0 && (
          <>
            <h6 className="text-light">Suggested Metrics:</h6>
            <ul className="list-group list-group-flush">
              {generated_disclosure.suggested_metrics.map((metric, i) => (
                <li key={i} className="list-group-item bg-dark text-light border-0 ps-3">
                  {metric}
                </li>
              ))}
            </ul>
          </>
        )} */}
      </Card.Body>
    </Card>
  );
}

export default DisclosureCard;
