import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import CategoryProduct from "./CategoryProduct";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import { useParams } from "react-router-dom";
import { useCart } from "../context/cart";
import toast from "react-hot-toast";
import "@testing-library/jest-dom/extend-expect";

jest.mock("axios");

jest.mock("../context/cart", () => ({
  useCart: jest.fn(() => [[], jest.fn()]),
}));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: jest.fn(),
  useNavigate: () => mockNavigate,
}));

jest.mock("../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
}));

describe("CategoryProduct component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders products and category name after successful API call", async () => {
    useParams.mockReturnValue({ slug: "test-category" });

    const fakeData = {
      products: [
        {
          _id: "1",
          name: "Product 1",
          price: 100,
          description: "Product 1 description",
          slug: "product-1",
        },
        {
          _id: "2",
          name: "Product 2",
          price: 200,
          description: "Product 2 description",
          slug: "product-2",
        },
      ],
      category: { name: "Test Category" },
    };

    axios.get.mockResolvedValue({ data: fakeData });

    render(
      <MemoryRouter>
        <CategoryProduct />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        `/api/v1/product/product-category/test-category`
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Category - Test Category")).toBeInTheDocument();
      expect(screen.getByText("2 result found")).toBeInTheDocument();

      expect(screen.getByText("Product 1")).toBeInTheDocument();
      expect(screen.getByText("Product 2")).toBeInTheDocument();
      expect(screen.getByText("$100.00")).toBeInTheDocument();
      expect(screen.getByText("$200.00")).toBeInTheDocument();
    });
  });

  test('navigates to product details when "More Details" button is clicked', async () => {
    useParams.mockReturnValue({ slug: "test-category" });

    const fakeData = {
      products: [
        {
          _id: "1",
          name: "Product 1",
          price: 100,
          description: "Product 1 description",
          slug: "product-1",
        },
      ],
      category: { name: "Test Category" },
    };

    axios.get.mockResolvedValue({ data: fakeData });

    render(
      <MemoryRouter>
        <CategoryProduct />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        `/api/v1/product/product-category/test-category`
      );
    });

    await waitFor(() => {
      const moreDetailsButton = screen.getByText("More Details");
      fireEvent.click(moreDetailsButton);
      expect(mockNavigate).toHaveBeenCalledWith("/product/product-1");
    });
  });

  test("does not fetch products if slug is not provided", () => {
    useParams.mockReturnValue({});
    render(
      <MemoryRouter>
        <CategoryProduct />
      </MemoryRouter>
    );

    expect(axios.get).not.toHaveBeenCalled();
  });

  test("logs error when API call fails", async () => {
    useParams.mockReturnValue({ slug: "test-slug" });

    const error = new Error("API Error");
    axios.get.mockRejectedValue(error);

    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    render(
      <MemoryRouter>
        <CategoryProduct />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });

    expect(consoleSpy).toHaveBeenCalledWith(error);
    consoleSpy.mockRestore();
  });

  test("should add a product to the cart when the 'ADD TO CART' button is clicked", async () => {
    useParams.mockReturnValue({ slug: "test-category" });

    const fakeData = {
      products: [
        {
          _id: "1",
          name: "Product 1",
          price: 100,
          description: "Product 1 description",
          slug: "product-1",
        },
      ],
      category: { name: "Test Category" },
    };

    axios.get.mockResolvedValue({ data: fakeData });

    const mockSetCart = jest.fn();
    useCart.mockReturnValue([[], mockSetCart]);

    render(
      <MemoryRouter>
        <CategoryProduct />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        `/api/v1/product/product-category/test-category`
      );
    });

    await waitFor(() => {
      const addToCartButton = screen.getByText("ADD TO CART");
      fireEvent.click(addToCartButton);
    });

    expect(mockSetCart).toHaveBeenCalledWith([
      {
        _id: "1",
        name: "Product 1",
        price: 100,
        description: "Product 1 description",
        slug: "product-1",
      },
    ]);

    expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
  });
});
