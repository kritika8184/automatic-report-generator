import { useEffect, useState } from "react";
import DisclosureCard from "./components/DisclosureCard";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  const [disclosures, setDisclosures] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:8000/generated-disclosures")
      .then((res) => {
        setDisclosures(res.data);
      })
      .catch((err) => {
        console.error("Error fetching disclosures:", err);
      });
  }, []);

  console.log(disclosures);
  return (
    <div className="bg-dark text-light min-vh-100 py-5">
        <h1 className="text-center mb-5">Basel III Missing Disclosures</h1>
        <div className="container">
        <div className="">
          {disclosures.map((item, idx) => (
            <div className="" key={idx}>
              <DisclosureCard data={item.generated} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
