import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CategoryForm from "./CategoryForm";
import "@testing-library/jest-dom/extend-expect";

describe("CategoryForm", () => {
  const mockHandleSubmit = jest.fn();
  const mockSetValue = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders input and submit button", () => {
    render(
      <CategoryForm
        handleSubmit={mockHandleSubmit}
        value=""
        setValue={mockSetValue}
      />
    );

    const input = screen.getByPlaceholderText("Enter new category");
    expect(input).toBeInTheDocument();

    const button = screen.getByText("Submit");
    expect(button).toBeInTheDocument();
  });

  test("handles input change", () => {
    render(
      <CategoryForm
        handleSubmit={mockHandleSubmit}
        value=""
        setValue={mockSetValue}
      />
    );

    const input = screen.getByPlaceholderText("Enter new category");
    fireEvent.change(input, { target: { value: "New Category" } });

    expect(mockSetValue).toHaveBeenCalledWith("New Category");
  });

  test("calls handleSubmit on form submission", () => {
    render(
      <CategoryForm
        handleSubmit={mockHandleSubmit}
        value="Test Category"
        setValue={mockSetValue}
      />
    );

    const form = screen.getByTestId("category-form");
    fireEvent.submit(form);

    expect(mockHandleSubmit).toHaveBeenCalledTimes(1);
  });

  test("displays input value correctly", () => {
    render(
      <CategoryForm
        handleSubmit={mockHandleSubmit}
        value="Test Category"
        setValue={mockSetValue}
      />
    );

    const input = screen.getByPlaceholderText("Enter new category");
    expect(input.value).toBe("Test Category");
  });
});
