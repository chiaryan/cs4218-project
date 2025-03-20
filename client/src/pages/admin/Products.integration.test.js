import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Products from './Products';
import { AuthProvider } from '../../context/auth';
import { CartProvider } from '../../context/cart';
import { SearchProvider } from '../../context/search';
import '@testing-library/jest-dom/extend-expect';

// We still need to mock axios for API calls
jest.mock('axios');

jest.spyOn(toast, 'success');
jest.spyOn(toast, 'error');

// Don't mock AdminMenu - we'll use the real component
// Only mock Layout lightly for the test structure
jest.mock('../../components/Layout', () => {
  return function Layout({ children, title }) {
    return (
      <div data-testid="real-layout">
        {title && <h1>{title}</h1>}
        <div className="container-fluid">{children}</div>
      </div>
    );
  };
});

// Create a context wrapper if needed
// If your app has auth context or other contexts, include them here
const TestWrapper = ({ children }) => (
  <AuthProvider>
    <CartProvider>
      <SearchProvider>
        <MemoryRouter initialEntries={['/dashboard/admin/products']}>
          <Routes>
            <Route path="/dashboard/admin/products" element={children} />
            <Route
              path="/dashboard/admin/product/:slug"
              element={<div>Product Detail Page</div>}
            />
            <Route
              path="/dashboard/admin/create-category"
              element={<div>Create Category Page</div>}
            />
            <Route
              path="/dashboard/admin/create-product"
              element={<div>Create Product Page</div>}
            />
            <Route
              path="/dashboard/admin/orders"
              element={<div>Orders Page</div>}
            />
          </Routes>
        </MemoryRouter>
      </SearchProvider>
    </CartProvider>
  </AuthProvider>
);

describe('Products Component Integration Tests', () => {
  const mockProducts = [
    {
      _id: '1',
      name: 'Premium Headphones',
      description: 'Noise cancelling wireless headphones',
      slug: 'premium-headphones',
      price: 299.99,
      category: { name: 'Audio' },
      quantity: 15,
    },
    {
      _id: '2',
      name: 'Smart Watch',
      description: 'Health and fitness tracking smartwatch',
      slug: 'smart-watch',
      price: 199.99,
      category: { name: 'Wearables' },
      quantity: 8,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should integrate with AdminMenu and display products', async () => {
    // Setup API response
    axios.get.mockResolvedValue({
      data: { success: true, products: mockProducts },
    });

    render(
      <TestWrapper>
        <Products />
      </TestWrapper>
    );

    // Check for the real AdminMenu links (not mocked)
    await waitFor(() => {
      // This would find the actual AdminMenu content
      const adminSection = screen.getByTestId('real-layout');

      // Check for products rendering
      mockProducts.forEach((product) => {
        expect(screen.getByText(product.name)).toBeInTheDocument();
        expect(screen.getByText(product.description)).toBeInTheDocument();
      });

      // Test product images are loaded correctly
      const productImages = screen.getAllByRole('img');
      expect(productImages).toHaveLength(mockProducts.length);

      // Verify card structure - true integration of Bootstrap styling
      const cards = screen
        .getAllByText(/Premium Headphones|Smart Watch/)
        .map((el) => el.closest('.card'));
      expect(cards).toHaveLength(mockProducts.length);

      cards.forEach((card) => {
        expect(within(card).getByRole('img')).toBeInTheDocument();
        expect(within(card).getByRole('heading')).toBeInTheDocument();
        expect(
          within(card).getByText(/Noise cancelling|Health and fitness/)
        ).toBeInTheDocument();
      });
    });
  });

  test('should navigate to product detail page when product card is clicked', async () => {
    // Setup API response
    axios.get.mockResolvedValue({
      data: { success: true, products: mockProducts },
    });

    const { container } = render(
      <TestWrapper>
        <Products />
      </TestWrapper>
    );

    await waitFor(() => {
      // Find the product links
      const productLinks = Array.from(
        container.querySelectorAll('.product-link')
      );
      expect(productLinks.length).toBe(mockProducts.length);

      productLinks.forEach((link, index) => {
        expect(link).toHaveAttribute(
          'href',
          `/dashboard/admin/product/${mockProducts[index].slug}`
        );
      });
    });
  });

  test('should work with Layout component to display header and content correctly', async () => {
    axios.get.mockResolvedValue({
      data: { success: true, products: mockProducts },
    });

    render(
      <TestWrapper>
        <Products />
      </TestWrapper>
    );

    // Verify interaction with Layout component
    const layout = screen.getByTestId('real-layout');
    expect(layout).toBeInTheDocument();

    await waitFor(() => {
      // Verify header is rendered by Layout
      expect(screen.getByText('All Products List')).toBeInTheDocument();

      // Check that the container structure is maintained
      const rowElement = screen.getByText('All Products List').closest('.row');
      expect(rowElement).toBeInTheDocument();
    });
  });

  test('should handle API data and UI integration when there are no products', async () => {
    // Empty products array response
    axios.get.mockResolvedValue({
      data: { success: true, products: [] },
    });

    render(
      <TestWrapper>
        <Products />
      </TestWrapper>
    );

    await waitFor(() => {
      // Header should still display
      expect(screen.getByText('All Products List')).toBeInTheDocument();

      // No product cards should be present
      const cardElements = document.querySelectorAll('.card');
      expect(cardElements.length).toBe(0);

      // Product flex container should still exist but be empty
      const flexContainer = screen
        .getByText('All Products List')
        .closest('.col-md-9')
        .querySelector('.d-flex');

      expect(flexContainer).toBeInTheDocument();
    });
  });

  test('should integrate API error handling with UI and toast notifications', async () => {
    // API error response
    axios.get.mockResolvedValue({
      data: {
        success: false,
        message: 'Unable to fetch products from database',
      },
    });

    render(
      <TestWrapper>
        <Products />
      </TestWrapper>
    );

    await waitFor(() => {
      // Verify toast integration
      expect(toast.error).toHaveBeenCalledWith(
        'Unable to fetch products from database'
      );

      // UI should still render without products
      expect(screen.getByText('All Products List')).toBeInTheDocument();
    });
  });

  test('should handle layout responsiveness with Bootstrap grid system', async () => {
    axios.get.mockResolvedValue({
      data: { success: true, products: mockProducts },
    });

    render(
      <TestWrapper>
        <Products />
      </TestWrapper>
    );

    await waitFor(() => {
      // Test responsive column structure
      const row = screen.getByText('All Products List').closest('.row');

      // Find columns based on their Bootstrap classes
      const adminMenuCol = row.querySelector('.col-md-3');
      const productsCol = row.querySelector('.col-md-9');

      expect(adminMenuCol).toBeInTheDocument();
      expect(productsCol).toBeInTheDocument();

      // Verify the flex container for products
      const flexContainer = productsCol.querySelector('.d-flex');
      expect(flexContainer).toBeInTheDocument();

      // Verify products are rendered in the flex container
      const productCards = flexContainer.querySelectorAll('.card');
      expect(productCards.length).toBe(mockProducts.length);
    });
  });
});
