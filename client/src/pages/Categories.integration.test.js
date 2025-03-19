import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import Categories from "./Categories";
import { AuthProvider } from "../context/auth";
import { SearchProvider } from "../context/search";
import { CartProvider } from "../context/cart";
import "@testing-library/jest-dom/extend-expect";

jest.mock("axios");

describe("Categories", () => {
  test("should render the layout title 'All Categories'", () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <CartProvider>
            <SearchProvider>
              <Categories />
            </SearchProvider>
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText("All Categories")).toBeInTheDocument();
  });

  test("should render categories when available", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        category: [
          { _id: "1", name: "Test Category 1", slug: "test-category-1" },
          { _id: "2", name: "Test Category 2", slug: "test-category-2" },
        ],
      },
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <CartProvider>
            <SearchProvider>
              <Categories />
            </SearchProvider>
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      const firstLinks = screen.getAllByRole("link", {
        name: "Test Category 1",
      });
      const secondLinks = screen.getAllByRole("link", {
        name: "Test Category 2",
      });

      expect(firstLinks[0]).toHaveAttribute(
        "href",
        "/category/test-category-1"
      );
      expect(secondLinks[0]).toHaveAttribute(
        "href",
        "/category/test-category-2"
      );
    });
  });

  test("should render empty state when there are no categories", async () => {
    axios.get.mockResolvedValueOnce({ data: { category: [] } });

    render(
      <MemoryRouter>
        <AuthProvider>
          <CartProvider>
            <SearchProvider>
              <Categories />
            </SearchProvider>
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      const testCategory = screen.queryAllByText("Test Category 1");
      expect(testCategory).toHaveLength(0);

      expect(screen.getByText("No categories found")).toBeInTheDocument();
    });
  });

  test("should render empty state when categories is null", async () => {
    axios.get.mockResolvedValueOnce({ data: { category: null } });

    render(
      <MemoryRouter>
        <AuthProvider>
          <CartProvider>
            <SearchProvider>
              <Categories />
            </SearchProvider>
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      const testCategory = screen.queryAllByText("Test Category 1");
      expect(testCategory).toHaveLength(0);

      expect(screen.getByText("No categories found")).toBeInTheDocument();
    });
  });

  test("renders empty state when API request fails", async () => {
    axios.get.mockRejectedValueOnce(new Error("Network Error"));

    render(
      <MemoryRouter>
        <AuthProvider>
          <CartProvider>
            <SearchProvider>
              <Categories />
            </SearchProvider>
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      screen.getByText("No categories found");
      expect(screen.getByText("No categories found")).toBeInTheDocument();
    });
  });
});
