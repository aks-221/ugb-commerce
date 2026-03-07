import React, { createContext, useContext, useState, ReactNode } from "react";

// Type simplifié pour le panier
export interface CartProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  stock: number;
  vendorId: string;
  vendorName: string;
  vendorPhone: string;
  vendorPavilion: string;
  vendorRoom: string;
}

export interface CartItem {
  product: CartProduct;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  currentVendorId: string | null;
  addToCart: (product: CartProduct) => boolean;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [currentVendorId, setCurrentVendorId] = useState<string | null>(null);

  const addToCart = (product: CartProduct): boolean => {
    if (currentVendorId && currentVendorId !== product.vendorId) {
      return false;
    }

    setCurrentVendorId(product.vendorId);
    
    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.product.id === product.id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
            : item
        );
      }
      return [...prevItems, { product, quantity: 1 }];
    });
    return true;
  };

  const removeFromCart = (productId: string) => {
    setItems((prevItems) => {
      const newItems = prevItems.filter((item) => item.product.id !== productId);
      if (newItems.length === 0) {
        setCurrentVendorId(null);
      }
      return newItems;
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: Math.min(quantity, item.product.stock) }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setCurrentVendorId(null);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        currentVendorId,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
