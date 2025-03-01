import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import Categories from "./Categories";
import useCategory from "../hooks/useCategory";

jest.mock("../context/auth", () => ({
  useAuth: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../context/cart", () => ({
  useCart: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]),
}));

jest.mock("../hooks/useCategory", () => jest.fn(() => []));

describe("Categories Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should render the layout title 'All Categories'", () => {
    useCategory.mockReturnValue([]);
    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );
    expect(screen.getByText("All Categories")).toBeInTheDocument();
  });

  test("should render categories when available", () => {
    const mockCategories = [
      { _id: "1", name: "Test Catogory 1", slug: "test-category-1" },
      { _id: "2", name: "Test Catogory 2", slug: "test-category-2" },
    ];
    useCategory.mockReturnValue(mockCategories);

    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    const firstLinks = screen.getAllByRole("link", {
      name: "Test Catogory 1",
    });
    const secondLinks = screen.getAllByRole("link", {
      name: "Test Catogory 2",
    });

    expect(firstLinks[0]).toHaveAttribute("href", "/category/test-category-1");
    expect(secondLinks[0]).toHaveAttribute("href", "/category/test-category-2");
  });

  test("should render empty state when useCategory returns empty list", () => {
    useCategory.mockReturnValue([]);

    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    const testCategory = screen.queryAllByText("Test Category 1");
    expect(testCategory).toHaveLength(0);

    expect(screen.getByText("No categories found")).toBeInTheDocument();
  });

  test("should render empty state when useCategory returns null", () => {
    useCategory.mockReturnValue(null);

    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    const testCategory = screen.queryAllByText("Test Category 1");
    expect(testCategory).toHaveLength(0);

    expect(screen.getByText("No categories found")).toBeInTheDocument();
  });
});
