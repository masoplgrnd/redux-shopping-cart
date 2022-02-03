import React from "react";
import { screen } from "@testing-library/react";

import { CartLink } from "./CartLink";
import { addToCart, updateQuantity, removeFromCart } from "./cartSlice";

import { renderWithContext, getStateWithItems } from "../../test-utils";

describe("CartLink component", () => {
  test("should contain a link", () => {
    renderWithContext(<CartLink />);
    expect(screen.getByRole("link")).toBeInTheDocument();
  });

  it("should render 'cart' when initially is empty", () => {
    renderWithContext(<CartLink />);
    expect(screen.getByText("Cart", { exact: false })).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveTextContent("Cart");
    expect(screen.getByRole("link")).not.toHaveTextContent("0");
    expect(screen.getByRole("link")).not.toHaveTextContent("1");
  });

  it("should render items number when items are present in cart", () => {
    const state = getStateWithItems({ abc: 1 });
    const { store } = renderWithContext(<CartLink />, state);
    // store.dispatch(addToCart("abc"));

    expect(screen.getByRole("link")).not.toHaveTextContent("Cart");
    expect(screen.getByRole("link")).not.toHaveTextContent("0");
    expect(screen.getByRole("link")).toHaveTextContent("1");

    store.dispatch(updateQuantity({ id: "abc", quantity: 5 }));
    expect(screen.getByRole("link")).toHaveTextContent("5");
    store.dispatch(addToCart("def"));
    expect(screen.getByRole("link")).toHaveTextContent("6");
    store.dispatch(removeFromCart("abc"));
    store.dispatch(removeFromCart("def"));
    expect(screen.getByRole("link")).toHaveTextContent("Cart");
  });
});
