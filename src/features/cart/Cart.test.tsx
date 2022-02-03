import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithContext, getStateWithItems } from "../../test-utils";
import { Cart } from "./Cart";
import mockedProducts from "../../../public/products.json";
import { Product } from "../../app/api";
import * as api from "../../app/api";

// jest.mock("../../app/api", () => {
//   return {
//     async getProducts() {
//       return [];
//     },
//     async checkout(items: api.CartItems = {}) {
//       const empty = Object.keys(items).length === 0;
//       if (empty) throw new Error("Must include cart items");
//       if (items.evilItem > 0) throw new Error();
//       if (items.badItem > 0) return { success: false };
//       return { success: true };
//     },
//   };
// });

const checkoutSpy = jest.spyOn(api, "checkout");

describe("Cart component", () => {
  test("should not have any items in cart at initial render", () => {
    const { debug } = renderWithContext(<Cart />);
    // debug();
    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(2);
    screen.getByText("$0.00", { selector: ".total" }); //don't expect anything becouse getByText throws an error if not found
  });

  test("should correctly render summed up total", () => {
    const firstProduct = mockedProducts[0] as Product;
    const state = getStateWithItems(
      { [firstProduct.id]: 3 },
      { [firstProduct.id]: firstProduct }
    );
    const { store } = renderWithContext(<Cart />, state);
    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(3);
    screen.getByText(`$${(firstProduct.price * 3).toFixed(2)}`, {
      selector: ".total",
    });
  });

  test("should recalculate total after quantity changed", () => {
    const firstProduct = mockedProducts[0] as Product;
    const state = getStateWithItems(
      { [firstProduct.id]: 3 },
      { [firstProduct.id]: firstProduct }
    );
    const { store } = renderWithContext(<Cart />, state);
    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(3);
    screen.getByText(`$${(firstProduct.price * 3).toFixed(2)}`, {
      selector: ".total",
    });
    const input = screen.getByLabelText(/bananas quantity/i);
    userEvent.clear(input);
    userEvent.type(input, "5", {});
    userEvent.tab();
    screen.getByText(`$${(firstProduct.price * 5).toFixed(2)}`, {
      selector: ".total",
    });
    userEvent.clear(input);
    userEvent.tab();
    screen.getByText(`$0.00`, {
      selector: ".total",
    });
  });

  test("should let user to remove items from the cart", () => {
    const firstProduct = mockedProducts[0] as Product;
    const state = getStateWithItems(
      { [firstProduct.id]: 3 },
      { [firstProduct.id]: firstProduct }
    );
    const { store } = renderWithContext(<Cart />, state);
    const button = screen.getByLabelText(/remove bananas/i);
    userEvent.click(button);
    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(2);
    screen.getByText(`$0.00`, {
      selector: ".total",
    });
  });

  //   test("should get error message when user try to checkout an empty cart", async () => {
  //     renderWithContext(<Cart />);
  //     const button = screen.getByRole("button", { name: /checkout/i });
  //     const table = screen.getByRole("table");
  //     expect(table).not.toHaveClass("checkoutLoading");
  //     userEvent.click(button);
  //     expect(table).toHaveClass("checkoutLoading");
  //     await screen.findByText(/Must include cart items/i);
  //     expect(table).toHaveClass("checkoutError");
  //   });

  test("should get error message when user try to checkout an empty cart (method 2)", async () => {
    checkoutSpy.mockRejectedValueOnce(new Error("Cart must not be empty"));
    renderWithContext(<Cart />);
    const button = screen.getByRole("button", { name: /checkout/i });
    const table = screen.getByRole("table");
    expect(table).not.toHaveClass("checkoutLoading");
    userEvent.click(button);
    expect(table).toHaveClass("checkoutLoading");
    await screen.findByText(/Cart must not be empty/i, {
      selector: ".errorBox",
    });
    expect(table).toHaveClass("checkoutError");
  });

  test("should clear items after checkout", async () => {
    checkoutSpy.mockResolvedValueOnce({ success: true });
    const firstProduct = mockedProducts[0] as Product;
    const state = getStateWithItems(
      { [firstProduct.id]: 3 },
      { [firstProduct.id]: firstProduct }
    );
    const { debug } = renderWithContext(<Cart />, state);
    let rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(3);
    const button = screen.getByRole("button", { name: /checkout/i });
    userEvent.click(button);
    await waitFor(() => {
      const table = screen.getByRole("table");
      expect(table).not.toHaveClass("checkoutLoading");
      expect(table).not.toHaveClass("checkoutError");
      expect(
        screen.getByText(`$0.00`, {
          selector: ".total",
        })
      ).toBeInTheDocument();
      rows = screen.getAllByRole("row");
      expect(rows).toHaveLength(2);
    });
  });
});
