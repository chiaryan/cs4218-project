import React from 'react';
import { render, fireEvent, waitFor, screen, getDefaultNormalizer, logRoles, within } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import HomePage from './HomePage';
import cart from '../context/cart';

const AUTH = {
  token: "token", 
  user: {
    name: "User Name",
    address: "User Address",
  }
}
// mock modules
jest.mock('axios');

// mocks for contexts/hooks in Header
jest.mock('../context/cart', () => ({
  useCart: jest.fn(() => [[], jest.fn()]) // Mock useAuth hook to return null state and a mock function for setAuth
}));

jest.mock('../context/auth', () => ({
  useAuth: jest.fn(() => [AUTH, jest.fn()]) // Mock useCart hook to return null state and a mock function
}));
    
jest.mock('../context/search', () => ({
  useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]) // Mock useSearch hook to return null state and a mock function
}));  
    
jest.mock('../hooks/useCategory', () => jest.fn(() => []));

const CATEGORY = {
  _id: 'catid',
  name: 'category name'
};

const CATEGORY_2 = {
  _id: 'catid2',
  name: 'category name 2'
};

const PRODUCT = {
  _id: 'productid',
  category: CATEGORY,
  name: 'product name',
  description: 'product desc',
  price: 1.00,
};

const RELATED_PRODUCT_1 = {
  _id: 'relatedproductid',
  category: CATEGORY,
  name: 'related product name',
  description: 'product desc',
  price: 2.00,
};

const RELATED_PRODUCT_2 = {
  _id: 'relatedproductid2',
  category: CATEGORY_2,
  name: 'related product name 2',
  description: 'product desc 2',
  price: 3.00,
};

const PRODUCT_4 = {
  _id: 'productid4',
  category: CATEGORY,
  name: 'product name 4',
  description: 'product desc 4',
  price: 4.00,
};

const PRODUCT_5 = {
  _id: 'productid5',
  category: CATEGORY_2,
  name: 'product name 5',
  description: 'product desc 5',
  price: 5.00,
};

const PRODUCT_6 = {
  _id: 'productid6',
  category: CATEGORY,
  name: 'product name 6',
  description: 'product desc 6',
  price: 6.00,
};

// mock mapping for axios.get
let res;


beforeAll(() => {
  axios.get.mockImplementation(async (path) => {
    const ret = res[path];
    if (ret) {
      return ret;
    }
    throw 'err';
  });
  axios.post.mockImplementation(async (path) => {
    const ret = res[path];
    if (ret) {
      return ret;
    }
    throw 'err';
  });
})

beforeEach(() => {
  jest.clearAllMocks();
  // for axios.get
  res = {
    '/api/v1/product/product-list/1': {
      data: {
        products: []
      }
    },
    '/api/v1/category/get-category': {
      data: {
        success: true,
        category: [],
      }
    },
    '/api/v1/product/product-count': {
      data: {
        total: 0
      }
    },
    // for axios.post
    '/api/v1/product/product-filters': {
      data: {
        products: [RELATED_PRODUCT_1, RELATED_PRODUCT_2]
      }
    },
  };
});

describe('Given HomePage.js', () => {
  let page;
  function renderHomePage() {
    return render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </MemoryRouter>
    );
  }
  
  describe('And has categories/objects present', () => {
    beforeEach(async () => {
      res['/api/v1/product/product-list/1'].data.products = [PRODUCT, RELATED_PRODUCT_1, RELATED_PRODUCT_2],
      res['/api/v1/category/get-category'].data.category = [CATEGORY, CATEGORY_2]
      res['/api/v1/product/product-count'].data.total = 3
      page = renderHomePage();
      // logRoles(container)
      await waitFor(() => expect(screen.getByText(PRODUCT.name)).toBeInTheDocument());
      await waitFor(() => expect(screen.getByText(CATEGORY.name)).toBeInTheDocument());
    })

    it('renders', async () => {
  
      expect(screen.getByText(RELATED_PRODUCT_2.name)).toBeInTheDocument();
      expect(screen.getByText(RELATED_PRODUCT_1.name)).toBeInTheDocument();
      expect(screen.getByText(CATEGORY.name)).toBeInTheDocument();

    });

    it('Filters By Category When checkboxes are selected', async () => {
      axios.get.mockClear();
      const checkbox = screen.getByRole('checkbox', {
        name: 'category name'
      })
      fireEvent.click(checkbox);
      await waitFor(() => {
        // wait for the number of products displayed to change to 2
        const cardWrapper = screen.getByRole('heading', { name: 'All Products' }).parentNode;
        const count = within(cardWrapper).getAllByRole('heading', { name: /product name/ });

        expect(count.length).toBe(2)
      })
      expect(axios.post).toHaveBeenCalledWith('/api/v1/product/product-filters', {
        checked: ['catid'],
        radio: [],
      })
    });

    it('Filters By Price When radio buttons are selected', async () => {
      axios.get.mockClear();
      const radio = screen.getByRole('radio', {
        name: '$0 to 19'
      })
      fireEvent.click(radio);
      await waitFor(() => {
        // wait for the number of products displayed to change to 2
        const cardWrapper = screen.getByRole('heading', { name: 'All Products' }).parentNode;
        const count = within(cardWrapper).getAllByRole('heading', { name: /product name/ });

        expect(count.length).toBe(2)
      })
      expect(axios.post).toHaveBeenCalledWith('/api/v1/product/product-filters', {
        checked: [],
        radio: [0, 19],
      })
    });
  });
  
  describe('And has no categories/objects present', () => {
    beforeEach(async () => {
      res['/api/v1/product/product-list/1'].data.products = [],
      res['/api/v1/category/get-category'].data.category = []
      res['/api/v1/product/product-count'].data.total = 0
      page = renderHomePage();
      await waitFor(() => {});
    })
    
    it('renders', async () => {
      expect(screen.getByText('Filter By Category')).toBeInTheDocument();
      // wait for all gets to resolve
    });
  })
  
  describe('And More product available', () => {
    beforeEach(async () => {
      res['/api/v1/product/product-list/1'].data.products = [PRODUCT, RELATED_PRODUCT_1, RELATED_PRODUCT_2],
      res['/api/v1/category/get-category'].data.category = [CATEGORY, CATEGORY_2]
      res['/api/v1/product/product-count'].data.total = 6
      page = renderHomePage();
      await waitFor(() => expect(screen.getByText(PRODUCT.name)).toBeInTheDocument());
      await waitFor(() => expect(screen.getByText(CATEGORY.name)).toBeInTheDocument());
    })
    
    it('renders with a button to load more', async () => {
      expect(screen.getByRole('button', { name: /Loadmore/ })).toBeInTheDocument();
    });
    
    it('loads 3 more products when the button is clicked', async () => {
      res['/api/v1/product/product-list/2'] = {
        data: {
          products: [PRODUCT_4, PRODUCT_5, PRODUCT_6]
        }
      };
      const button = screen.getByRole('button', { name: /Loadmore/ });
      fireEvent.click(button);
      await waitFor(() => {
        // wait for the number of products displayed to change to 6
        const cardWrapper = screen.getByRole('heading', { name: 'All Products' }).parentNode;
        const count = within(cardWrapper).getAllByRole('heading', { name: /product name/ });

        expect(count.length).toBe(6)
      })
      expect(axios.get).toHaveBeenCalledWith('/api/v1/product/product-list/2')
    });
  })
})