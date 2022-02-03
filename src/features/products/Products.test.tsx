import React from "react";
import { screen, waitFor, getByRole } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithContext } from "../../test-utils";
import { Products } from "./Products";
import * as api from "../../app/api";
import mockProducts from "../../../public/products.json";

const getProductsSpy = jest.spyOn(api, "getProducts");
getProductsSpy.mockResolvedValue(mockProducts);

describe("Products component", () => {
  test("renders severeal products from mock file", async () => {
    const { debug } = renderWithContext(<Products />);
    //debug();
    await waitFor(() => expect(getProductsSpy).toHaveBeenCalledTimes(1));
    //debug();

    const articles = screen.getAllByRole("article");
    expect(articles.length).toEqual(mockProducts.length);
  });

  test("renders heading for each individual product", async () => {
    const { debug } = renderWithContext(<Products />);
    for (let product of mockProducts) {
      await screen.findByRole("heading", { name: product.name });
    }
    //debug();
  });

  test("should be able to add a banana to your cart (method 1)", async () => {
    const { store } = renderWithContext(<Products />);
    const heading = await screen.findByRole("heading", { name: /Bananas/i });
    const div = heading.parentNode;
    const button = getByRole(div as HTMLElement, "button");
    userEvent.click(button);
    expect(store.getState().cart.items).toEqual({ [mockProducts[0].id]: 1 });
    userEvent.click(button);
    userEvent.click(button);
    expect(store.getState().cart.items).toEqual({ [mockProducts[0].id]: 3 });
  });

  test("should be able to add a banana to your cart (method 2)", async () => {
    const { store } = renderWithContext(<Products />);
    const button = await screen.findByRole("button", {
      name: /bananas/i,
    });

    userEvent.click(button);
    expect(store.getState().cart.items).toEqual({ [mockProducts[0].id]: 1 });
    userEvent.click(button);
    userEvent.click(button);
    expect(store.getState().cart.items).toEqual({ [mockProducts[0].id]: 3 });
  });

  test("should be able to add a banana to your cart (method 3)", async () => {
    const { store } = renderWithContext(<Products />);
    const button = await screen.findByLabelText(/add bananas/i);

    userEvent.click(button);
    expect(store.getState().cart.items).toEqual({ [mockProducts[0].id]: 1 });
    userEvent.click(button);
    userEvent.click(button);
    expect(store.getState().cart.items).toEqual({ [mockProducts[0].id]: 3 });
  });
});
