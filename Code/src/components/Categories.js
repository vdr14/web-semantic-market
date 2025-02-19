import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styling/Categories.css';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const query = `
      PREFIX gr: <http://purl.org/goodrelations/v1#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

      SELECT DISTINCT ?category
      WHERE {
        ?category rdfs:subClassOf gr:ProductOrService .
        ?subcategory rdfs:subClassOf ?category .
        ?subclass rdfs:subClassOf ?subcategory .
      }
    `;

    axios
      .get('/repositories/Super_Market', {
        params: { query },
        headers: { 'Accept': 'application/sparql-results+json' },
      })
      .then((response) => {
        const categoryNames = response.data.results.bindings.map((row) => {
          const uriParts = row.category.value.split('/');
          return uriParts[uriParts.length - 1].replace(/_/g, ' ');
        });
        setCategories(categoryNames);
      })
      .catch((error) => {
        console.error('Error fetching categories:', error);
      });
  }, []);

  const handleCategoryClick = (category) => {
    navigate(`/subcategories/${encodeURIComponent(category)}`, {
      state: { category },
    });
  };


  return (
    <div className="categories-container">
      <h1>Categories</h1>
      <div className="categories-grid">
        {categories.map((category, index) => (
          <button
            key={index}
            className="category-button"
            onClick={() => handleCategoryClick(category)}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Categories;
