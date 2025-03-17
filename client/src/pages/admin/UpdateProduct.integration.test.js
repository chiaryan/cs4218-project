import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import UpdateProduct from './UpdateProduct';
// Import the actual AdminMenu component
import AdminMenu from '../../components/AdminMenu';
import Layout from '../../components/Layout';
import { AuthProvider } from '../../context/auth';
import { SearchProvider } from '../../context/search';
import { CartProvider } from '../../context/cart';

// Mock axios for API calls
jest.mock('axios');

// Mock toast notifications
jest.mock('react-hot-toast', () => ({
  error: jest.fn(),
  success: jest.fn(),
  Toaster: () => <div data-testid="mock-toaster" />,
}));

// Create a wrapper component that provides all necessary contexts
const TestWrapper = ({
  children,
  initialEntries = ['/dashboard/admin/product/test-product'],
}) => (
  <AuthProvider>
    <SearchProvider>
      <CartProvider>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path="/dashboard/admin/product/:slug" element={children} />
            <Route
              path="/dashboard/admin/products"
              element={<div>Products Page</div>}
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
      </CartProvider>
    </SearchProvider>
  </AuthProvider>
);

// Minimal mocking for antd Select component
jest.mock('antd', () => {
  const actAntd = jest.requireActual('antd');
  const mockForSelect = ({
    children,
    onChange,
    value,
    placeholder,
    'data-testid': testId,
  }) => (
    <select
      data-testid={testId || placeholder?.replace(/\s+/g, '-').toLowerCase()}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {children}
    </select>
  );

  mockForSelect.Option = ({ children, value, 'data-testid': testId }) => (
    <option value={value} data-testid={testId}>
      {children}
    </option>
  );

  return { ...actAntd, Select: mockForSelect };
});

