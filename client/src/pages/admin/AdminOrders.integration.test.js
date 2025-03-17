import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AdminOrders from '../../pages/admin/AdminOrders';
import AdminMenu from '../../components/AdminMenu';
import { CartProvider } from '../../context/cart';
import { AuthProvider } from '../../context/auth';
import { SearchProvider } from '../../context/search';
import axios from 'axios';
import toast from 'react-hot-toast';
import '@testing-library/jest-dom';

// Mock matchMedia - Add this before any tests are run
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Keep mocking antd for simplicity as it's a UI library
jest.mock('antd', () => {
  const mockSelect = ({
    children,
    onChange,
    defaultValue,
    'data-testid': testId,
  }) => (
    <select
      data-testid={testId || 'select-status'}
      onChange={(e) => onChange(e.target.value)}
      value={defaultValue}
    >
      {children}
    </select>
  );
  mockSelect.Option = ({ children, value }) => (
    <option value={value}>{children}</option>
  );

  // Mock Badge component
  const mockBadge = ({ children, count }) => (
    <div data-testid="mock-badge" data-count={count}>
      {children}
    </div>
  );

  return {
    Select: mockSelect,
    Badge: mockBadge,
  };
});

// Mock axios for API calls
jest.mock('axios');

// Create a wrapper component that provides all necessary contexts
const TestWrapper = ({ children }) => (
  <AuthProvider>
    <SearchProvider>
      <CartProvider>
        <MemoryRouter>{children}</MemoryRouter>
      </CartProvider>
    </SearchProvider>
  </AuthProvider>
);

