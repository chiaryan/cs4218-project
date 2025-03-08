import React from "react";
import { render, screen, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "./auth";
import axios from "axios";

jest.mock("axios");

const TestComponent = () => {
  const [auth, setAuth] = useAuth();
  return (
    <div>
      <span data-testid="user">{auth.user}</span>
      <span data-testid="token">{auth.token}</span>
      <button
        onClick={() => setAuth({ user: "newUser", token: "newToken" })}
        data-testid="setAuthButton"
      >
        Set Auth
      </button>
    </div>
  );
};

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("provides default auth state", () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    expect(screen.getByTestId("user").textContent).toBe("");
    expect(axios.defaults.headers.common["Authorization"]).toBe("");
    expect(screen.getByTestId("token").textContent).toBe("");
  });

  test("sets auth state from localStorage", () => {
    const mockAuth = { user: "testUser", token: "testToken" };
    localStorage.setItem("auth", JSON.stringify(mockAuth));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId("user").textContent).toBe("testUser");
    expect(axios.defaults.headers.common["Authorization"]).toBe("testToken");
    expect(screen.getByTestId("token").textContent).toBe("testToken");
  });

  test("setAuth updates auth state", () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    act(() => {
      screen.getByTestId("setAuthButton").click();
    });

    expect(screen.getByTestId("user").textContent).toBe("newUser");
    expect(screen.getByTestId("token").textContent).toBe("newToken");
    expect(axios.defaults.headers.common["Authorization"]).toBe("newToken");
  });
});