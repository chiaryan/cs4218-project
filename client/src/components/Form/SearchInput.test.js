import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SearchInput from "./SearchInput";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";

jest.mock("axios");
jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
}));
jest.mock("../../context/search", () => {
  const React = jest.requireActual("react");
  return {
    useSearch: () => React.useState({ keyword: "", results: [] }),
  };
});

describe("SearchInput", () => {
  let mockNavigate;

  beforeEach(() => {
    mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);

    jest.clearAllMocks();
  });

  test("renders search input and button", () => {
    render(<SearchInput />);

    expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();
  });

  test("updates input value correctly", async () => {
    render(<SearchInput />);

    const input = screen.getByPlaceholderText("Search");
    fireEvent.change(input, { target: { value: "Test" } });

    await waitFor(() => expect(input.value).toBe("Test"));
  });

  test("calls handleSubmit and performs the API request", async () => {
    axios.get.mockResolvedValue({ data: { items: ["item1", "item2"] } });

    render(<SearchInput />);

    const input = screen.getByPlaceholderText("Search");
    fireEvent.change(input, { target: { value: "Test" } });

    const button = screen.getByRole("button", { name: "Search" });
    fireEvent.click(button);

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/search/Test")
    );
  });

  test("navigates to /search after successful search", async () => {
    axios.get.mockResolvedValue({ data: { items: ["item1", "item2"] } });

    render(<SearchInput />);

    const input = screen.getByPlaceholderText("Search");
    fireEvent.change(input, { target: { value: "Test" } });

    const button = screen.getByRole("button", { name: "Search" });
    fireEvent.click(button);

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/search"));
  });

  test("handles API errors gracefully", async () => {
    const consoleLogSpy = jest
      .spyOn(console, "log")
      .mockImplementation(() => {});

    axios.get.mockRejectedValue(new Error("Network Error"));

    render(<SearchInput />);

    const input = screen.getByPlaceholderText("Search");
    fireEvent.change(input, { target: { value: "Test" } });

    const button = screen.getByRole("button", { name: "Search" });
    fireEvent.click(button);

    await waitFor(() => expect(axios.get).toHaveBeenCalled());

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.any(Error));

    consoleLogSpy.mockRestore();
  });

  test("does not navigate when API call fails", async () => {
    axios.get.mockRejectedValue(new Error("Network Error"));

    render(<SearchInput />);

    const input = screen.getByPlaceholderText("Search");
    fireEvent.change(input, { target: { value: "Test" } });

    const button = screen.getByRole("button", { name: "Search" });
    fireEvent.click(button);

    await waitFor(() => expect(axios.get).toHaveBeenCalled());
    
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
