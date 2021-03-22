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
  checkOut: () => Promise<void>;
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
  };

  const isStock = async (productId: number, amount: number) => {
    const {
      status,
      data: stock,
    }: { status: number; data: Stock } = await api.get(`stock/${productId}`);

    if (status !== 200 || amount > stock.amount) {
      toast.error("Quantidade solicitada fora de estoque");
      return false;
    }

    return true;
  };

  const addProduct = async (productId: number) => {
    try {
      const productInCart = cart.find((product) => product.id === productId);

      if (productInCart) {
        updateProductAmount({ productId, amount: productInCart.amount + 1 });
        return;
      }

      const {
        status,
        data: product,
      }: { status: number; data: Product } = await api.get(
        `products/${productId}`
      );

      if (status === 200) {
        const existInStock = await isStock(productId, 1);
        if (!existInStock) return;

        product.amount = 1;
        updateCart([...cart, product]);
      }
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const existProduct = cart.some((product) => product.id === productId);

      if (!existProduct) {
        throw new Error();
      }

      const newCart = cart.filter((product) => product.id !== productId);
      updateCart(newCart);
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        throw new Error();
      }

      const existInStock = await isStock(productId, amount);
      if (!existInStock) return;

      const newCart = cart.map((product) => {
        if (product.id === productId) {
          product.amount = amount;
        }

        return product;
      });

      updateCart(newCart);
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  const checkOut = async () => {
    try {
      if (cart.length === 0) {
        throw new Error();
      }

      await cart.map(async (product) => {
        const { status, data: productStock } = await api.get(
          `stock/${product.id}`
        );

        if (status === 200) {
          await api.put("stock", {
            id: product.id,
            amount: productStock.amount - product.amount,
          });
        }
      });

      updateCart([]);
      toast.success("Pedido finalizado");
    } catch {
      toast.error("Erro ao finalizar pedido");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount, checkOut }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
