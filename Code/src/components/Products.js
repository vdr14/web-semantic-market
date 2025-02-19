import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styling/Products.css';

const Products = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { subcategory } = location.state || {}; // Retrieve subcategory from state
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Loading state

  useEffect(() => {
    if (!subcategory) return;

    // SPARQL query to fetch subclasses of the selected subcategory
    const query = `
      PREFIX base: <http://www.semanticweb.org/My_Super/>
      PREFIX gr: <http://purl.org/goodrelations/v1#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

      SELECT DISTINCT ?subclass
      WHERE {
        ?subcategory rdfs:subClassOf gr:ProductOrService .
        ?subclass rdfs:subClassOf ?subcategory .
        FILTER(?subcategory = base:${subcategory.replace(/ /g, '_')})
      }
    `;

    // Fetch subclasses (products)
    axios
      .get('/repositories/Super_Market', {
        params: { query },
        headers: { Accept: 'application/sparql-results+json' },
      })
      .then((response) => {
        const fetchedProducts = response.data.results.bindings.map((row) => {
          const uriParts = row.subclass.value.split('/');
          return uriParts[uriParts.length - 1].replace(/_/g, ' ');
        });
        setProducts(fetchedProducts); // Store fetched subclasses
      })
      .catch((error) => {
        console.error('Error fetching products:', error);
      })
      .finally(() => {
        setIsLoading(false); // Stop loading after fetching data
      });
  }, [subcategory]);

  const handleProductClick = (product) => {
    // Navigate to ProductDetails.js with the selected product
    navigate(`/product-details/${encodeURIComponent(product)}`, {
      state: { product },
    });
  };

  return (
    <div className="products-container">
      <h1>Products under {subcategory}</h1>
      {isLoading ? (
        <p>Loading...</p>
      ) : products.length > 0 ? (
        <div className="products-grid">
          {products.map((product, index) => (
            <button
              key={index}
              className="product-button"
              onClick={() => handleProductClick(product)}
            >
              {product}
            </button>
          ))}
        </div>
      ) : (
        <p>No products found for "{subcategory}".</p>
      )}
    </div>
  );
};

export default Products;
