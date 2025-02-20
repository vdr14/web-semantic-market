import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styling/InsertProducts.css';

const categoryStructure = {
    "Basic_packaged_foods-Freezer": {
      "Bakery": ["Bagel", "Breadstick", "Croissant", "Crouton", "Halva", "Pita", "Rusk", "Sliced_bread", "Tortilla", "Tsoureki"],
      "Cooking_oil": ["Corn_oil", "Olive_oil", "Olive_pomace_oil", "Sunflower_oil"],
      "Flour-Sugar-Pastry": ["Flour", "Pastry", "Sugar"],
      "Frozen_food-Ice_cream": ["Frozen_food", "Ice_cream"],
      "Jar_and_Canned_food": ["Canning", "Jar"],
      "Pasta-Rice-Legume": ["Legume", "Pasta", "Rice"],
      "Spices-Herbs-Salt": ["Herb", "Salt", "Spice"],
      "Vinegar-Sauces": ["Sauce", "Vinegar"]
    },
    "Beverages-soft_drinks-waters-nuts": {
      "Beer": ["Ale", "Lager", "Pilsner", "Stout", "Wheat_beer"],
      "Beverages": ["Brandy", "Cider", "Gin", "Liqueur", "Ouzo", "Rum", "Tequila", "Tsipouro", "Vodka", "Whisky"],
      "Soft_drinks_and_juice": ["Cola", "Drink_mixer", "Energy_drink", "Ice_tea", "Juice", "Lemon-lime_soda", "Lemonade", "Orange_soft_drink", "Soda_water", "Tonic_water"],
      "Water": ["Carbonated_water", "Mineral_water"],
      "Winery": ["Red_wine", "Sparkling_wine", "White_wine", "Wine"]
    },
    "Dairy-Plant_Based_Beverages-Chilled_Products": {
      "Chilled_Products": ["Chicken_egg", "Confectionery", "Margarine", "Salad"],
      "Dairy": ["Butter", "Cream", "Milk", "Yogurt"],
      "Plant_Based_Beverages": ["Almond_milk", "Oat_milk", "Soy_milk"]
    },
    "Fruit_and_Vegetables": {
      "Fruit": ["Apple", "Avocado", "Banana", "Blueberry", "Cherry", "Fig", "Grape", "Grapefruit", "Kiwi", "Lemon", "Lime", "Melon", "Orange", "Peach", "Pear", "Plum", "Raspberry", "Strawberry", "Watermelon"],
      "Vegetable": ["Beet", "Bell_Pepper", "Broccoli", "Cabbage", "Carrot", "Cauliflower", "Coriander", "Corn", "Cucumber", "Eggplant", "Garlic", "Kale", "Lettuce", "Mushroom", "Onion", "Potato", "Spinach", "Sprout", "Tomato", "Zucchini"]
    },
    "Toiletries": {
      "Baby_Care": ["Baby_food", "Baby_powder", "Baby_shampoo", "Diaper", "Wet_wipe"],
      "Body_Care": ["Deodorant", "Lotion", "Shower_gel", "Soap", "Sponge", "Sunscreen"],
      "Hair_Care": ["Hair_coloring", "Hair_conditioner", "Hair_gel", "Hair_mousse", "Hair_oil", "Hair_spray", "Shampoo"],
      "Men_Care": ["Aftershave", "Razor", "Shaving_cream"],
      "Oral_hygiene": ["Dental_floss", "Mouthwash", "Toothbrush", "Toothpaste"],
      "OTC": ["Condom", "Cotton_swab", "First_aid"],
      "Women_Care": ["Cosmetics", "Hair_removal", "Menstrual_pad", "Perfume", "Tampon"]
    }
  };

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
  
    const handleChange = (e) => {
      const { name, value } = e.target;
      setProduct({ ...product, [name]: value });
    };
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      
      const insertQuery = `
        PREFIX base: <http://www.semanticweb.org/My_Super/>
        PREFIX gr: <http://purl.org/goodrelations/v1#>
        PREFIX pto: <http://www.productontology.org/id/>
        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
        
        INSERT DATA {
          base:${product.name.replace(/\s+/g, '_')} a pto:${product.subclass} ;
            base:hasProductID "${Math.floor(Math.random() * 1000)}"^^xsd:string ;
            base:isAvailable "${product.available}"^^xsd:boolean ;
            base:hasStock "${product.stock}"^^xsd:integer ;
            base:hasBrand "${product.brand}"^^xsd:string ;
            base:hasPrice "${product.price}"^^xsd:double ;
            base:hasDiscountPrice "${product.discountPrice}"^^xsd:double ;
            base:hasQuantity "${product.quantity}"^^xsd:string ;
            gr:name "${product.name}"^^xsd:string .
        }
      `;
  
      try {
        await axios.post('/repositories/Super_Market', insertQuery, {
          headers: { 'Content-Type': 'application/sparql-update' },
        });
        alert('Product successfully added!');
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
          <input type="number" name="discountPrice" placeholder="Discount Price (€)" onChange={handleChange} required />
          <input type="number" name="stock" placeholder="Stock" onChange={handleChange} required />
          <input type="text" name="quantity" placeholder="Quantity (e.g., 1 kg)" onChange={handleChange} required />
          
          <label>Available:</label>
          <select name="available" onChange={handleChange}>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
          
          <label>Category:</label>
          <select name="category" onChange={handleChange}>
            <option value="">Select Category</option>
            {Object.keys(categoryStructure).map((cat) => (
              <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
            ))}
          </select>
          
          <label>Subcategory:</label>
          <select name="subcategory" onChange={handleChange}>
            <option value="">Select Subcategory</option>
            {(categoryStructure[product.category] || []).map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
  
          <label>Subclass:</label>
          <select name="subclass" onChange={handleChange}>
            <option value="">Select Subclass</option>
            {(categoryStructure[product.category]?.[product.subcategory] || []).map((subc) => (
              <option key={subc} value={subc}>{subc}</option>
            ))}
          </select>
  
          <button type="submit">Add Product</button>
        </form>
      </div>
    );
  };

  export default InsertProduct;