describe('AdminOrders Integration Tests', () => {
  const mockOrders = [
    {
      _id: 'order1',
      status: 'Processing',
      buyer: { name: 'John Doe' },
      createAt: new Date().toISOString(),
      payment: { success: true },
      products: [
        {
          _id: 'prod1',
          name: 'Laptop',
          description:
            'A great laptop with amazing features and specifications',
          price: 1000,
        },
      ],
    },
    {
      _id: 'order2',
      status: 'Not Process',
      buyer: { name: 'Jane Smith' },
      createAt: new Date().toISOString(),
      payment: { success: false },
      products: [
        {
          _id: 'prod2',
          name: 'Phone',
          description: 'A smartphone with great camera',
          price: 500,
        },
        {
          _id: 'prod3',
          name: 'Charger',
          description: 'Fast charging adapter',
          price: 50,
        },
      ],
    },
  ];

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
  });

  test('renders AdminOrders with real AdminMenu component', async () => {
    // Mock successful API response
    axios.get.mockResolvedValueOnce({ data: mockOrders });

    render(
      <TestWrapper>
        <Routes>
          <Route path="/" element={<AdminOrders />} />
          <Route
            path="/dashboard/admin/create-category"
            element={<div>Create Category Page</div>}
          />
          <Route
            path="/dashboard/admin/create-product"
            element={<div>Create Product Page</div>}
          />
          <Route
            path="/dashboard/admin/products"
            element={<div>Products Page</div>}
          />
          <Route
            path="/dashboard/admin/orders"
            element={<div>Orders Page</div>}
          />
        </Routes>
      </TestWrapper>
    );

    // Verify the page title renders
    await waitFor(() => {
      expect(screen.getByText('All Orders')).toBeInTheDocument();
    });

    // Verify that AdminMenu is present by checking for its header and links
    expect(screen.getByText('Admin Panel')).toBeInTheDocument();

    // Check for the AdminMenu links
    expect(screen.getByText('Create Category')).toBeInTheDocument();
    expect(screen.getByText('Create Product')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('Orders')).toBeInTheDocument();
  });

  test('AdminMenu navigation works correctly', async () => {
    axios.get.mockResolvedValueOnce({ data: mockOrders });

    const { container } = render(
      <TestWrapper>
        <Routes>
          <Route path="/" element={<AdminOrders />} />
          <Route
            path="/dashboard/admin/create-category"
            element={<div>Create Category Page</div>}
          />
          <Route
            path="/dashboard/admin/create-product"
            element={<div>Create Product Page</div>}
          />
          <Route
            path="/dashboard/admin/products"
            element={<div>Products Page</div>}
          />
          <Route
            path="/dashboard/admin/orders"
            element={<div>Orders Page</div>}
          />
        </Routes>
      </TestWrapper>
    );

    // Wait for the component to render
    await waitFor(() => {
      expect(screen.getByText('All Orders')).toBeInTheDocument();
    });

    // Find all NavLinks in the AdminMenu
    const createCategoryLink = screen.getByText('Create Category');

    // Click on the Create Category link
    fireEvent.click(createCategoryLink);

    // Verify navigation happened
    await waitFor(() => {
      expect(screen.getByText('Create Category Page')).toBeInTheDocument();
    });
  });

  test('fetches and displays orders with integrated components', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        success: true,
        category: [{ _id: '1', name: 'Test Category' }],
      },
    });
    axios.get.mockResolvedValueOnce({ data: mockOrders });

    render(
      <TestWrapper>
        <Routes>
          <Route path="/" element={<AdminOrders />} />
        </Routes>
      </TestWrapper>
    );

    // Verify API call was made
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/all-orders');
    });

    // Verify orders are displayed
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    expect(screen.getByText('Jane Smith')).toBeInTheDocument();

    // Verify product details
    expect(screen.getByText('Laptop')).toBeInTheDocument();
    expect(screen.getByText('Phone')).toBeInTheDocument();
    expect(screen.getByText('Charger')).toBeInTheDocument();

    // Verify prices
    expect(screen.getByText('Price : 1000')).toBeInTheDocument();
    expect(screen.getByText('Price : 500')).toBeInTheDocument();
    expect(screen.getByText('Price : 50')).toBeInTheDocument();
  });

  test('updates order status with integrated components', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        success: true,
        category: [{ _id: '1', name: 'Test Category' }],
      },
    });
    axios.get.mockResolvedValueOnce({ data: mockOrders });
    axios.put.mockResolvedValueOnce({ data: { success: true } });
    // Mock the second call to get orders (after status update)
    axios.get.mockResolvedValueOnce({ data: mockOrders });

    render(
      <TestWrapper>
        <Routes>
          <Route path="/" element={<AdminOrders />} />
        </Routes>
      </TestWrapper>
    );

    // Wait for orders to be rendered
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Find the status dropdown for the first order
    const statusDropdowns = screen.getAllByTestId('select-status');

    // Change the status
    fireEvent.change(statusDropdowns[0], { target: { value: 'Shipped' } });

    // Verify API call to update status
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        '/api/v1/auth/order-status/order1',
        { status: 'Shipped' }
      );
    });

    // Verify orders are refreshed
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(3);
    });
  });

  test('handles API errors with integrated components', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        success: true,
        category: [{ _id: '1', name: 'Test Category' }],
      },
    });
    // Mock API error
    axios.get.mockRejectedValueOnce(new Error('Failed to fetch orders'));
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    render(
      <TestWrapper>
        <Routes>
          <Route path="/" element={<AdminOrders />} />
        </Routes>
      </TestWrapper>
    );

    // Verify error is logged
    await waitFor(() => {
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    consoleLogSpy.mockRestore();
  });

  test('handles failed status update with integrated components', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        success: true,
        category: [{ _id: '1', name: 'Test Category' }],
      },
    });
    axios.get.mockResolvedValueOnce({ data: mockOrders });
    axios.put.mockResolvedValueOnce({
      data: { success: false, message: 'Failed to update status' },
    });
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    render(
      <TestWrapper>
        <Routes>
          <Route path="/" element={<AdminOrders />} />
        </Routes>
      </TestWrapper>
    );

    // Wait for orders to render
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Find the status dropdown for the first order
    const statusDropdowns = screen.getAllByTestId('select-status');

    // Change the status
    fireEvent.change(statusDropdowns[0], { target: { value: 'Shipped' } });

    // Verify error is logged
    await waitFor(() => {
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    consoleLogSpy.mockRestore();
  });

  test('handles non-API related failed status update', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        success: true,
        category: [{ _id: '1', name: 'Test Category' }],
      },
    });
    axios.get.mockResolvedValueOnce({ data: mockOrders });
    axios.put.mockRejectedValueOnce(new Error('Network Error'));
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    render(
      <TestWrapper>
        <Routes>
          <Route path="/" element={<AdminOrders />} />
        </Routes>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const statusDropdowns = screen.getAllByRole('combobox');
    fireEvent.change(statusDropdowns[0], { target: { value: 'Shipped' } });

    // Verify error is logged
    await waitFor(() => {
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    consoleLogSpy.mockRestore();
  });

  test('displays product images correctly with integrated components', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        success: true,
        category: [{ _id: '1', name: 'Test Category' }],
      },
    });
    axios.get.mockResolvedValueOnce({ data: mockOrders });

    render(
      <TestWrapper>
        <Routes>
          <Route path="/" element={<AdminOrders />} />
        </Routes>
      </TestWrapper>
    );

    // Wait for orders to render
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Check product images
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(3); // 3 products total

    // Verify image sources
    expect(images[0]).toHaveAttribute(
      'src',
      '/api/v1/product/product-photo/prod1'
    );
    expect(images[1]).toHaveAttribute(
      'src',
      '/api/v1/product/product-photo/prod2'
    );
    expect(images[2]).toHaveAttribute(
      'src',
      '/api/v1/product/product-photo/prod3'
    );
  });

  test('displays payment statuses correctly with integrated components', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        success: true,
        category: [{ _id: '1', name: 'Test Category' }],
      },
    });
    axios.get.mockResolvedValueOnce({ data: mockOrders });

    render(
      <TestWrapper>
        <Routes>
          <Route path="/" element={<AdminOrders />} />
        </Routes>
      </TestWrapper>
    );

    // Wait for orders to render
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Check payment statuses
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  test('renders correct product counts with integrated components', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        success: true,
        category: [{ _id: '1', name: 'Test Category' }],
      },
    });
    axios.get.mockResolvedValueOnce({ data: mockOrders });

    render(
      <TestWrapper>
        <Routes>
          <Route path="/" element={<AdminOrders />} />
        </Routes>
      </TestWrapper>
    );

    // Wait for orders to render
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Find cells with product quantities
    const cells = screen.getAllByRole('cell');

    // Find cells that display quantities (could be different indexes depending on table structure)
    const quantityCells = Array.from(cells).filter(
      (cell) => cell.textContent === '1' || cell.textContent === '2'
    );

    // Verify we have quantity cells (the exact number might depend on your table structure)
    expect(quantityCells.length).toBeGreaterThan(0);

    // Verify at least one cell shows "1" (for first order) and one shows "2" (for second order)
    const hasOne = quantityCells.some((cell) => cell.textContent === '1');
    const hasTwo = quantityCells.some((cell) => cell.textContent === '2');

    expect(hasOne).toBeTruthy();
    expect(hasTwo).toBeTruthy();
  });
});
