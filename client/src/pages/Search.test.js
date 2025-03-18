import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import Search from "./Search";
import { useSearch } from "../context/search";
import { useCart } from "../context/cart";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(() => jest.fn()),
}));

jest.mock("../context/auth", () => ({
  useAuth: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../context/cart", () => ({
  useCart: jest.fn(() => [[], jest.fn()]),
}));

jest.mock("../context/search", () => ({
  useSearch: jest.fn(() => [{ results: [] }, jest.fn()]),
}));

jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
}));

jest.mock("../components/Layout", () => {
  return ({ children }) => <div>{children}</div>;
});

describe("Search Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should render 'Search Results' heading", () => {
    useSearch.mockReturnValue([{ results: [] }, jest.fn()]);

    render(
      <MemoryRouter>
        <Search />
      </MemoryRouter>
    );

    expect(screen.getByText("Search Results")).toBeInTheDocument();
  });

  test("should display empty message when no products are found", () => {
    useSearch.mockReturnValue([{ results: [] }, jest.fn()]);

    render(
      <MemoryRouter>
        <Search />
      </MemoryRouter>
    );

    expect(screen.getByText("No Products Found")).toBeInTheDocument();
  });

  test("should display the correct products found", () => {
    useSearch.mockReturnValue([
      {
        results: [
          {
            _id: "1",
            name: "Product A",
            description: "Description A",
            price: 30,
            slug: "product-a",
          },
          {
            _id: "2",
            name: "Product B",
            description: "Description B",
            price: 40,
            slug: "product-b",
          },
        ],
      },
      jest.fn(),
    ]);

    render(
      <MemoryRouter>
        <Search />
      </MemoryRouter>
    );

    expect(screen.getByText("Found 2")).toBeInTheDocument();
    expect(screen.getByText("Product A")).toBeInTheDocument();
    expect(screen.getByText("Product B")).toBeInTheDocument();
  });

  test("should render product details correctly", () => {
    useSearch.mockReturnValue([
      {
        results: [
          {
            _id: "1",
            name: "Product A",
            description: "Description A",
            price: 50,
            slug: "product-a",
          },
        ],
      },
      jest.fn(),
    ]);

    render(
      <MemoryRouter>
        <Search />
      </MemoryRouter>
    );

    expect(screen.getByText("Product A")).toBeInTheDocument();
    expect(screen.getByText("Description A...")).toBeInTheDocument();
    expect(screen.getByText("$ 50")).toBeInTheDocument();
  });

  test("should add a product to the cart when the 'ADD TO CART' button is clicked", () => {
    const mockSetCart = jest.fn();
    useCart.mockReturnValue([[], mockSetCart]);
    useSearch.mockReturnValue([
      {
        results: [
          {
            _id: "1",
            name: "Product A",
            description: "Description A",
            price: 25,
            slug: "product-a",
          },
        ],
      },
      jest.fn(),
    ]);

    render(
      <MemoryRouter>
        <Search />
      </MemoryRouter>
    );

    const addToCartButton = screen.getByText("ADD TO CART");
    fireEvent.click(addToCartButton);

    expect(mockSetCart).toHaveBeenCalledWith([
      {
        _id: "1",
        name: "Product A",
        description: "Description A",
        price: 25,
        slug: "product-a",
      },
    ]);

    expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
  });

  test("should navigate to product details when the 'More Details' button is clicked", () => {
    const mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);

    useSearch.mockReturnValue([
      {
        results: [
          {
            _id: "1",
            name: "Product A",
            description: "Description A",
            price: 60,
            slug: "product-a",
          },
        ],
      },
      jest.fn(),
    ]);

    render(
      <MemoryRouter>
        <Search />
      </MemoryRouter>
    );

    const moreDetailsButton = screen.getByText("More Details");
    fireEvent.click(moreDetailsButton);

    expect(mockNavigate).toHaveBeenCalledWith("/product/product-a");
  });
});
