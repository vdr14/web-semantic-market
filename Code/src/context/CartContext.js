import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    // Load cart from localStorage on initial render
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Persist cart in localStorage whenever cartItems change
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Add item to cart
  const addToCart = (item) => {
    setCartItems((prev) => {
      // Check if the item already exists in the cart
      const existingItemIndex = prev.findIndex(
        (cartItem) => cartItem.productId?.value === item.productId
      );

      if (existingItemIndex > -1) {
        // If item exists, increase its quantity
        const updatedCart = [...prev];
        const existingItem = updatedCart[existingItemIndex];
        const updatedQuantity = parseInt(existingItem.quantity?.value || 1, 10) + 1;

        updatedCart[existingItemIndex] = {
          ...existingItem,
          quantity: { value: updatedQuantity },
        };

        return updatedCart;
      } else {
        // If item does not exist, add it with a quantity of 1
        const formattedItem = {
          name: { value: item.name },
          price: { value: item.price },
          brand: { value: item.brand },
          productId: { value: item.productId },
          quantity: { value: 1 }, // Default quantity to 1
          stock: { value: item.stock },
          available: { value: item.available },
        };

        return [...prev, formattedItem];
      }
    });
  };

  // Remove item or decrease its quantity
  const removeFromCart = (productId) => {
    setCartItems((prev) => {
      // Check if the item exists in the cart
      const existingItemIndex = prev.findIndex(
        (cartItem) => cartItem.productId?.value === productId
      );

      if (existingItemIndex > -1) {
        const updatedCart = [...prev];
        const existingItem = updatedCart[existingItemIndex];
        const currentQuantity = parseInt(existingItem.quantity?.value || 1, 10);

        if (currentQuantity > 1) {
          // Decrease quantity if greater than 1
          updatedCart[existingItemIndex] = {
            ...existingItem,
            quantity: { value: currentQuantity - 1 },
          };
          return updatedCart;
        } else {
          // Remove item from the cart if quantity is 1
          updatedCart.splice(existingItemIndex, 1);
          return updatedCart;
        }
      }

      return prev; // Return the cart unchanged if the item does not exist
    });
  };

  // Calculate total items count
  const getTotalItemsCount = () => {
    return cartItems.reduce((total, item) => {
      return total + parseInt(item.quantity?.value || 1, 10);
    }, 0);
  };

  // Calculate total price
  const getTotalPrice = () => {
    return cartItems.reduce((sum, item) => {
      const price = parseFloat(item.price?.value || 0);
      const quantity = parseInt(item.quantity?.value || 1, 10);
      return sum + price * quantity;
    }, 0).toFixed(2);
  };

  // Clear the cart
  const clearCart = () => {
    setCartItems([]); // Reset cart to an empty array
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart, // Added this function
        clearCart,
        getTotalItemsCount,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
