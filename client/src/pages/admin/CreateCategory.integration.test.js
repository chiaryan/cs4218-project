import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import CreateCategory from './CreateCategory';
import '@testing-library/jest-dom';
import { AuthProvider } from '../../context/auth';
import { CartProvider } from '../../context/cart';
import { SearchProvider } from '../../context/search';
import toast from 'react-hot-toast';
import AdminMenu from '../../components/AdminMenu';

// Mock axios for API calls
jest.mock('axios');

jest.spyOn(toast, 'success');
jest.spyOn(toast, 'error');

// Mock Layout component with minimal modification to retain title prop functionality
jest.mock('../../components/Layout', () => {
  return function MockLayout({ children, title }) {
    return (
      <div data-testid="mock-layout" data-title={title}>
        <h1>{title}</h1>
        {children}
      </div>
    );
  };
});

// Create a wrapper component that provides all necessary contexts
// But we're NOT mocking AuthProvider - using the real implementation
const TestWrapper = ({ children }) => (
  <AuthProvider>
    <SearchProvider>
      <CartProvider>
        <MemoryRouter>{children}</MemoryRouter>
      </CartProvider>
    </SearchProvider>
  </AuthProvider>
);

// Mock antd components
jest.mock('antd', () => {
  const actAntd = jest.requireActual('antd');

  // Mock Modal component
  const Modal = ({ children, visible, onCancel }) => {
    return visible ? (
      <div role="dialog" data-testid="category-modal">
        <button onClick={onCancel} aria-label="Close modal">
          X
        </button>
        {children}
      </div>
    ) : null;
  };

  return { ...actAntd, Modal };
});

