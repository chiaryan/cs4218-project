import React, { useState } from 'react';
import { render, fireEvent, waitFor, screen, getDefaultNormalizer, within, act } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import CartPage from './CartPage';
import cart, { useCart } from '../context/cart';
import DropIn from 'braintree-web-drop-in-react';
import { before } from 'node:test';
import toast from 'react-hot-toast';

const AUTH = {
  token: "token", 
  user: {
    name: "User Name",
    address: "User Address",
  }
}
// mock modules
jest.mock('axios');
jest.mock('react-hot-toast');

// mocks for contexts/hooks in Header
jest.mock('../context/cart', () => {
  const React = jest.requireActual("react");
  return {
    useCart: jest.fn(() => React.useState([])),
  };
});

jest.mock('../context/auth', () => ({
  useAuth: jest.fn(() => [AUTH, jest.fn()]) // Mock useCart hook to return null state and a mock function
}));
    
jest.mock('../context/search', () => ({
  useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]) // Mock useSearch hook to return null state and a mock function
}));  
    
jest.mock('../hooks/useCategory', () => jest.fn(() => []));

jest.mock("react-router-dom", () => {
  const originalModule = jest.requireActual("react-router-dom");
  return {
    ...originalModule,
    useNavigate: jest.fn(),
  };
});

jest.mock('braintree-web-drop-in-react', () => {
  return {
    __esModule: true,
    default: jest.fn()
  }
})


const CATEGORY = {
  _id: 'catid',
  name: 'category name'
};
const PRODUCT_1 = {
  _id: 'productid1',
  category: CATEGORY,
  name: 'product name',
  description: 'product desc',
  price: 1.00,
};
const PRODUCT_2 = {
  _id: 'productid2',
  category: CATEGORY,
  name: 'product name 2',
  description: 'product desc 2',
  price: 2.00,
};

const PRODUCT_3 = {
  _id: 'productid3',
  category: CATEGORY,
  name: 'product name 3',
  description: 'product desc 3',
  price: 3.00,
};

let mockNavigate;
beforeEach(() => {
  mockNavigate = jest.fn();
  useNavigate.mockReturnValue(mockNavigate);
  jest.clearAllMocks();

  axios.get.mockResolvedValue({
    data: {
      clientToken: 'client token'
    }
  });
});

describe('Cart Page', () => {

  beforeEach(() => {
  });

  async function renderPage() {
    const page = render(
      <MemoryRouter initialEntries={['/cart']}>
        <Routes>
          <Route path="/cart" element={<CartPage />} />
        </Routes>
      </MemoryRouter>
    );
    
    // detect page has loaded when this api call resolves
    await waitFor(async () => {
      expect(await axios.get.mock.results[0].value).toStrictEqual({
        data: {
          clientToken: 'client token'
        }
      })
    });
    return page;
  }

  it('renders correctly with no products', async () => {
    const { getByText, getByPlaceholderText } = await renderPage();

    // detect page has loaded when this api call resolves
    await waitFor(async () => expect(await axios.get.mock.results[0].value).toStrictEqual({
      data: {
        clientToken: 'client token'
      }
    }));

    expect(getByText('Hello User Name')).toBeInTheDocument()
    expect(getByText('User Address')).toBeInTheDocument()
    expect(getByText(/Your Cart Is Empty/)).toBeInTheDocument()
    expect(getByText('Total : $0.00')).toBeInTheDocument()
    expect(getByText('User Address')).toBeInTheDocument()
    

  });

  describe('When the Cart contains products', () => {
    /** @type {import('@testing-library/react').RenderResult} */
    let page;
    const dropInMock = {
      requestPaymentMethod: jest.fn().mockResolvedValue({ nonce: 'nonce' })
    };
    beforeEach(async () => {
      useCart.mockImplementationOnce(() => useState([PRODUCT_1, PRODUCT_2, PRODUCT_3]));
      page = await renderPage();
      await waitFor(() => {
        expect(DropIn).toHaveBeenCalled();
      })

      await act(() => DropIn.mock.calls[0][0].onInstance(dropInMock));
    });

    it('renders with products', async () => {
  
   
      // getbytext trims by default
      expect(page.getByText('You Have 3 items in your cart ', {normalizer: getDefaultNormalizer({trim: false})})).toBeInTheDocument()
      expect(page.getByText('Total : $6.00')).toBeInTheDocument()
      expect(page.getAllByText(/product name/).length).toBe(3)
      
    });
    
    it('When The Remove button is clicked', async () => {
      
      // delete the 1st product
      const productCard = page.getByText('product name').parentNode.parentNode;
      fireEvent.click(within(productCard).getByRole('button', {name: 'Remove'}))

      expect(page.getAllByText(/product name/).length).toBe(2)

      const productCard2 = page.getByText('product name 2').parentNode.parentNode;
      fireEvent.click(within(productCard2).getByRole('button', {name: 'Remove'}))

      expect(page.getAllByText(/product name/).length).toBe(1)

    });
    
    it('When The Make Payment button is clicked', async () => {

      axios.post.mockResolvedValueOnce({ data: { success: true } });


      fireEvent.click(page.getByRole('button', {name: 'Make Payment'}))

      await waitFor(() => {
        expect(dropInMock.requestPaymentMethod).toHaveBeenCalled();
        expect(axios.post).toHaveBeenCalledWith('/api/v1/product/braintree/payment', {
          nonce: 'nonce',
          cart: [PRODUCT_1, PRODUCT_2, PRODUCT_3]
        });
        expect(page.queryAllByText(/product name/).length).toBe(0)
      });

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/user/orders');
      expect(toast.success).toHaveBeenCalledWith('Payment Completed Successfully ');
      
    });
  });

})