import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { useSearch, SearchProvider } from "./search";

const TestComponent = () => {
  const [searchState, setSearchState] = useSearch();

  return (
    <div>
      <p data-testid="keyword">{searchState.keyword}</p>
      <p data-testid="results">{searchState.results.join(", ")}</p>
      <button
        onClick={() => setSearchState({ keyword: "Search", results: ["Product 1", "Product 2"] })}
      >
        Update Search
      </button>
    </div>
  );
};

describe("SearchProvider", () => {
  describe("Initial State", () => {
    test("provides default values", () => {
      render(
        <SearchProvider>
          <TestComponent />
        </SearchProvider>
      );

      expect(screen.getByTestId("keyword").textContent).toBe("");
      expect(screen.getByTestId("results").textContent).toBe("");
    });
  });

  describe("State Updates", () => {
    test("updates context values correctly", async () => {
      render(
        <SearchProvider>
          <TestComponent />
        </SearchProvider>
      );

      screen.getByText("Update Search").click();

      await waitFor(() => {
        expect(screen.getByTestId("keyword").textContent).toBe("Search");
        expect(screen.getByTestId("results").textContent).toBe("Product 1, Product 2");
      });
    });
  });

  describe("Context Behavior", () => {
    test("has consistent state across multiple components", async () => {
      const AnotherTestComponent = () => {
        const [searchState] = useSearch();
        return <p data-testid="keyword">{searchState.keyword}</p>;
      };

      render(
        <SearchProvider>
          <TestComponent />
          <AnotherTestComponent />
        </SearchProvider>
      );

      await waitFor(() => {
        expect(screen.getAllByTestId("keyword")[0].textContent).toBe("");
        expect(screen.getAllByTestId("keyword")[1].textContent).toBe("");
      });

      screen.getByText("Update Search").click();

      await waitFor(() => {
        expect(screen.getAllByTestId("keyword")[0].textContent).toBe("Search");
        expect(screen.getAllByTestId("keyword")[1].textContent).toBe("Search");
      });
    });
  });
});