describe('UpdateProduct Integration Tests', () => {
  const mockProduct = {
    success: true,
    product: {
      _id: '123',
      name: 'Test Product',
      description: 'Test Description',
      price: 100,
      quantity: 5,
      shipping: 1,
      category: { _id: 'cat1', name: 'Category 1' },
      slug: 'test-product',
    },
  };

  const mockCategories = {
    success: true,
    category: [
      { _id: 'cat1', name: 'Category 1' },
      { _id: 'cat2', name: 'Category 2' },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock localStorage for auth
    const localStorageMock = {
      getItem: jest.fn().mockImplementation((key) => {
        if (key === 'auth') {
          return JSON.stringify({
            user: { name: 'Admin', email: 'admin@example.com', role: 1 },
            token: 'mock-token',
          });
        }
        return null;
      }),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };

    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

    // Mock URL.createObjectURL
    URL.createObjectURL = jest.fn(() => 'mocked-url');
  });

  test('integration: full product update workflow with real AdminMenu', async () => {
    // Setup API mocks for the full workflow
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/v1/product/get-product/')) {
        return Promise.resolve({ data: mockProduct });
      }
      if (url.includes('/api/v1/category/get-category')) {
        return Promise.resolve({ data: mockCategories });
      }
      return Promise.reject(new Error('Not found'));
    });

    axios.put.mockResolvedValue({
      data: {
        success: true,
        message: 'Product Updated Successfully',
      },
    });

    render(
      <TestWrapper>
        <UpdateProduct />
      </TestWrapper>
    );

    // Wait for the component to load with data
    await waitFor(() => {
      expect(screen.getByText('Update Product')).toBeInTheDocument();
    });

    // Verify AdminMenu links are rendered
    expect(screen.getByText('Create Category')).toBeInTheDocument();
    expect(screen.getByText('Create Product')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('Orders')).toBeInTheDocument();

    // Verify initial product data is loaded
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Product')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
    });

    // Modify all form inputs
    fireEvent.change(screen.getByPlaceholderText('write a name'), {
      target: { value: 'Updated Product Name' },
    });

    fireEvent.change(screen.getByPlaceholderText('write a description'), {
      target: { value: 'Updated Product Description' },
    });

    fireEvent.change(screen.getByPlaceholderText('write a Price'), {
      target: { value: '150' },
    });

    fireEvent.change(screen.getByPlaceholderText('write a quantity'), {
      target: { value: '15' },
    });

    // Change category
    const categorySelect = screen.getByTestId('select-a-category');
    fireEvent.change(categorySelect, { target: { value: 'cat2' } });

    // Change shipping
    const shippingSelect = screen.getByTestId('select-shipping-');
    fireEvent.change(shippingSelect, { target: { value: '0' } });

    // Upload a photo
    const file = new File(['test'], 'product.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByLabelText(/Upload Photo/i);
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Verify image preview updated
    await waitFor(() => {
      expect(screen.getByAltText('product_photo')).toHaveAttribute(
        'src',
        'mocked-url'
      );
    });

    // Submit form
    fireEvent.click(screen.getByText('UPDATE PRODUCT'));

    // Verify API call with correct FormData
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        '/api/v1/product/update-product/123',
        expect.any(FormData)
      );

      // Extract and verify FormData contents
      const formData = axios.put.mock.calls[0][1];
      expect(formData.get('name')).toBe('Updated Product Name');
      expect(formData.get('description')).toBe('Updated Product Description');
      expect(formData.get('price')).toBe('150');
      expect(formData.get('quantity')).toBe('15');
      expect(formData.get('category')).toBe('cat2');
      expect(formData.get('shipping')).toBe('0');
      expect(formData.get('photo')).toBeInstanceOf(File);
    });

    // Verify success message
    expect(toast.success).toHaveBeenCalledWith('Product Updated Successfully');
  });

  test('integration: navigation between admin pages using AdminMenu', async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/v1/product/get-product/')) {
        return Promise.resolve({ data: mockProduct });
      }
      if (url.includes('/api/v1/category/get-category')) {
        return Promise.resolve({ data: mockCategories });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(
      <TestWrapper>
        <UpdateProduct />
      </TestWrapper>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Update Product')).toBeInTheDocument();
    });

    // Click on "Create Category" in AdminMenu
    fireEvent.click(screen.getByText('Create Category'));

    // Verify navigation worked
    await waitFor(() => {
      expect(screen.getByText('Create Category Page')).toBeInTheDocument();
    });
  });

  test('integration: product deletion with confirmation', async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/v1/product/get-product/')) {
        return Promise.resolve({ data: mockProduct });
      }
      if (url.includes('/api/v1/category/get-category')) {
        return Promise.resolve({ data: mockCategories });
      }
      return Promise.reject(new Error('Not found'));
    });

    axios.delete.mockResolvedValue({
      data: {
        success: true,
        message: 'Product Deleted Successfully',
      },
    });

    // Mock window.prompt
    window.prompt = jest.fn().mockReturnValue('yes');

    render(
      <TestWrapper>
        <UpdateProduct />
      </TestWrapper>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Update Product')).toBeInTheDocument();
    });

    // Click delete button
    fireEvent.click(screen.getByText('DELETE PRODUCT'));

    // Verify prompt was shown
    expect(window.prompt).toHaveBeenCalledWith(
      'Are You Sure want to delete this product ? '
    );

    // Verify API call was made
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(
        '/api/v1/product/delete-product/'
      );
    });

    // Verify success message
    expect(toast.success).toHaveBeenCalledWith('Product Deleted Successfully');

    // Verify redirection after deletion
    await waitFor(() => {
      expect(screen.getByText('Products Page')).toBeInTheDocument();
    });
  });

  test('integration: canceling product deletion', async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/v1/product/get-product/')) {
        return Promise.resolve({ data: mockProduct });
      }
      if (url.includes('/api/v1/category/get-category')) {
        return Promise.resolve({ data: mockCategories });
      }
      return Promise.reject(new Error('Not found'));
    });

    // Mock window.prompt to simulate cancellation
    window.prompt = jest.fn().mockReturnValue(null);

    render(
      <TestWrapper>
        <UpdateProduct />
      </TestWrapper>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Update Product')).toBeInTheDocument();
    });

    // Click delete button
    fireEvent.click(screen.getByText('DELETE PRODUCT'));

    // Verify prompt was shown
    expect(window.prompt).toHaveBeenCalledWith(
      'Are You Sure want to delete this product ? '
    );

    // Verify API call was NOT made
    expect(axios.delete).not.toHaveBeenCalled();

    // Verify we're still on the update page
    expect(screen.getByText('Update Product')).toBeInTheDocument();
  });

  test('integration: end-to-end error flow from API to UI', async () => {
    // Setup initial load success
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/v1/product/get-product/')) {
        return Promise.resolve({ data: mockProduct });
      }
      if (url.includes('/api/v1/category/get-category')) {
        return Promise.resolve({ data: mockCategories });
      }
      return Promise.reject(new Error('Not found'));
    });

    // But update fails with server validation error
    axios.put.mockResolvedValue({
      data: {
        success: false,
        message: 'Server validation failed: Product name already exists',
      },
    });

    render(
      <TestWrapper>
        <UpdateProduct />
      </TestWrapper>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Product')).toBeInTheDocument();
    });

    // Make a change
    fireEvent.change(screen.getByPlaceholderText('write a name'), {
      target: { value: 'Existing Product Name' },
    });

    // Submit form
    fireEvent.click(screen.getByText('UPDATE PRODUCT'));

    // Verify error message
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Server validation failed: Product name already exists'
      );
    });

    // Verify we stay on the same page
    expect(screen.getByText('Update Product')).toBeInTheDocument();
  });

  test('integration: real response time delays', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        success: true,
        category: [{ _id: '1', name: 'Test Category' }],
      },
    });
    // Setup delayed responses to simulate real network conditions
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/v1/product/get-product/')) {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ data: mockProduct });
          }, 100);
        });
      }
      if (url.includes('/api/v1/category/get-category')) {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ data: mockCategories });
          }, 150);
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(
      <TestWrapper>
        <UpdateProduct />
      </TestWrapper>
    );

    // Verify layout is shown immediately
    expect(screen.getByText('Update Product')).toBeInTheDocument();

    // Verify AdminMenu is shown immediately
    expect(screen.getByText('Create Category')).toBeInTheDocument();

    // Initially, form should be empty or showing loading state
    expect(screen.queryByDisplayValue('Test Product')).not.toBeInTheDocument();

    // After waiting, product data appears
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Product')).toBeInTheDocument();
    });

    // And categories are populated
    await waitFor(() => {
      expect(screen.getByText('Category 1')).toBeInTheDocument();
    });
  });

  test('integration: handling expired authentication during product update', async () => {
    // Initial API calls succeed
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/v1/product/get-product/')) {
        return Promise.resolve({ data: mockProduct });
      }
      if (url.includes('/api/v1/category/get-category')) {
        return Promise.resolve({ data: mockCategories });
      }
      return Promise.reject(new Error('Not found'));
    });

    // But update fails with auth error
    axios.put.mockRejectedValue({
      response: {
        status: 401,
        data: { message: 'Authentication failed or token expired' },
      },
    });

    render(
      <TestWrapper>
        <UpdateProduct />
      </TestWrapper>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Product')).toBeInTheDocument();
    });

    // Make a simple change
    fireEvent.change(screen.getByPlaceholderText('write a name'), {
      target: { value: 'New Product Name' },
    });

    // Submit form
    fireEvent.click(screen.getByText('UPDATE PRODUCT'));

    // Verify error message
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Something went wrong in updating product'
      );
    });

    // We should remain on the update page
    expect(screen.getByText('Update Product')).toBeInTheDocument();
  });

  test('integration: testing form validation with empty fields', async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/v1/product/get-product/')) {
        return Promise.resolve({ data: mockProduct });
      }
      if (url.includes('/api/v1/category/get-category')) {
        return Promise.resolve({ data: mockCategories });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(
      <TestWrapper>
        <UpdateProduct />
      </TestWrapper>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Product')).toBeInTheDocument();
    });

    // Clear all fields
    fireEvent.change(screen.getByPlaceholderText('write a name'), {
      target: { value: '' },
    });
    fireEvent.change(screen.getByPlaceholderText('write a description'), {
      target: { value: '' },
    });
    fireEvent.change(screen.getByPlaceholderText('write a Price'), {
      target: { value: '' },
    });
    fireEvent.change(screen.getByPlaceholderText('write a quantity'), {
      target: { value: '' },
    });

    // Submit form
    fireEvent.click(screen.getByText('UPDATE PRODUCT'));

    // Verify API call attempts to submit even with empty data
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalled();

      // Check empty form data
      const formData = axios.put.mock.calls[0][1];
      expect(formData.get('name')).toBe('');
      expect(formData.get('description')).toBe('');
      expect(formData.get('price')).toBe('');
      expect(formData.get('quantity')).toBe('');
    });
  });

  test('integration: testing product lifecycle - load, update, then delete', async () => {
    // Initial load succeeds
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/v1/product/get-product/')) {
        return Promise.resolve({ data: mockProduct });
      }
      if (url.includes('/api/v1/category/get-category')) {
        return Promise.resolve({ data: mockCategories });
      }
      return Promise.reject(new Error('Not found'));
    });

    // Update succeeds
    axios.put.mockResolvedValue({
      data: {
        success: true,
        message: 'Product Updated Successfully',
      },
    });

    // Delete succeeds
    axios.delete.mockResolvedValue({
      data: {
        success: true,
        message: 'Product Deleted Successfully',
      },
    });

    // Mock window.prompt for deletion confirmation
    window.prompt = jest.fn().mockReturnValue('yes');

    render(
      <TestWrapper>
        <UpdateProduct />
      </TestWrapper>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Product')).toBeInTheDocument();
    });

    // Make changes to product
    fireEvent.change(screen.getByPlaceholderText('write a name'), {
      target: { value: 'Renamed Product' },
    });

    fireEvent.change(screen.getByPlaceholderText('write a Price'), {
      target: { value: '200' },
    });

    // Update product
    fireEvent.click(screen.getByText('UPDATE PRODUCT'));

    // Verify update API call
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith(
        'Product Updated Successfully'
      );
    });

    // Wait for redirect after update
    await waitFor(() => {
      expect(screen.getByText('Products Page')).toBeInTheDocument();
    });

    // Use a new render to simulate returning to the update page
    axios.get.mockClear();
    toast.success.mockClear();

    render(
      <TestWrapper>
        <UpdateProduct />
      </TestWrapper>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Update Product')).toBeInTheDocument();
    });

    // Now delete the product
    fireEvent.click(screen.getByText('DELETE PRODUCT'));

    // Verify delete API call
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(
        '/api/v1/product/delete-product/'
      );
      expect(toast.success).toHaveBeenCalledWith(
        'Product Deleted Successfully'
      );
    });

    // Wait for redirect after delete
    await waitFor(() => {
      const productsPage = screen.getAllByText('Products Page')[0];
      expect(productsPage).toBeInTheDocument();
    });
  });

  test('integration: testing multiple photo changes', async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/v1/product/get-product/')) {
        return Promise.resolve({ data: mockProduct });
      }
      if (url.includes('/api/v1/category/get-category')) {
        return Promise.resolve({ data: mockCategories });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(
      <TestWrapper>
        <UpdateProduct />
      </TestWrapper>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Update Product')).toBeInTheDocument();
    });

    // Initially should show existing product photo
    expect(screen.getByAltText('product_photo')).toHaveAttribute(
      'src',
      `/api/v1/product/product-photo/`
    );

    // Upload first photo
    const firstFile = new File(['test1'], 'product1.jpg', {
      type: 'image/jpeg',
    });
    const fileInput = screen.getByLabelText(/Upload Photo/i);
    fireEvent.change(fileInput, { target: { files: [firstFile] } });

    // Verify first photo preview updated
    await waitFor(() => {
      expect(screen.getByAltText('product_photo')).toHaveAttribute(
        'src',
        'mocked-url'
      );
      expect(screen.getByText('product1.jpg')).toBeInTheDocument();
    });

    // Upload second photo
    const secondFile = new File(['test2'], 'product2.jpg', {
      type: 'image/jpeg',
    });
    fireEvent.change(fileInput, { target: { files: [secondFile] } });

    // Verify second photo preview updated
    await waitFor(() => {
      expect(screen.getByAltText('product_photo')).toHaveAttribute(
        'src',
        'mocked-url'
      );
      expect(screen.getByText('product2.jpg')).toBeInTheDocument();
    });
  });

  test('integration: API failure during update with large payload', async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/v1/product/get-product/')) {
        return Promise.resolve({ data: mockProduct });
      }
      if (url.includes('/api/v1/category/get-category')) {
        return Promise.resolve({ data: mockCategories });
      }
      return Promise.reject(new Error('Not found'));
    });

    // Mock PUT to simulate payload too large error
    axios.put.mockRejectedValue({
      response: {
        status: 413,
        data: { message: 'Request Entity Too Large' },
      },
    });

    render(
      <TestWrapper>
        <UpdateProduct />
      </TestWrapper>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Product')).toBeInTheDocument();
    });

    // Create a large file (simulation)
    const largeFile = new File(
      [new ArrayBuffer(2 * 1024 * 1024)], // 2MB buffer
      'large-image.jpg',
      { type: 'image/jpeg' }
    );

    // Upload large file
    const fileInput = screen.getByLabelText(/Upload Photo/i);
    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    // Submit form
    fireEvent.click(screen.getByText('UPDATE PRODUCT'));

    // Verify error handling for large payloads
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Something went wrong in updating product'
      );
    });
  });
});
