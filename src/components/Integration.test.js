// src/__tests__/Integration.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import App from '../App';
import AddItemForm from '../components/AddItemForm';
import EditItemForm from '../components/EditItemForm';
import CollectionList from '../components/CollectionList';
import ArmyBuilder from '../components/ArmyBuilder';
import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Full Application Integration Tests', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  const renderApp = (initialRoute = '/') => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <App />
      </MemoryRouter>
    );
  };

  describe('Item Management Flow', () => {
    test('complete flow: add item, view in list, edit, and delete', async () => {
      renderApp();
      
      // Start at home - should show empty collection
      expect(screen.getByText('WH40K Collection Manager')).toBeInTheDocument();
      
      // Navigate to add item
      const addButton = screen.getByRole('link', { name: /add new item/i });
      fireEvent.click(addButton);
      
      // Fill in add item form
      await waitFor(() => {
        expect(screen.getByText('Add New Item')).toBeInTheDocument();
      });
      
      fireEvent.change(screen.getByLabelText(/name/i), {
        target: { value: 'Intercessor Squad' }
      });
      fireEvent.change(screen.getByLabelText(/faction/i), {
        target: { value: 'Space Marines' }
      });
      fireEvent.change(screen.getByLabelText(/base points/i), {
        target: { value: '100' }
      });
      fireEvent.click(screen.getByLabelText(/painted/i));
      fireEvent.change(screen.getByLabelText(/notes/i), {
        target: { value: 'First squad painted' }
      });
      
      // Add enhancement
      fireEvent.change(screen.getByPlaceholderText('Enhancement Name'), {
        target: { value: 'Sergeant Upgrade' }
      });
      fireEvent.change(screen.getByPlaceholderText('Points'), {
        target: { value: '10' }
      });
      fireEvent.click(screen.getByRole('button', { name: /add$/i }));
      
      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /add item/i }));
      
      // Should navigate back to list and show item
      await waitFor(() => {
        expect(screen.getByText('Intercessor Squad')).toBeInTheDocument();
      });
      
      // Verify localStorage was updated
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'wh40kCollection',
        expect.stringContaining('Intercessor Squad')
      );
    });

    test('adds multiple items and displays them correctly', async () => {
      renderApp();
      
      // Add first item
      fireEvent.click(screen.getByRole('link', { name: /add new item/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Add New Item')).toBeInTheDocument();
      });
      
      fireEvent.change(screen.getByLabelText(/name/i), {
        target: { value: 'Necron Warriors' }
      });
      fireEvent.change(screen.getByLabelText(/faction/i), {
        target: { value: 'Necrons' }
      });
      fireEvent.change(screen.getByLabelText(/base points/i), {
        target: { value: '120' }
      });
      fireEvent.change(screen.getByLabelText(/notes/i), {
        target: { value: 'Core troops' }
      });
      fireEvent.click(screen.getByRole('button', { name: /add item/i }));
      
      // Add second item
      await waitFor(() => {
        expect(screen.getByText('Necron Warriors')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByRole('link', { name: /add new item/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Add New Item')).toBeInTheDocument();
      });
      
      fireEvent.change(screen.getByLabelText(/name/i), {
        target: { value: 'Ork Boyz' }
      });
      fireEvent.change(screen.getByLabelText(/faction/i), {
        target: { value: 'Orks' }
      });
      fireEvent.change(screen.getByLabelText(/base points/i), {
        target: { value: '80' }
      });
      fireEvent.change(screen.getByLabelText(/notes/i), {
        target: { value: 'WAAAGH!' }
      });
      fireEvent.click(screen.getByRole('button', { name: /add item/i }));
      
      // Verify both items are displayed
      await waitFor(() => {
        expect(screen.getByText('Necron Warriors')).toBeInTheDocument();
        expect(screen.getByText('Ork Boyz')).toBeInTheDocument();
      });
    });
  });

  describe('Army Building Flow', () => {
    test('builds army from collection items', async () => {
      // Setup: Add items to collection first
      const initialCollection = [
        {
          id: 1,
          name: 'Space Marine Captain',
          faction: 'Space Marines',
          basePoints: 100,
          painted: true,
          notes: 'HQ',
          enhancements: [
            { name: 'Power Sword', points: 10 },
            { name: 'Storm Shield', points: 15 }
          ]
        },
        {
          id: 2,
          name: 'Tactical Squad',
          faction: 'Space Marines',
          basePoints: 90,
          painted: false,
          notes: 'Troops',
          enhancements: []
        }
      ];
      
      localStorageMock.setItem('wh40kCollection', JSON.stringify(initialCollection));
      
      renderApp('/army-builder');
      
      // Wait for army builder to load
      await waitFor(() => {
        expect(screen.getByText('Army Builder')).toBeInTheDocument();
      });
      
      // Add Captain to army
      const addButtons = screen.getAllByRole('button', { name: /add to army/i });
      fireEvent.click(addButtons[0]);
      
      // Should show in army list
      await waitFor(() => {
        expect(screen.getByText(/Space Marine Captain - Points:/)).toBeInTheDocument();
      });
      
      // Update model count
      const modelCountInput = screen.getByLabelText('Model Count');
      fireEvent.change(modelCountInput, { target: { value: '2' } });
      
      // Add enhancement
      const powerSwordCheckbox = screen.getByLabelText('Power Sword (10 pts)');
      fireEvent.click(powerSwordCheckbox);
      
      // Points should update: (100 * 2) + 10 = 210
      expect(screen.getByText('Space Marine Captain - Points: 210')).toBeInTheDocument();
      
      // Add Tactical Squad
      fireEvent.click(addButtons[1]);
      
      // Verify localStorage is updated
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'wh40kArmyList',
        expect.any(String)
      );
    });

    test('persists army list across page refreshes', async () => {
      // Setup army list in localStorage
      const armyList = [
        {
          id: 1,
          name: 'Test Unit',
          faction: 'Test Faction',
          basePoints: 100,
          painted: true,
          notes: 'Test',
          enhancements: [],
          modelCount: 3,
          selectedEnhancements: []
        }
      ];
      
      localStorageMock.setItem('wh40kArmyList', JSON.stringify(armyList));
      localStorageMock.setItem('wh40kCollection', JSON.stringify([]));
      
      renderApp('/army-builder');
      
      // Army should be loaded from localStorage
      await waitFor(() => {
        expect(screen.getByText('Test Unit - Points: 300')).toBeInTheDocument();
      });
    });

    test('downloads army list', async () => {
      // Mock URL and download
      global.URL.createObjectURL = jest.fn(() => 'mock-url');
      global.URL.revokeObjectURL = jest.fn();
      const mockClick = jest.fn();
      const mockAnchor = { click: mockClick, href: '', download: '' };
      document.createElement = jest.fn((tagName) => {
        if (tagName === 'a') return mockAnchor;
        return {};
      });
      
      // Setup collection and army
      const collection = [{
        id: 1,
        name: 'Download Test Unit',
        faction: 'Test',
        basePoints: 50,
        painted: true,
        notes: 'Test',
        enhancements: []
      }];
      
      localStorageMock.setItem('wh40kCollection', JSON.stringify(collection));
      
      renderApp('/army-builder');
      
      // Add unit to army
      await waitFor(() => {
        expect(screen.getByText('Army Builder')).toBeInTheDocument();
      });
      
      const addButton = screen.getByRole('button', { name: /add to army/i });
      fireEvent.click(addButton);
      
      // Download button should be enabled
      await waitFor(() => {
        const downloadButton = screen.getByRole('button', { name: /download list/i });
        expect(downloadButton).not.toBeDisabled();
        fireEvent.click(downloadButton);
      });
      
      // Verify download was triggered
      expect(mockClick).toHaveBeenCalled();
      expect(mockAnchor.download).toBe('army-list.txt');
    });
  });

  describe('Data Persistence', () => {
    test('saves collection to localStorage on add', async () => {
      renderApp('/add');
      
      // Fill and submit form
      fireEvent.change(screen.getByLabelText(/name/i), {
        target: { value: 'Persistence Test' }
      });
      fireEvent.change(screen.getByLabelText(/faction/i), {
        target: { value: 'Test Faction' }
      });
      fireEvent.change(screen.getByLabelText(/base points/i), {
        target: { value: '100' }
      });
      fireEvent.change(screen.getByLabelText(/notes/i), {
        target: { value: 'Testing' }
      });
      fireEvent.click(screen.getByRole('button', { name: /add item/i }));
      
      // Check localStorage
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'wh40kCollection',
          expect.stringContaining('Persistence Test')
        );
      });
    });

    test('loads collection from localStorage on app start', () => {
      const storedCollection = [
        {
          id: 1,
          name: 'Stored Unit',
          faction: 'Stored Faction',
          basePoints: 200,
          painted: false,
          notes: 'From storage',
          enhancements: []
        }
      ];
      
      localStorageMock.setItem('wh40kCollection', JSON.stringify(storedCollection));
      
      renderApp();
      
      expect(screen.getByText('Stored Unit')).toBeInTheDocument();
      expect(localStorageMock.getItem).toHaveBeenCalledWith('wh40kCollection');
    });

    test('handles empty localStorage gracefully', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      renderApp();
      
      // Should render without errors
      expect(screen.getByText('WH40K Collection Manager')).toBeInTheDocument();
    });

    test('handles corrupted localStorage data', () => {
      localStorageMock.getItem.mockReturnValue('invalid json {[}');
      
      // Should not throw error
      expect(() => renderApp()).not.toThrow();
    });
  });

  describe('Navigation', () => {
    test('navigates between all main routes', async () => {
      renderApp();
      
      // Start at home
      expect(screen.getByText('WH40K Collection Manager')).toBeInTheDocument();
      
      // Navigate to Add Item
      fireEvent.click(screen.getByRole('link', { name: /add new item/i }));
      await waitFor(() => {
        expect(screen.getByText('Add New Item')).toBeInTheDocument();
      });
      
      // Navigate back home via Cancel
      fireEvent.click(screen.getByRole('link', { name: /cancel/i }));
      await waitFor(() => {
        expect(screen.getByText('Your Collection')).toBeInTheDocument();
      });
      
      // Navigate to Army Builder
      fireEvent.click(screen.getByRole('link', { name: /army builder/i }));
      await waitFor(() => {
        expect(screen.getByText('Army Builder')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('handles missing required fields gracefully', async () => {
      renderApp('/add');
      
      // Try to submit with empty form
      const submitButton = screen.getByRole('button', { name: /add item/i });
      
      // Form should have HTML5 validation
      const nameInput = screen.getByLabelText(/name/i);
      expect(nameInput).toHaveAttribute('required');
      
      const pointsInput = screen.getByLabelText(/base points/i);
      expect(pointsInput).toHaveAttribute('required');
    });

    test('handles invalid point values', async () => {
      renderApp('/add');
      
      const pointsInput = screen.getByLabelText(/base points/i);
      
      // Enter invalid value
      fireEvent.change(pointsInput, { target: { value: 'abc' } });
      
      // Should default to 0
      expect(pointsInput).toHaveValue(0);
    });
  });
});
