import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styling/Subcategories.css';

const Subcategories = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { category } = location.state || {}; // Receive the selected category 
  const [subcategories, setSubcategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // For loading state

  useEffect(() => {
    if (!category) return;

    // SPARQL query to fetch subcategories of the selected category
    const query = `
      PREFIX base: <http://www.semanticweb.org/My_Super/>
      PREFIX gr: <http://purl.org/goodrelations/v1#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

      SELECT DISTINCT ?subcategory
      WHERE {
        ?category rdfs:subClassOf gr:ProductOrService .
        ?subcategory rdfs:subClassOf ?category .
        ?subclass rdfs:subClassOf ?subcategory .
        FILTER(?category = base:${category.replace(/ /g, '_')})
      }
    `;

    // Fetch the subcategories
    axios
      .get('/repositories/Super_Market', {
        params: { query },
        headers: { Accept: 'application/sparql-results+json' },
      })
      .then((response) => {
        const fetchedSubcategories = response.data.results.bindings.map((row) => {
          const uriParts = row.subcategory.value.split('/');
          return uriParts[uriParts.length - 1].replace(/_/g, ' ');
        });
        setSubcategories(fetchedSubcategories); // Store subcategories
      })
      .catch((error) => {
        console.error('Error fetching subcategories:', error);
      })
      .finally(() => {
        setIsLoading(false); // Stop loading after data is fetched
      });
  }, [category]);

  const handleSubcategoryClick = (subcategory) => {
    // Navigate to Products.js with the selected subcategory
    navigate(`/products/${encodeURIComponent(subcategory)}`, {
      state: { subcategory },
    });
  };

  return (
    <div className="subcategories-container">
      <h1>Subcategories of {category}</h1>
      {isLoading ? (
        <p>Loading...</p>
      ) : subcategories.length > 0 ? (
        <div className="subcategories-grid">
          {subcategories.map((subcategory, index) => (
            <button
              key={index}
              className="subcategory-button"
              onClick={() => handleSubcategoryClick(subcategory)}
            >
              {subcategory}
            </button>
          ))}
        </div>
      ) : (
        <p>No subcategories found for "{category}".</p>
      )}
    </div>
  );
};

export default Subcategories;
