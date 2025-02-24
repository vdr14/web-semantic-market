import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styling/InsertProducts.css';

const InsertProduct = () => {
  const navigate = useNavigate();
  const [product, setProduct] = useState({
    name: '',
    brand: '',
    price: '',
    discountPrice: '',
    stock: '',
    quantity: '',
    available: true,
    category: '',
    subcategory: '',
    subclass: ''
  });

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [subclasses, setSubclasses] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch categories from the database
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      const categoryQuery = `
        PREFIX base: <http://www.semanticweb.org/My_Super/>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        PREFIX gr: <http://purl.org/goodrelations/v1#>

        SELECT DISTINCT ?category
        WHERE {
          ?category rdfs:subClassOf gr:ProductOrService .
          ?subcategory rdfs:subClassOf ?category .
          ?subclass rdfs:subClassOf ?subcategory .
        }
      `;

      try {
        const response = await axios.get('/repositories/Super_Market', {
          params: { query: categoryQuery },
          headers: { 'Accept': 'application/sparql-results+json' },
        });

        const categoriesData = response.data.results.bindings.map(entry =>
          entry.category.value.split('/').pop().replace(/_/g, ' ') // Remove URI & underscores
        );

        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Fetch subcategories when a category is selected
  useEffect(() => {
    if (!product.category) return;
  
    const fetchSubcategories = async () => {
      setLoading(true);
      const subcategoryQuery = `
        PREFIX base: <http://www.semanticweb.org/My_Super/>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
  
        SELECT DISTINCT ?subcategory
        WHERE {
        ?subcategory rdfs:subClassOf base:${encodeURIComponent(product.category.replace(/\s/g, '_'))} .
        FILTER NOT EXISTS {
        ?subcategory rdfs:subClassOf ?otherClass .
        ?otherClass rdfs:subClassOf base:${encodeURIComponent(product.category.replace(/\s/g, '_'))} .
        }
       }
      `;
  
      try {
        const response = await axios.get('/repositories/Super_Market', {
          params: { query: subcategoryQuery },
          headers: { 'Accept': 'application/sparql-results+json' },
        });
  
        console.log("Subcategories Query Results:", response.data.results.bindings);
  
        const subcategoriesData = response.data.results.bindings.map(entry =>
          entry.subcategory.value.split('/').pop().replace(/_/g, ' ')
        );
  
        setSubcategories(subcategoriesData);
      } catch (error) {
        console.error('Error fetching subcategories:', error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchSubcategories();
  }, [product.category]);

  // Fetch subclasses when a subcategory is selected
  useEffect(() => {
    if (!product.subcategory) return;
  
    const fetchSubclasses = async () => {
      setLoading(true);
      const subclassQuery = `
        PREFIX base: <http://www.semanticweb.org/My_Super/>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

        SELECT DISTINCT ?subclass
        WHERE {
        ?subclass rdfs:subClassOf base:${encodeURIComponent(product.subcategory.replace(/\s/g, '_'))} .
        FILTER NOT EXISTS {
        ?subclass rdfs:subClassOf ?otherClass .
        ?otherClass rdfs:subClassOf base:${encodeURIComponent(product.subcategory.replace(/\s/g, '_'))} .
        }
      }
      `;
  
      try {
        const response = await axios.get('/repositories/Super_Market', {
          params: { query: subclassQuery },
          headers: { 'Accept': 'application/sparql-results+json' },
        });
  
        console.log("Subclasses Query Results:", response.data.results.bindings);
  
        const subclassesData = response.data.results.bindings.map(entry =>
          entry.subclass.value.split('/').pop().replace(/_/g, ' ')
        );
  
        setSubclasses(subclassesData);
      } catch (error) {
        console.error('Error fetching subclasses:', error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchSubclasses();
  }, [product.subcategory]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct({ ...product, [name]: value });
  
    if (name === 'category') {
      // Reset subcategory and subclass when category changes
      setProduct(prev => ({ ...prev, subcategory: '', subclass: '' }));
      setSubcategories([]);
      setSubclasses([]);
    } else if (name === 'subcategory') {
      // Reset subclass when subcategory changes
      setProduct(prev => ({ ...prev, subclass: '' }));
      setSubclasses([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      //Step 1: Fetch the highest existing product ID
      const idQuery = `
        PREFIX base: <http://www.semanticweb.org/My_Super/>
        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
  
        SELECT (MAX(xsd:integer(?id)) AS ?maxID)
        WHERE {
          ?product base:hasProductID ?id .
        }
      `;
  
      const response = await axios.get('/repositories/Super_Market', {
        params: { query: idQuery },
        headers: { 'Accept': 'application/sparql-results+json' },
      });
  
      let nextProductID = 1; // Default to 1 if no products exist
  
      if (response.data.results.bindings.length > 0 && response.data.results.bindings[0].maxID) {
        nextProductID = parseInt(response.data.results.bindings[0].maxID.value, 10) + 1;
      }
  
      //Step 2: Insert the new product with the next ID
      const insertQuery = `
        PREFIX base: <http://www.semanticweb.org/My_Super/>
        PREFIX gr: <http://purl.org/goodrelations/v1#>
        PREFIX pto: <http://www.productontology.org/id/>
        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
  
        INSERT DATA {
          <http://www.semanticweb.org/My_Super/${product.name.replace(/\s+/g, '_')}> a <http://www.semanticweb.org/My_Super/${product.subclass.replace(/\s+/g, '_')}> ;
            base:hasProductID "${nextProductID}"^^xsd:string ;
            base:isAvailable "${product.available}"^^xsd:boolean ;
            base:hasStock "${product.stock}"^^xsd:integer ;
            base:hasBrand "${product.brand}"^^xsd:string ;
            base:hasPrice "${product.price}"^^xsd:double ;
            base:hasDiscountPrice "${product.discountPrice}"^^xsd:double ;
            base:hasQuantity "${product.quantity}"^^xsd:string ;
            a pto:${product.subclass} ;
            gr:name "${product.name}"^^xsd:string .
        }
      `;
  
      await axios.post('/repositories/Super_Market/statements', insertQuery, {
        headers: { 'Content-Type': 'application/sparql-update' },
      });
  
      alert(`Product successfully added! Assigned ID: ${nextProductID}`);
      navigate('/dashboard');
  
    } catch (error) {
      console.error('Error inserting product:', error);
      alert('Failed to add product.');
    }
  };
  
  return (
    <div className="insert-product-page">
      <h1>Insert New Product</h1>
      <form onSubmit={handleSubmit}>
        <input type="text" name="name" placeholder="Product Name" onChange={handleChange} required />
        <input type="text" name="brand" placeholder="Brand" onChange={handleChange} required />
        <input type="number" name="price" placeholder="Price (€)" onChange={handleChange} required />
        <input type="number" name="discountPrice" placeholder="Discount (%)" onChange={handleChange} required />
        <input type="number" name="stock" placeholder="Stock" onChange={handleChange} required />
        <input type="text" name="quantity" placeholder="Quantity (e.g., 100 g, 250 ml)" onChange={handleChange} required />

        <label>Available:</label>
        <select name="available" onChange={handleChange}>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>

        <label>Category:</label>
        <select name="category" onChange={handleChange} disabled={loading}>
          <option value="">Select Category</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <label>Subcategory:</label>
        <select name="subcategory" onChange={handleChange} disabled={!subcategories.length || loading}>
          <option value="">Select Subcategory</option>
          {subcategories.map(sub => (
            <option key={sub} value={sub}>{sub}</option>
          ))}
        </select>

        <label>Type:</label>
        <select
        name="subclass"
        onChange={handleChange}
        disabled={!subclasses.length || loading}
        value={product.subclass}
        >
          <option value="">Select Type</option>
          {subclasses.map(subc => (
            <option key={subc} value={subc}>{subc}</option>
            ))}
        </select>

        <button type="submit" disabled={loading}>Add Product</button>
      </form>
    </div>
  );
};

export default InsertProduct;