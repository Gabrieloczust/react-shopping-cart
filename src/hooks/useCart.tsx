import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const updateCart = (cartArray: Product[]) => {
    setCart(cartArray);
    localStorage.setItem("@RocketShoes:cart", JSON.stringify(cartArray));
    console.log(cart);
  };

  const addProduct = async (productId: number) => {
    try {
      const existProduct = cart.some((product) => product.id === productId);

      if (existProduct) {
        const cartAddAmount = cart.map((product) => {
          if (product.id === productId) {
            product.amount += 1;
            return product;
          }

          return product;
        });

        updateCart(cartAddAmount);
      } else {
        const productResponse = await api.get(`products/${productId}`);

        if (productResponse.status === 200) {
          productResponse.data.amount = 1;
          updateCart([...cart, productResponse.data]);
        }
      }
    } catch {
      // TODO
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
