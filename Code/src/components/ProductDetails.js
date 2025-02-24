import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import '../styling/ProductDetails.css';

const ProductDetails = () => {
  const { productName } = useParams(); // Used for manual navigation
  const location = useLocation(); // Used to detect if it's accessed via search
  const decodedProductName = location.state?.product?.name || decodeURIComponent(productName);
  const [instances, setInstances] = useState([]); // To hold product details
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const { addToCart } = useCart(); // Cart context
  const navigate = useNavigate();


  const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
  const isAdmin = loggedInUser?.role === "shopOwner"; // Check if admin

  useEffect(() => {
    if (location.state?.products) {
      // Case 1: Products passed from EditProduct
      setInstances(location.state.products);
      setIsLoading(false);
      return;
    }
  
    // Case 2: Manual Navigation or initial load
    const fetchProductDetails = async () => {
      try {
        setIsLoading(true);
        const formattedProductName = productName.replace(/\s+/g, '_');
        const query = `
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
      } catch (error) {
        console.error('Error fetching product details:', error);
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchProductDetails();
  }, [productName, location.state]);

  const exportTTL = (product) => {
    const ttlSnippet = `
  @prefix base: <http://www.semanticweb.org/My_Super/> .
  @prefix gr: <http://purl.org/goodrelations/v1#> .
  @prefix pto: <http://www.productontology.org/id/> .
  @prefix rdf: <http://www.w3.org/1999/02/rdf-syntax-ns#> .
  @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
  
  <${product.instance}> a pto:${productName.replace(/\s+/g, '_')} ;
      gr:name "${product.name}" ;
      base:hasBrand "${product.brand}" ;
      base:hasPrice "${product.price}"^^xsd:double ;
      base:hasDiscountPrice "${product.discountPrice}"^^xsd:double ;
      base:hasProductID "${product.productId}" ;
      base:hasQuantity "${product.quantity}" ;
      base:hasStock "${product.stock}"^^xsd:integer ;
      base:isAvailable "${product.available}"^^xsd:boolean .
  `;
    const blob = new Blob([ttlSnippet], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${product.name.replace(/\s+/g, '_')}.ttl`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  

  return (
    <div className="categories-container">
      <div className="product-details">
      <h2>
        {location.state?.keyword
        ? `Products matching: "${decodeURIComponent(location.state.keyword)}"`
        : `${decodedProductName}`}
      </h2>


        {isLoading ? (
          <p>Loading...</p>
        ) : instances.length > 0 ? (
          <div className="instances-grid">
            {instances.map((instance, index) => (
              <div key={index} className="instance-card">
                <div className="instance-info">
                  <h3>{instance.name || 'Unnamed Product'}</h3>
                  <div className="detail-item"><label>Product ID:</label><span>{instance.productId}</span></div>
                  <div className="detail-item"><label>Brand:</label><span>{instance.brand}</span></div>
                  <div className="detail-item"><label>Price:</label><span>{instance.price} €</span></div>
                  <div className="detail-item"><label>Discount:</label><span>{instance.discountPrice} %</span></div>
                  <div className="detail-item"><label>Final Price:</label><span>{(instance.price - (instance.price * instance.discountPrice / 100)).toFixed(2)} €</span></div>
                  <div className="detail-item"><label>Quantity:</label><span>{instance.quantity}</span></div>
                  <div className="detail-item"><label>Stock:</label><span>{instance.stock}</span></div>
                  <div className="detail-item"><label>Available:</label><span style={{ color: instance.available ? 'green' : 'red' }}>{instance.available ? 'Yes' : 'No (Out of Stock)'}</span></div>

                  {isAdmin ? (
                    //Admin: Edit Product Button
                    <button
                    onClick={() => navigate(`/edit-product/${instance.productId}`, { state: { product: instance, category: decodedProductName } })} className="edit-product-btn">
                    Edit Product
                    </button>
                  ) : (
                    //Normal User: Add to Cart Button
                    <button onClick={() => addToCart(instance)} className="add-to-cart-btn" disabled={!instance.available}>
                      {instance.available ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                  )}
                  
                  <button onClick={() => exportTTL(instance)} className="export-ttl-btn">Export RDF</button>

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