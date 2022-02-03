import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import cartReducer, {
  CartState,
  addToCart,
  checkoutCart,
  removeFromCart,
  updateQuantity,
  getMemoizedNumItems,
  getTotalPrice,
} from "./cartSlice";
import productsReducer, { receivedProducts } from "../products/productsSlice";
import { RootState, getStoreWithState } from "../../app/store";
import products from "../../../public/products.json";
import * as api from "../../app/api";
import { getStateWithItems } from "../../test-utils";

const mockStore = configureStore([thunk]);

jest.mock("../../app/api", () => {
  return {
    async getProducts() {
      return [];
    },
    async checkout(items: api.CartItems = {}) {
      const empty = Object.keys(items).length === 0;
      if (empty) throw new Error("Must include cart items");
      if (items.evilItem > 0) throw new Error();
      if (items.badItem > 0) return { success: false };
      return { success: true };
    },
  };
});

test("checkout should work", async () => {
  await api.checkout({ fakeItem: 4 });
});

describe("cart reducer", () => {
  test("an empty action", () => {
    const initialState = undefined;
    const action = { type: "" };
    const result = cartReducer(initialState, action);
    expect(result).toEqual({
      items: {},
      checkoutState: "READY",
      errorMessage: "",
    });
  });

  test("addToCart", () => {
    const initialState = undefined;
    const action = addToCart("abc");
    let result = cartReducer(initialState, action);

    expect(result).toEqual({
      items: { abc: 1 },
      checkoutState: "READY",
      errorMessage: "",
    });

    result = cartReducer(result, action);
    result = cartReducer(result, action);

    expect(result).toEqual({
      items: { abc: 3 },
      checkoutState: "READY",
      errorMessage: "",
    });
  });

  test("removeFromCart", () => {
    const initialState: CartState = {
      items: { abc: 1, def: 3 },
      checkoutState: "READY",
      errorMessage: "",
    };

    const action = removeFromCart("abc");
    let result = cartReducer(initialState, action);

    expect(result).toEqual({
      items: { def: 3 },
      checkoutState: "READY",
      errorMessage: "",
    });
  });

  test("updateQuantity", () => {
    const initialState: CartState = {
      items: { abc: 1, def: 3 },
      checkoutState: "READY",
      errorMessage: "",
    };

    const action = updateQuantity({ id: "abc", quantity: 4 });
    let result = cartReducer(initialState, action);

    expect(result).toEqual({
      items: { abc: 4, def: 3 },
      checkoutState: "READY",
      errorMessage: "",
    });
  });
});

