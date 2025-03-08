import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import axios from "axios";
import useCategory from "../hooks/useCategory";

const TestComponent = () => {
  const categories = useCategory();
  return (
    <div>
      {categories?.length > 0
        ? categories.map((c) => (
            <div key={c._id} data-testid="category">
              {c.name}
            </div>
          ))
        : "No categories found"}
    </div>
  );
};

jest.mock("axios");

describe("useCategory hook via TestComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("fetches and displays categories successfully", async () => {
    const mockCategories = [
      { _id: "1", name: "Test Category 1", slug: "test-category-1" },
      { _id: "2", name: "Test Category 2", slug: "test-category-2" },
    ];

    axios.get.mockResolvedValueOnce({ data: { category: mockCategories } });

    render(<TestComponent />);

    const items = await waitFor(() => screen.getAllByTestId("category"));

    expect(items).toHaveLength(mockCategories.length);

    expect(items[0]).toHaveTextContent("Test Category 1");
    expect(items[1]).toHaveTextContent("Test Category 2");

    expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
  });

  test("fetches and displays categories successfully when there are no categories", async () => {
    const mockCategories = [];

    axios.get.mockResolvedValueOnce({ data: { category: mockCategories } });

    render(<TestComponent />);

    const items = await waitFor(() => screen.queryAllByTestId("category"));

    expect(items).toHaveLength(0);
    expect(screen.getByText("No categories found")).toBeInTheDocument();

    expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
  });

  test("fetches and displays categories successfully when null is returned", async () => {
    const mockCategories = null;

    axios.get.mockResolvedValueOnce({ data: { category: mockCategories } });

    render(<TestComponent />);

    const items = await waitFor(() => screen.queryAllByTestId("category"));

    expect(items).toHaveLength(0);
    expect(screen.getByText("No categories found")).toBeInTheDocument();

    expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
  });

  test("handles errors appropriately", async () => {
    axios.get.mockRejectedValueOnce(new Error("Simulate Error"));

    render(<TestComponent />);

    const items = await waitFor(() => screen.queryAllByTestId("category"));

    expect(items).toHaveLength(0);

    expect(screen.getByText("No categories found")).toBeInTheDocument();

    expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
  });
});
