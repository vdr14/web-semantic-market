import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styling/EditProduct.css';

const EditProduct = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { product, category } = location.state || {}; // Extract product and category

  const [editedProduct, setEditedProduct] = useState({
    productId: product?.productId || '',
    name: product?.name || '',
    brand: product?.brand || '',
    price: product?.price || '',
    discountPrice: product?.discountPrice || '',
    stock: product?.stock || '',
    quantity: product?.quantity || '',
    available: product?.available ? 'true' : 'false',
  });

  const [isLoading, setIsLoading] = useState(false); // Loading state

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedProduct({ ...editedProduct, [name]: value });
  };

  // Handle product update
  const handleSave = async (e) => {
    e.preventDefault();

    if (!editedProduct.productId) {
      alert("Error: Product ID missing.");
      return;
    }

    setIsLoading(true);

    // Έλεγχος αν το stock είναι 0 και ενημέρωση του available
    const stockValue = parseInt(editedProduct.stock, 10);
    const availableValue = stockValue > 0 ? editedProduct.available : 'false';

    const updateQuery = `
    PREFIX base: <http://www.semanticweb.org/My_Super/>
    PREFIX gr: <http://purl.org/goodrelations/v1#>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

    DELETE {
      ?product base:hasProductID ?oldId ;
               gr:name ?oldName ;
               base:hasBrand ?oldBrand ;
               base:hasPrice ?oldPrice ;
               base:hasDiscountPrice ?oldDiscountPrice ;
               base:hasStock ?oldStock ;
               base:hasQuantity ?oldQuantity ;
               base:isAvailable ?oldAvailable .
    }
    INSERT {
      ?product base:hasProductID "${editedProduct.productId}"^^xsd:string ;
               gr:name "${editedProduct.name}"^^xsd:string ;
               base:hasBrand "${editedProduct.brand}"^^xsd:string ;
               base:hasPrice "${editedProduct.price}"^^xsd:double ;
               base:hasDiscountPrice "${editedProduct.discountPrice}"^^xsd:double ;
               base:hasStock "${editedProduct.stock}"^^xsd:integer ;
               base:hasQuantity "${editedProduct.quantity}"^^xsd:string ;
               base:isAvailable "${availableValue}"^^xsd:boolean .
    }
    WHERE {
      ?product base:hasProductID ?oldId .
      OPTIONAL { ?product gr:name ?oldName . }
      OPTIONAL { ?product base:hasBrand ?oldBrand . }
      OPTIONAL { ?product base:hasPrice ?oldPrice . }
      OPTIONAL { ?product base:hasDiscountPrice ?oldDiscountPrice . }
      OPTIONAL { ?product base:hasStock ?oldStock . }
      OPTIONAL { ?product base:hasQuantity ?oldQuantity . }
      OPTIONAL { ?product base:isAvailable ?oldAvailable . }
      FILTER (?oldId = "${editedProduct.productId}"^^xsd:string)
    }
  `;

    try {
      await axios.post('/repositories/Super_Market/statements', updateQuery, {
        headers: { 'Content-Type': 'application/sparql-update' },
      });

      alert("Product updated successfully!");

      // Navigate back to ProductDetails with updated product and category
      navigate(`/product-details/${encodeURIComponent(category)}`, {});
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Failed to update product. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle product deletion
  const handleDelete = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete this product?");
    if (!confirmDelete) return;

    setIsLoading(true);

    const deleteQuery = `
      PREFIX base: <http://www.semanticweb.org/My_Super/>
      DELETE WHERE {
        ?product base:hasProductID "${editedProduct.productId}"^^xsd:string .
        ?product ?p ?o .
      }
    `;

    try {
      await axios.post('/repositories/Super_Market/statements', deleteQuery, {
        headers: { 'Content-Type': 'application/sparql-update' },
      });

      alert("Product deleted successfully!");
      navigate('/dashboard');
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="edit-product-page">
      <h1>Edit Product</h1>
      <form onSubmit={handleSave}>
        <label>Product ID:</label>
        <input type="text" id="productId" value={editedProduct.productId} disabled />

        <label>Product Name:</label>
        <input type="text" name="name" value={editedProduct.name} onChange={handleChange} required />

        <label>Brand:</label>
        <input type="text" name="brand" value={editedProduct.brand} onChange={handleChange} required />

        <label>Price (€):</label>
        <input type="number" name="price" value={editedProduct.price} onChange={handleChange} required />

        <label>Discount (%):</label>
        <input type="number" name="discountPrice" value={editedProduct.discountPrice} onChange={handleChange} />

        <label>Stock:</label>
        <input type="number" name="stock" value={editedProduct.stock} onChange={handleChange} required />

        <label>Quantity:</label>
        <input type="text" name="quantity" value={editedProduct.quantity} onChange={handleChange} required />

        <label>Available:</label>
        <select name="available" value={editedProduct.available} onChange={handleChange}>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>

        <button type="submit" className="save-btn" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Changes"}
        </button>
        <button type="button" onClick={() => navigate(-1)} className="cancel-btn" disabled={isLoading}>
          Cancel
        </button>
        <button type="button" onClick={handleDelete} className="delete-btn" disabled={isLoading}>
          {isLoading ? "Deleting..." : "Delete Product"}
        </button>
      </form>
    </div>
  );
};

export default EditProduct;