describe("selectors", () => {
  describe("getNumItems", () => {
    it("should return 0 with no items", () => {
      const initialState: RootState = {
        cart: {
          items: {},
          checkoutState: "READY",
          errorMessage: "",
        },
        products: {
          products: {},
        },
      };

      const result = getMemoizedNumItems(initialState);
      expect(result).toEqual(0);
    });
    it("should add up the total", () => {
      const cart: CartState = {
        items: { abc: 1, def: 3 },
        checkoutState: "READY",
        errorMessage: "",
      };

      const result = getMemoizedNumItems({ cart } as RootState);
      expect(result).toEqual(4);
    });
    it("should not compute again with the same state", () => {
      const cart: CartState = {
        items: { abc: 1, def: 3 },
        checkoutState: "READY",
        errorMessage: "",
      };
      getMemoizedNumItems.resetRecomputations();
      let result = getMemoizedNumItems({ cart } as RootState);
      expect(result).toEqual(4);
      expect(getMemoizedNumItems.recomputations()).toEqual(1);
      result = getMemoizedNumItems({ cart } as RootState);
      result = getMemoizedNumItems({ cart } as RootState);
      result = getMemoizedNumItems({ cart } as RootState);
      expect(getMemoizedNumItems.recomputations()).toEqual(1);
    });
    it("should recompute with new state", () => {
      let cart: CartState = {
        items: { abc: 1, def: 3 },
        checkoutState: "READY",
        errorMessage: "",
      };
      getMemoizedNumItems.resetRecomputations();
      let result = getMemoizedNumItems({ cart } as RootState);
      expect(result).toEqual(4);
      expect(getMemoizedNumItems.recomputations()).toEqual(1);
      cart = {
        items: { abc: 4, def: 5 },
        checkoutState: "READY",
        errorMessage: "",
      };
      result = getMemoizedNumItems({ cart } as RootState);
      result = getMemoizedNumItems({ cart } as RootState);
      result = getMemoizedNumItems({ cart } as RootState);
      expect(result).toEqual(9);
      expect(getMemoizedNumItems.recomputations()).toEqual(2);
    });
  });
  describe("getTotalPrice", () => {
    it("should return 0 with an empty cart", () => {
      const initialState: RootState = {
        cart: {
          items: {},
          checkoutState: "READY",
          errorMessage: "",
        },
        products: {
          products: {},
        },
      };

      const result = getTotalPrice(initialState);

      expect(result).toEqual("0.00");
    });

    it("should add up the totals", () => {
      const cart: CartState = {
        items: {},
        checkoutState: "READY",
        errorMessage: "",
      };

      let actionATC = addToCart(products[0].id);
      let cartState = cartReducer(cart, actionATC);
      cartState = cartReducer(cartState, actionATC);

      let actionRP = receivedProducts(products);
      let productsState = productsReducer(undefined, actionRP);

      const result = getTotalPrice({
        cart: cartState,
        products: productsState,
      });

      expect(result).toEqual((products[0].price * 2).toString());
    });

    it("should not compute again with the same state", () => {
      const cart: CartState = {
        items: {},
        checkoutState: "READY",
        errorMessage: "",
      };

      let actionATC = addToCart(products[0].id);
      let cartState = cartReducer(cart, actionATC);
      cartState = cartReducer(cartState, actionATC);

      let actionRP = receivedProducts(products);
      let productsState = productsReducer(undefined, actionRP);
      getTotalPrice.resetRecomputations();
      let result = getTotalPrice({
        cart: cartState,
        products: productsState,
      });
      expect(getTotalPrice.recomputations()).toEqual(1);
      result = getTotalPrice({
        cart: cartState,
        products: productsState,
      });
      expect(getTotalPrice.recomputations()).toEqual(1);

      expect(result).toEqual((products[0].price * 2).toString());
    });

    it("should recompute with new products", () => {
      const cart: CartState = {
        items: {},
        checkoutState: "READY",
        errorMessage: "",
      };

      let actionATC = addToCart(products[0].id);
      let cartState = cartReducer(cart, actionATC);
      cartState = cartReducer(cartState, actionATC);

      let actionRP = receivedProducts(products);
      let productsState = productsReducer(undefined, actionRP);
      getTotalPrice.resetRecomputations();
      let result = getTotalPrice({
        cart: cartState,
        products: productsState,
      });
      expect(getTotalPrice.recomputations()).toEqual(1);
      actionATC = addToCart(products[1].id);
      cartState = cartReducer(cartState, actionATC);
      result = getTotalPrice({
        cart: cartState,
        products: productsState,
      });
      expect(getTotalPrice.recomputations()).toEqual(2);

      expect(result).toEqual(
        (products[0].price * 2 + products[1].price).toString()
      );
    });

    it("should recompute when cart changes", () => {
      const cart: CartState = {
        items: {},
        checkoutState: "READY",
        errorMessage: "",
      };

      let actionATC = addToCart(products[0].id);
      let cartState = cartReducer(cart, actionATC);
      cartState = cartReducer(cartState, actionATC);

      let actionRP = receivedProducts(products);
      let productsState = productsReducer(undefined, actionRP);
      getTotalPrice.resetRecomputations();
      let result = getTotalPrice({
        cart: cartState,
        products: productsState,
      });
      expect(getTotalPrice.recomputations()).toEqual(1);
      actionATC = addToCart(products[0].id);
      cartState = cartReducer(cartState, actionATC);
      result = getTotalPrice({
        cart: cartState,
        products: productsState,
      });
      expect(getTotalPrice.recomputations()).toEqual(2);

      expect(result).toEqual((products[0].price * 3).toFixed(2).toString());
    });
  });
});

