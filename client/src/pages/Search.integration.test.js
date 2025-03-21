import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import { act } from "react-dom/test-utils";
import { MemoryRouter } from "react-router-dom";
import Search from "./Search";
import { AuthProvider } from "../context/auth";
import { CartProvider } from "../context/cart";
import { SearchProvider } from "../context/search";
import "@testing-library/jest-dom/extend-expect";
import { useNavigate } from "react-router-dom";

jest.mock("axios");
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
}));

describe("Search Component", () => {
  test("should render 'Search Results' heading", async () => {
    axios.get.mockImplementation((url) => {
      if (url === `/api/v1/product/search/test`) {
        return Promise.resolve({
          data: [],
        });
      }
      if (url === "/api/v1/category/get-category") {
        return Promise.resolve({
          data: { category: [] },
        });
      }
      return Promise.reject(new Error("Not Found"));
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <CartProvider>
              <SearchProvider>
                <Search />
              </SearchProvider>
            </CartProvider>
          </AuthProvider>
        </MemoryRouter>
      );
    });

    expect(screen.getByText("Search Results")).toBeInTheDocument();
  });

  test("should display empty message when no products are found", async () => {
    axios.get.mockImplementation((url) => {
      if (url === `/api/v1/product/search/test`) {
        return Promise.resolve({
          data: [],
        });
      }
      if (url === "/api/v1/category/get-category") {
        return Promise.resolve({
          data: {
            category: [],
          },
        });
      }
      return Promise.reject(new Error("Not Found"));
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <CartProvider>
              <SearchProvider>
                <Search />
              </SearchProvider>
            </CartProvider>
          </AuthProvider>
        </MemoryRouter>
      );
    });

    const input = screen.getByPlaceholderText("Search");
    fireEvent.change(input, { target: { value: "test" } });

    const submitButton = screen.getByRole("button", { name: "Search" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("No Products Found")).toBeInTheDocument();
    });
  });

  test("should display the correct products found", async () => {
    const mockResults = [
      {
        _id: "1",
        name: "Test Product 1",
        description: "Description for Test Product 1",
        price: 30,
        slug: "test-product-1",
      },
      {
        _id: "2",
        name: "Test Product 2",
        description: "Description for Test Product 2",
        price: 40,
        slug: "test-product-2",
      },
    ];

    axios.get.mockImplementation((url) => {
      if (url === `/api/v1/product/search/test`) {
        return Promise.resolve({
          data: mockResults,
        });
      }
      if (url === "/api/v1/category/get-category") {
        return Promise.resolve({
          data: { category: [] },
        });
      }
      return Promise.reject(new Error("Not Found"));
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <CartProvider>
              <SearchProvider>
                <Search />
              </SearchProvider>
            </CartProvider>
          </AuthProvider>
        </MemoryRouter>
      );
    });

    const input = screen.getByPlaceholderText("Search");
    fireEvent.change(input, { target: { value: "test" } });

    const submitButton = screen.getByRole("button", { name: "Search" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(`/api/v1/product/search/test`);

      expect(screen.getByText("Test Product 1")).toBeInTheDocument();
      expect(screen.getByText("Test Product 2")).toBeInTheDocument();
      expect(screen.getByText("Found 2")).toBeInTheDocument();
    });
  });

  test("should render product details correctly", async () => {
    const mockResults = [
      {
        _id: "1",
        name: "Test Product 1",
        description: "Description 1",
        price: 30,
        slug: "test-product-1",
      },
    ];

    axios.get.mockImplementation((url) => {
      if (url === `/api/v1/product/search/test`) {
        return Promise.resolve({
          data: mockResults,
        });
      }
      if (url === "/api/v1/category/get-category") {
        return Promise.resolve({
          data: { category: [] },
        });
      }
      return Promise.reject(new Error("Not Found"));
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <CartProvider>
              <SearchProvider>
                <Search />
              </SearchProvider>
            </CartProvider>
          </AuthProvider>
        </MemoryRouter>
      );
    });

    const input = screen.getByPlaceholderText("Search");
    fireEvent.change(input, { target: { value: "test" } });

    const submitButton = screen.getByRole("button", { name: "Search" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(`/api/v1/product/search/test`);

      expect(screen.getByText("Test Product 1")).toBeInTheDocument();
      expect(screen.getByText("Description 1...")).toBeInTheDocument();
      expect(screen.getByText("$ 30")).toBeInTheDocument();
    });
  });

  test("should navigate to product details page when 'More Details' button is clicked", async () => {
    const mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);

    const mockResults = [
      {
        _id: "1",
        name: "Test Product 1",
        description: "Description 1",
        price: 30,
        slug: "test-product-1",
      },
    ];

    axios.get.mockImplementation((url) => {
      if (url === `/api/v1/product/search/test`) {
        return Promise.resolve({
          data: mockResults,
        });
      }
      if (url === "/api/v1/category/get-category") {
        return Promise.resolve({
          data: { category: [] },
        });
      }
      return Promise.reject(new Error("Not Found"));
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <CartProvider>
              <SearchProvider>
                <Search />
              </SearchProvider>
            </CartProvider>
          </AuthProvider>
        </MemoryRouter>
      );
    });

    const input = screen.getByPlaceholderText("Search");
    fireEvent.change(input, { target: { value: "test" } });

    const submitButton = screen.getByRole("button", { name: "Search" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      const moreDetailsButton = screen.getByText("More Details");
      fireEvent.click(moreDetailsButton);

      expect(mockNavigate).toHaveBeenCalledWith("/product/test-product-1");
    });
  });
});