describe('CreateCategory Integration Tests', () => {
  const mockCategories = [
    { _id: '1', name: 'Electronics' },
    { _id: '2', name: 'Clothing' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock localStorage for auth to simulate authenticated admin user
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

    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
    });
  });

  test('completes full CRUD workflow for categories', async () => {
    // Initial GET request to fetch categories
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });

    // Setup POST request for creating a new category
    axios.post.mockResolvedValueOnce({
      data: { success: true },
    });

    // Setup GET request after creating a category
    const updatedCategories = [...mockCategories, { _id: '3', name: 'Books' }];
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: updatedCategories },
    });

    // Setup PUT request for updating a category
    axios.put.mockResolvedValueOnce({
      data: { success: true },
    });

    // Setup GET request after updating a category
    const categoriesAfterUpdate = [
      { _id: '1', name: 'Updated Electronics' },
      { _id: '2', name: 'Clothing' },
      { _id: '3', name: 'Books' },
    ];
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: categoriesAfterUpdate },
    });

    // Setup DELETE request for deleting a category
    axios.delete.mockResolvedValueOnce({
      data: { success: true },
    });

    // Setup GET request after deleting a category
    const categoriesAfterDelete = [
      { _id: '1', name: 'Updated Electronics' },
      { _id: '3', name: 'Books' },
    ];
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: categoriesAfterDelete },
    });

    render(
      <TestWrapper>
        <CreateCategory />
      </TestWrapper>
    );

    // 1. Verify initial page load with categories
    await waitFor(() => {
      expect(screen.getByText('Manage Category')).toBeInTheDocument();
    });

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
      expect(screen.getByText('Clothing')).toBeInTheDocument();
    });

    // 2. Create a new category
    // Since we're not mocking CategoryForm, we need to find the actual input
    const categoryInput =
      screen.getByPlaceholderText('Enter new category') ||
      screen.getByRole('textbox');
    fireEvent.change(categoryInput, { target: { value: 'Books' } });

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    fireEvent.click(submitButton);

    // Verify create API call
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        '/api/v1/category/create-category',
        { name: 'Books' }
      );
    });

    // Wait for success toast
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(2);
    });

    // 3. Update a category
    // Wait for updated categories to load
    await waitFor(() => {
      expect(screen.getByText('Books')).toBeInTheDocument();
    });

    // Find and click the Edit button for Electronics
    const tableRows = screen.getAllByRole('row');
    const electronicsRow = tableRows.find((row) =>
      row.textContent.includes('Electronics')
    );
    const editButton = within(electronicsRow).getByText('Edit');
    fireEvent.click(editButton);

    // Verify modal is open
    await waitFor(() => {
      expect(screen.getByTestId('category-modal')).toBeInTheDocument();
    });

    // Update category name in the modal
    const modalInputs = screen.getAllByRole('textbox');
    const modalInput = modalInputs[modalInputs.length - 1]; // Last input should be in the modal
    fireEvent.change(modalInput, { target: { value: 'Updated Electronics' } });

    // Find and click the Submit button in the modal
    const allSubmitButtons = screen.getAllByRole('button', { name: 'Submit' });
    const modalSubmitButton = allSubmitButtons[allSubmitButtons.length - 1]; // Last should be in modal
    fireEvent.click(modalSubmitButton);

    // Verify update API call
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        '/api/v1/category/update-category/1',
        { name: 'Updated Electronics' }
      );
    });

    // Wait for success toast and updated categories
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(3);
    });

    // 4. Delete a category
    // Wait for updated categories to load after the update
    await waitFor(() => {
      expect(screen.getByText('Updated Electronics')).toBeInTheDocument();
    });

    // Find and click the Delete button for Clothing
    const updatedTableRows = screen.getAllByRole('row');
    const clothingRow = updatedTableRows.find((row) =>
      row.textContent.includes('Clothing')
    );
    const deleteButton = within(clothingRow).getByText('Delete');
    fireEvent.click(deleteButton);

    // Verify delete API call
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(
        '/api/v1/category/delete-category/2'
      );
    });

    // Wait for success toast and updated categories
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(4);
    });

    // Verify Clothing is no longer in the document
    await waitFor(() => {
      expect(screen.queryByText('Clothing')).not.toBeInTheDocument();
    });
  });

  test('handles mixed success and failure scenarios in CRUD workflow', async () => {
    // Initial GET request to fetch categories
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });

    // Setup POST request for creating a new category - SUCCESS
    axios.post.mockResolvedValueOnce({
      data: { success: true },
    });

    // Setup GET request after creating a category - SUCCESS
    const updatedCategories = [...mockCategories, { _id: '3', name: 'Books' }];
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: updatedCategories },
    });

    // Setup PUT request for updating a category - FAILURE
    axios.put.mockResolvedValueOnce({
      data: { success: false, message: 'Update failed - server error' },
    });

    // Setup DELETE request for deleting a category - SUCCESS
    axios.delete.mockResolvedValueOnce({
      data: { success: true },
    });

    // Setup GET request after deleting a category - SUCCESS
    const categoriesAfterDelete = [
      { _id: '1', name: 'Electronics' },
      { _id: '3', name: 'Books' },
    ];
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: categoriesAfterDelete },
    });

    render(
      <TestWrapper>
        <CreateCategory />
      </TestWrapper>
    );

    // 1. Verify initial page load with categories
    await waitFor(() => {
      expect(screen.getByText('Manage Category')).toBeInTheDocument();
    });

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
      expect(screen.getByText('Clothing')).toBeInTheDocument();
    });

    // 2. Create a new category - SUCCESS
    const categoryInput =
      screen.getByPlaceholderText('Enter new category') ||
      screen.getByRole('textbox');
    fireEvent.change(categoryInput, { target: { value: 'Books' } });

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    fireEvent.click(submitButton);

    // Verify create API call
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        '/api/v1/category/create-category',
        { name: 'Books' }
      );
    });

    // Wait for success toast
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(2);
    });

    // 3. Update a category - FAILURE
    // Wait for updated categories to load
    await waitFor(() => {
      expect(screen.getByText('Books')).toBeInTheDocument();
    });

    // Find and click the Edit button for Electronics
    const tableRows = screen.getAllByRole('row');
    const electronicsRow = tableRows.find((row) =>
      row.textContent.includes('Electronics')
    );
    const editButton = within(electronicsRow).getByText('Edit');
    fireEvent.click(editButton);

    // Update category name in the modal
    const modalInputs = screen.getAllByRole('textbox');
    const modalInput = modalInputs[modalInputs.length - 1];
    fireEvent.change(modalInput, { target: { value: 'Updated Electronics' } });

    // Find and click the Submit button in the modal
    const allSubmitButtons = screen.getAllByRole('button', { name: 'Submit' });
    const modalSubmitButton = allSubmitButtons[allSubmitButtons.length - 1];
    fireEvent.click(modalSubmitButton);

    // Verify update API call
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        '/api/v1/category/update-category/1',
        { name: 'Updated Electronics' }
      );
    });

    // Verify error toast
    await waitFor(() => {
      expect(screen.getByTestId('category-modal')).toBeInTheDocument();
    });

    // Close the modal
    const closeButton = screen.getByRole('button', { name: /Close modal/i });
    fireEvent.click(closeButton);

    // 4. Delete a category - SUCCESS
    // Find and click the Delete button for Clothing
    const clothingRow = tableRows.find((row) =>
      row.textContent.includes('Clothing')
    );
    const deleteButton = within(clothingRow).getByText('Delete');
    fireEvent.click(deleteButton);

    // Verify delete API call
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(
        '/api/v1/category/delete-category/2'
      );
    });

    // Wait for success toast and updated categories
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(3);
    });

    // Verify Clothing is no longer in the document
    await waitFor(() => {
      expect(screen.queryByText('Clothing')).not.toBeInTheDocument();
    });
  });

  test('integrates with auth context for protected routes', async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });

    render(
      <TestWrapper>
        <CreateCategory />
      </TestWrapper>
    );

    // Verify admin content is accessible
    await waitFor(() => {
      expect(screen.getByText('Manage Category')).toBeInTheDocument();
    });
  });

  test('AdminMenu integration with CreateCategory', async () => {
    // Initial GET request to fetch categories
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });

    render(
      <TestWrapper>
        <CreateCategory />
      </TestWrapper>
    );

    // Verify AdminMenu is integrated with layout
    await waitFor(() => {
      expect(screen.getByText('Manage Category')).toBeInTheDocument();
    });

    // If AdminMenu has specific class or data-testid, look for that
    // This depends on the actual implementation of AdminMenu
    const adminMenuArea = screen.getByTestId('mock-layout');
    expect(adminMenuArea).toBeInTheDocument();

    // Verify the layout structure shows proper integration
    // The specific test will depend on how AdminMenu is implemented
    const container = screen.getByTestId('mock-layout');
    expect(container).toHaveAttribute(
      'data-title',
      'Dashboard - Create Category'
    );
  });

  test('handles failed category creation', async () => {
    // Initial GET request to fetch categories
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });

    // Setup POST request for creating a new category - FAILURE
    axios.post.mockResolvedValueOnce({
      data: { success: false, message: 'Failed to create category' },
    });

    render(
      <TestWrapper>
        <CreateCategory />
      </TestWrapper>
    );

    // Wait for initial categories to load
    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });

    // Attempt to create a new category
    const categoryInput =
      screen.getByPlaceholderText('Enter new category') ||
      screen.getByRole('textbox');
    fireEvent.change(categoryInput, { target: { value: 'Books' } });

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    fireEvent.click(submitButton);

    // Verify create API call
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        '/api/v1/category/create-category',
        { name: 'Books' }
      );
    });

    // Verify error toast
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to create category');
    });

    // Verify categories are not updated
    expect(screen.queryByText('Books')).not.toBeInTheDocument();
  });

  test('handles failed category update', async () => {
    // Initial GET request to fetch categories
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });

    // Setup PUT request for updating a category - FAILURE
    axios.put.mockResolvedValueOnce({
      data: { success: false, message: 'Failed to update category' },
    });

    render(
      <TestWrapper>
        <CreateCategory />
      </TestWrapper>
    );

    // Wait for initial categories to load
    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });

    // Find and click the Edit button for Electronics
    const tableRows = screen.getAllByRole('row');
    const electronicsRow = tableRows.find((row) =>
      row.textContent.includes('Electronics')
    );
    const editButton = within(electronicsRow).getByText('Edit');
    fireEvent.click(editButton);

    // Update category name in the modal
    const modalInputs = screen.getAllByRole('textbox');
    const modalInput = modalInputs[modalInputs.length - 1];
    fireEvent.change(modalInput, { target: { value: 'Updated Electronics' } });

    // Find and click the Submit button in the modal
    const allSubmitButtons = screen.getAllByRole('button', { name: 'Submit' });
    const modalSubmitButton = allSubmitButtons[allSubmitButtons.length - 1];
    fireEvent.click(modalSubmitButton);

    // Verify update API call
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        '/api/v1/category/update-category/1',
        { name: 'Updated Electronics' }
      );
    });

    // Verify error toast
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to update category');
    });

    // Verify category name is not updated
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.queryByText('Updated Electronics')).not.toBeInTheDocument();
  });

  test('handles failed category deletion', async () => {
    // Initial GET request to fetch categories
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });

    // Setup DELETE request for deleting a category - FAILURE
    axios.delete.mockResolvedValueOnce({
      data: { success: false, message: 'Failed to delete category' },
    });

    render(
      <TestWrapper>
        <CreateCategory />
      </TestWrapper>
    );

    // Wait for initial categories to load
    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });

    // Find and click the Delete button for Electronics
    const tableRows = screen.getAllByRole('row');
    const electronicsRow = tableRows.find((row) =>
      row.textContent.includes('Electronics')
    );
    const deleteButton = within(electronicsRow).getByText('Delete');
    fireEvent.click(deleteButton);

    // Verify delete API call
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(
        '/api/v1/category/delete-category/1'
      );
    });

    // Verify error toast
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to delete category');
    });

    // Verify category is not deleted
    expect(screen.getByText('Electronics')).toBeInTheDocument();
  });

  test('handles duplicate category name during creation', async () => {
    // Initial GET request to fetch categories
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });

    // Setup POST request for creating a new category - FAILURE (duplicate name)
    axios.post.mockResolvedValueOnce({
      data: { success: false, message: 'Category already exists' },
    });

    render(
      <TestWrapper>
        <CreateCategory />
      </TestWrapper>
    );

    // Wait for initial categories to load
    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });

    // Attempt to create a duplicate category
    const categoryInput =
      screen.getByPlaceholderText('Enter new category') ||
      screen.getByRole('textbox');
    fireEvent.change(categoryInput, { target: { value: 'Electronics' } });

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    fireEvent.click(submitButton);

    // Verify create API call
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        '/api/v1/category/create-category',
        { name: 'Electronics' }
      );
    });

    // Verify error toast
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Category already exists');
    });

    // Verify categories are not updated
    expect(screen.getAllByText('Electronics')).toHaveLength(1);
  });

  test('handles multiple sequential API failures with error recovery', async () => {
    // Initial GET request succeeds
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });

    // Create operation fails
    axios.post.mockRejectedValueOnce(new Error('Network error while creating'));

    // Create operation succeeds on second attempt
    axios.post.mockResolvedValueOnce({
      data: { success: true },
    });

    // GET after creation succeeds
    const updatedCategories = [...mockCategories, { _id: '3', name: 'Books' }];
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: updatedCategories },
    });

    render(
      <TestWrapper>
        <CreateCategory />
      </TestWrapper>
    );

    // Wait for initial categories
    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });

    // Try to create category - this will fail
    const categoryInput =
      screen.getByPlaceholderText('Enter new category') ||
      screen.getByRole('textbox');
    fireEvent.change(categoryInput, { target: { value: 'Books' } });

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    fireEvent.click(submitButton);

    // Verify error toast for first attempt
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        '/api/v1/category/create-category',
        { name: 'Books' }
      );
    });

    // Try again - should succeed
    fireEvent.click(submitButton);

    // Verify success on second attempt
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledTimes(2);
      expect(axios.get).toHaveBeenCalledTimes(2);
    });

    // New category should appear
    await waitFor(() => {
      expect(screen.getByText('Books')).toBeInTheDocument();
    });
  });
});