describe("Thunks", () => {
  describe("checkoutCart w/mocked dispatch", () => {
    it("should checkout", async () => {
      const dispatch = jest.fn();
      const state: RootState = {
        cart: {
          items: { abc: 1, def: 4 },
          checkoutState: "READY",
          errorMessage: "",
        },
        products: {
          products: {},
        },
      };
      const thunk = checkoutCart();
      await thunk(dispatch, () => state, undefined);
      const calls = dispatch.mock.calls;
      expect(calls).toHaveLength(2);
      expect(calls[0][0].type).toEqual("cart/checkout/pending");
      expect(calls[1][0].type).toEqual("cart/checkout/fulfilled");
      expect(calls[1][0].payload).toEqual({ success: true });
    });

    it("should fail with no items", async () => {
      const dispatch = jest.fn();
      const state: RootState = {
        cart: {
          items: {},
          checkoutState: "READY",
          errorMessage: "",
        },
        products: {
          products: {},
        },
      };
      const thunk = checkoutCart();
      await thunk(dispatch, () => state, undefined);
      const calls = dispatch.mock.calls;
      expect(calls).toHaveLength(2);
      expect(calls[0][0].type).toEqual("cart/checkout/pending");
      expect(calls[1][0].type).toEqual("cart/checkout/rejected");
      expect(calls[1][0].payload).toEqual(undefined);
      expect(calls[1][0].error.message).toEqual("Must include cart items");
    });
  });
  describe("checkoutCart w/mock redux store", () => {
    it("should checkout", async () => {
      const store = mockStore({ cart: { items: { testItem: 123 } } });
      await store.dispatch(checkoutCart() as any);
      const actions = store.getActions();
      expect(actions).toHaveLength(2);
      expect(actions[0].type).toEqual("cart/checkout/pending");
      expect(actions[1].type).toEqual("cart/checkout/fulfilled");
      expect(actions[1].payload).toEqual({ success: true });
    });

    it("should fail with no items", async () => {
      const store = mockStore({ cart: { items: {} } });
      await store.dispatch(checkoutCart() as any);
      const actions = store.getActions();
      expect(actions).toHaveLength(2);
      expect(actions[0].type).toEqual("cart/checkout/pending");
      expect(actions[1].type).toEqual("cart/checkout/rejected");
      expect(actions[1].payload).toEqual(undefined);
      expect(actions[1].error.message).toEqual("Must include cart items");
    });
  });

  describe("checkoutCart w/full redux store", () => {
    it("should checkout with items", async () => {
      const state = getStateWithItems({ testItem: 3 });
      const store = getStoreWithState(state);
      await store.dispatch(checkoutCart());
      expect(store.getState().cart).toEqual({
        items: {},
        checkoutState: "READY",
        errorMessage: "",
      });
    });

    it("should fail with no items", async () => {
      const state = getStateWithItems({});
      const store = getStoreWithState(state);
      await store.dispatch(checkoutCart());
      expect(store.getState().cart).toEqual({
        items: {},
        checkoutState: "ERROR",
        errorMessage: "Must include cart items",
      });
    });

    it("should handle an error response", async () => {
      const state = getStateWithItems({ badItem: 1 });
      const store = getStoreWithState(state);
      await store.dispatch(checkoutCart());
      expect(store.getState().cart).toEqual({
        items: { badItem: 1 },
        checkoutState: "ERROR",
        errorMessage: "",
      });
    });

    it("should handle an empty error message", async () => {
      const state = getStateWithItems({ evilItem: 1 });
      const store = getStoreWithState(state);
      await store.dispatch(checkoutCart());
      expect(store.getState().cart).toEqual({
        items: { evilItem: 1 },
        checkoutState: "ERROR",
        errorMessage: "",
      });
    });

    it("should be pending before checking out", () => {
      const state = getStateWithItems({});
      const store = getStoreWithState(state);
      store.dispatch(checkoutCart());
      expect(store.getState().cart).toEqual({
        items: {},
        checkoutState: "LOADING",
        errorMessage: "",
      });
    });
  });
});
