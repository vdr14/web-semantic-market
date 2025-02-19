import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import '../styling/ProductDetails.css';

const ProductDetails = () => {
  const { productName } = useParams(); // Used for manual navigation
  const location = useLocation(); // Used to detect if it's accessed via search
  const [instances, setInstances] = useState([]); // To hold product details
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const { addToCart } = useCart(); // Cart context

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setIsLoading(true); // Set loading to true before fetching
        let query = '';

        if (location.state?.products) {
          // Case 1: Search Navigation (products passed directly from Header.js)
          setInstances(location.state.products);
          setIsLoading(false);
          return;
        } 

        // Case 2: Manual Navigation
        else if (productName) {
          const formattedProductName = productName.replace(/\s+/g, '_');
          query = `
            PREFIX base: <http://www.semanticweb.org/My_Super/>
            PREFIX gr: <http://purl.org/goodrelations/v1#>
            PREFIX pto: <http://www.productontology.org/id/>
            PREFIX rdf: <http://www.w3.org/1999/02/rdf-syntax-ns#>
            
            SELECT ?instance ?name ?brand ?price ?discountPrice ?productId 
                  ?quantity ?stock ?available
            WHERE {
              ?instance gr:name ?name ;
                        base:hasBrand ?brand ;
                        base:hasPrice ?price ;
                        base:hasDiscountPrice ?discountPrice ;
                        base:hasProductID ?productId ;
                        base:hasQuantity ?quantity ;
                        base:hasStock ?stock ;
                        base:isAvailable ?available ;
                        a pto:${formattedProductName} .
            }
          `;
        }

        // Execute the query
        if (query) {
          const response = await axios.get('/repositories/Super_Market', {
            params: { query },
            headers: { 'Accept': 'application/sparql-results+json' },
          });
          const fetchedInstances = response.data.results.bindings.map((item) => ({
            instance: item.instance?.value,
            name: item.name?.value,
            brand: item.brand?.value,
            price: item.price?.value,
            discountPrice: item.discountPrice?.value,
            productId: item.productId?.value,
            quantity: item.quantity?.value,
            stock: item.stock?.value,
            available: item.available?.value === 'true',
          }));
          setInstances(fetchedInstances);
        }
      } catch (error) {
        console.error('Error fetching product details:', error);
      } finally {
        setIsLoading(false); // Set loading to false after fetching
      }
    };

    fetchProductDetails();
  }, [productName, location.state]);

  return (
    <div className="categories-container">
      <div className="product-details">
        <h2>
          {location.state?.keyword
            ? `Products matching: "${decodeURIComponent(location.state.keyword)}"`
            : `Details of Subclass: ${decodeURIComponent(productName)}`}
        </h2>

        {isLoading ? (
          <p>Loading...</p>
        ) : instances.length > 0 ? (
          <div className="instances-grid">
            {instances.map((instance, index) => (
              <div key={index} className="instance-card">
                <div className="instance-info">
                  <h3>{instance.name || 'Unnamed Product'}</h3>
                  <div className="detail-item">
                    <label>Brand:</label>
                    <span>{instance.brand}</span>
                  </div>
                  <div className="detail-item">
                    <label>Price:</label>
                    <span>{instance.price} €</span>
                  </div>
                  <div className="detail-item">
                    <label>Discount:</label>
                    <span>{instance.discountPrice} €</span>
                  </div>
                  <div className="detail-item">
                    <label>Product ID:</label>
                    <span>{instance.productId}</span>
                  </div>
                  <div className="detail-item">
                    <label>Quantity:</label>
                    <span>{instance.quantity}</span>
                  </div>
                  <div className="detail-item">
                    <label>Stock:</label>
                    <span>{instance.stock}</span>
                  </div>
                  <div className="detail-item">
                    <label>Available:</label>
                    <span>{instance.available ? 'Yes' : 'No'}</span>
                  </div>
                  <button
                    onClick={() => addToCart(instance)}
                    className="add-to-cart-btn"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No products found.</p>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;