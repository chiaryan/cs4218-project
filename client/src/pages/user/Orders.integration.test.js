//integration test between orders.js and usermenu.js and layout.js
//done by austin
//ai declartion: ai assistance used in this file (namely chatgpt), but prompts all made by me.
import '@testing-library/jest-dom'; 
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import {MemoryRouter } from 'react-router-dom';
import Orders from './Orders';
import axios from 'axios';


jest.mock('../../../src/context/cart', () => ({
    useCart: () => []
  }));
jest.mock('axios');
jest.mock('../../../src/styles/Header.css', () => ({}));
jest.mock('../../../src/components/Form/SearchInput', () => () => null);


jest.mock('../../../src/hooks/useCategory', () => ({
  __esModule: true,
  default: () => []
}));



let ordertest;


let Authdiv = ({children }) => {
  const {AuthProvider} = require('../../../src/context/auth');
  return <AuthProvider value={{
    setAuth: jest.fn(),
    auth: { token: "someval" },
  }}>{children}</AuthProvider>;
};

describe("Integration test for order/usermenu/layout", () => {

  afterEach(jest.clearAllMocks);
  beforeEach(() => {
    ordertest = [
        {
          _id: "ordertest",
          status: "Delivered",
          products: ["Laptop 3"],
          payment: {success: true },
          buyer: { name: "Mr CS4218" },
          createAt: "today"
        }
      ];
      axios.get.mockResolvedValue({ data:ordertest });
  });

  test("order.js integrates with the layout", async () => {
    render(
      <Authdiv>
      <MemoryRouter>
          <Orders/>
      </MemoryRouter>
      </Authdiv>
    );

    //this test for layout.js integration.
    await waitFor(() => {
        expect(document.title).toBe("Your Orders");
      });
  });

  test("order.js integrates with the usermenu", async () => {
    render(
      <Authdiv>
      <MemoryRouter>
          <Orders/>
      </MemoryRouter>
      </Authdiv>
    );



    //this test for usermenu.js integration
    const usermenuitems = ["Orders", "Dashboard", "Profile"];
    usermenuitems.forEach(text => {
    expect(screen.getByText(text)).toBeInTheDocument();
    });

  });
});
