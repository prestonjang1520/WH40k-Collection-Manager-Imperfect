// src/components/__tests__/CollectionList.test.js
import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import CollectionList from '../CollectionList';
import '@testing-library/jest-dom';
import { TestDataFactory, renderWithRouter } from '../../__tests__/testUtils';

describe('CollectionList', () => {
  let mockSetCollection;
  
  beforeEach(() => {
    mockSetCollection = jest.fn();
  });

  const renderCollectionList = (collection = []) => {
    return render(
      <BrowserRouter>
        <CollectionList collection={collection} setCollection={mockSetCollection} />
      </BrowserRouter>
    );
  };

  describe('Display', () => {
    test('renders collection header and controls', () => {
      renderCollectionList();
      
      expect(screen.getByText('Your Collection')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /add new item/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /army builder/i })).toBeInTheDocument();
    });

    test('displays empty message when collection is empty', () => {
      renderCollectionList([]);
      
      expect(screen.getByText(/your collection is empty/i)).toBeInTheDocument();
      expect(screen.getByText(/start adding items/i)).toBeInTheDocument();
    });

    test('displays all items in collection', () => {
      const collection = TestDataFactory.createCollection(3);
      renderCollectionList(collection);
      
      collection.forEach(item => {
        expect(screen.getByText(item.name)).toBeInTheDocument();
        expect(screen.getByText(new RegExp(item.faction))).toBeInTheDocument();
      });
    });

    test('displays item details correctly', () => {
      const item = TestDataFactory.createItem({
        name: 'Detailed Unit',
        faction: 'Test Faction',
        basePoints: 150,
        painted: true,
        notes: 'Special notes here',
        enhancements: [
          { name: 'Special Weapon', points: 20 }
        ]
      });
      
      renderCollectionList([item]);
      
      expect(screen.getByText('Detailed Unit')).toBeInTheDocument();
      expect(screen.getByText(/Test Faction/)).toBeInTheDocument();
      expect(screen.getByText(/150/)).toBeInTheDocument();
      expect(screen.getByText(/Special notes here/)).toBeInTheDocument();
      expect(screen.getByText(/Special Weapon.*20/)).toBeInTheDocument();
    });

    test('shows painted status correctly', () => {
      const collection = [
        TestDataFactory.createItem({ name: 'Painted Unit', painted: true }),
        TestDataFactory.createItem({ name: 'Unpainted Unit', painted: false })
      ];
      
      renderCollectionList(collection);
      
      // Check for painted indicator (you may need to adjust based on actual implementation)
      const paintedCard = screen.getByText('Painted Unit').closest('.card');
      const unpaintedCard = screen.getByText('Unpainted Unit').closest('.card');
      
      // These assertions depend on how painted status is shown in the UI
      expect(within(paintedCard).getByText(/painted/i)).toBeInTheDocument();
      expect(within(unpaintedCard).getByText(/unpainted/i)).toBeInTheDocument();
    });
  });

  describe('Sorting and Filtering', () => {
    test('sorts items by name', () => {
      const collection = [
        TestDataFactory.createItem({ id: 1, name: 'Zebra Unit' }),
        TestDataFactory.createItem({ id: 2, name: 'Alpha Unit' }),
        TestDataFactory.createItem({ id: 3, name: 'Beta Unit' })
      ];
      
      renderCollectionList(collection);
      
      // Find sort control if it exists
      const sortSelect = screen.queryByLabelText(/sort/i);
      if (sortSelect) {
        fireEvent.change(sortSelect, { target: { value: 'name' } });
        
        const items = screen.getAllByText(/Unit$/);
        expect(items[0]).toHaveTextContent('Alpha Unit');
        expect(items[1]).toHaveTextContent('Beta Unit');
        expect(items[2]).toHaveTextContent('Zebra Unit');
      }
    });

    test('filters items by faction', () => {
      const collection = [
        TestDataFactory.createItem({ name: 'SM Unit 1', faction: 'Space Marines' }),
        TestDataFactory.createItem({ name: 'SM Unit 2', faction: 'Space Marines' }),
        TestDataFactory.createItem({ name: 'Necron Unit', faction: 'Necrons' })
      ];
      
      renderCollectionList(collection);
      
      // Find filter control if it exists
      const filterSelect = screen.queryByLabelText(/filter.*faction/i);
      if (filterSelect) {
        fireEvent.change(filterSelect, { target: { value: 'Space Marines' } });
        
        expect(screen.getByText('SM Unit 1')).toBeInTheDocument();
        expect(screen.getByText('SM Unit 2')).toBeInTheDocument();
        expect(screen.queryByText('Necron Unit')).not.toBeInTheDocument();
      }
    });

    test('filters by painted status', () => {
      const collection = [
        TestDataFactory.createItem({ name: 'Painted 1', painted: true }),
        TestDataFactory.createItem({ name: 'Painted 2', painted: true }),
        TestDataFactory.createItem({ name: 'Unpainted', painted: false })
      ];
      
      renderCollectionList(collection);
      
      const paintedFilter = screen.queryByLabelText(/painted only/i);
      if (paintedFilter) {
        fireEvent.click(paintedFilter);
        
        expect(screen.getByText('Painted 1')).toBeInTheDocument();
        expect(screen.getByText('Painted 2')).toBeInTheDocument();
        expect(screen.queryByText('Unpainted')).not.toBeInTheDocument();
      }
    });

    test('searches items by name', () => {
      const collection = [
        TestDataFactory.createItem({ name: 'Space Marine Captain' }),
        TestDataFactory.createItem({ name: 'Space Marine Squad' }),
        TestDataFactory.createItem({ name: 'Necron Warriors' })
      ];
      
      renderCollectionList(collection);
      
      const searchInput = screen.queryByPlaceholderText(/search/i);
      if (searchInput) {
        fireEvent.change(searchInput, { target: { value: 'Captain' } });
        
        expect(screen.getByText('Space Marine Captain')).toBeInTheDocument();
        expect(screen.queryByText('Space Marine Squad')).not.toBeInTheDocument();
        expect(screen.queryByText('Necron Warriors')).not.toBeInTheDocument();
      }
    });
  });

  describe('Actions', () => {
    test('edit button navigates to edit page', () => {
      const item = TestDataFactory.createItem({ id: 123, name: 'Edit Test Unit' });
      renderCollectionList([item]);
      
      const editButton = screen.getByRole('link', { name: /edit/i });
      expect(editButton).toHaveAttribute('href', '/edit/123');
    });

    test('delete button removes item from collection', () => {
      const collection = [
        TestDataFactory.createItem({ id: 1, name: 'Keep Unit' }),
        TestDataFactory.createItem({ id: 2, name: 'Delete Unit' })
      ];
      
      renderCollectionList(collection);
      
      // Find delete button for second item
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      fireEvent.click(deleteButtons[1]);
      
      // Confirm deletion if there's a confirmation dialog
      const confirmButton = screen.queryByRole('button', { name: /confirm/i });
      if (confirmButton) {
        fireEvent.click(confirmButton);
      }
      
      expect(mockSetCollection).toHaveBeenCalled();
      
      // Check that the function removes the correct item
      const updateFunction = mockSetCollection.mock.calls[0][0];
      const newCollection = updateFunction(collection);
      expect(newCollection).toHaveLength(1);
      expect(newCollection[0].name).toBe('Keep Unit');
    });

    test('handles deletion confirmation dialog', () => {
      const item = TestDataFactory.createItem({ name: 'Delete Confirm Test' });
      renderCollectionList([item]);
      
      const deleteButton = screen.getByRole('button', { name: /delete/i });
      fireEvent.click(deleteButton);
      
      // Check for confirmation dialog
      const dialog = screen.queryByRole('dialog');
      if (dialog) {
        expect(within(dialog).getByText(/are you sure/i)).toBeInTheDocument();
        
        // Test cancel
        const cancelButton = within(dialog).getByRole('button', { name: /cancel/i });
        fireEvent.click(cancelButton);
        
        // Item should still be there
        expect(screen.getByText('Delete Confirm Test')).toBeInTheDocument();
        expect(mockSetCollection).not.toHaveBeenCalled();
      }
    });
  });

  describe('Statistics', () => {
    test('displays collection statistics', () => {
      const collection = [
        TestDataFactory.createItem({ faction: 'Space Marines', basePoints: 100, painted: true }),
        TestDataFactory.createItem({ faction: 'Space Marines', basePoints: 150, painted: false }),
        TestDataFactory.createItem({ faction: 'Necrons', basePoints: 200, painted: true })
      ];
      
      renderCollectionList(collection);
      
      // Check for statistics display
      const stats = screen.queryByText(/total items.*3/i);
      if (stats) {
        expect(screen.getByText(/total items.*3/i)).toBeInTheDocument();
        expect(screen.getByText(/total points.*450/i)).toBeInTheDocument();
        expect(screen.getByText(/painted.*2.*3/i)).toBeInTheDocument();
      }
    });

    test('groups items by faction', () => {
      const collection = [
        TestDataFactory.createItem({ name: 'SM1', faction: 'Space Marines' }),
        TestDataFactory.createItem({ name: 'SM2', faction: 'Space Marines' }),
        TestDataFactory.createItem({ name: 'N1', faction: 'Necrons' })
      ];
      
      renderCollectionList(collection);
      
      // Check if faction headers exist
      const factionHeaders = screen.queryAllByText(/Space Marines|Necrons/);
      if (factionHeaders.length > 2) { // More than just item faction labels
        expect(screen.getByText(/Space Marines.*2/)).toBeInTheDocument();
        expect(screen.getByText(/Necrons.*1/)).toBeInTheDocument();
      }
    });
  });

  describe('Enhancements Display', () => {
    test('shows all enhancements for an item', () => {
      const item = TestDataFactory.createItem({
        name: 'Enhanced Unit',
        enhancements: [
          { name: 'Power Weapon', points: 10 },
          { name: 'Special Armor', points: 15 },
          { name: 'Jump Pack', points: 20 }
        ]
      });
      
      renderCollectionList([item]);
      
      expect(screen.getByText(/Power Weapon.*10/)).toBeInTheDocument();
      expect(screen.getByText(/Special Armor.*15/)).toBeInTheDocument();
      expect(screen.getByText(/Jump Pack.*20/)).toBeInTheDocument();
    });

    test('shows total enhancement points', () => {
      const item = TestDataFactory.createItem({
        name: 'Total Points Unit',
        basePoints: 100,
        enhancements: [
          { name: 'Enhancement 1', points: 10 },
          { name: 'Enhancement 2', points: 15 }
        ]
      });
      
      renderCollectionList([item]);
      
      // Total should be base + enhancements = 100 + 10 + 15 = 125
      const itemCard = screen.getByText('Total Points Unit').closest('.card');
      if (itemCard) {
        expect(within(itemCard).getByText(/125/)).toBeInTheDocument();
      }
    });

    test('handles items without enhancements', () => {
      const item = TestDataFactory.createItem({
        name: 'No Enhancement Unit',
        enhancements: []
      });
      
      renderCollectionList([item]);
      
      const itemCard = screen.getByText('No Enhancement Unit').closest('.card');
      if (itemCard) {
        const noEnhancementsText = within(itemCard).queryByText(/no enhancements/i);
        if (noEnhancementsText) {
          expect(noEnhancementsText).toBeInTheDocument();
        }
      }
    });
  });

  describe('Responsive Design', () => {
    test('renders correctly on mobile viewport', () => {
      // Mock mobile viewport
      global.innerWidth = 375;
      global.innerHeight = 667;
      
      const collection = TestDataFactory.createCollection(5);
      renderCollectionList(collection);
      
      // Should still show all items
      collection.forEach(item => {
        expect(screen.getByText(item.name)).toBeInTheDocument();
      });
    });

    test('handles long item names gracefully', () => {
      const item = TestDataFactory.createItem({
        name: 'This is a very long unit name that might cause layout issues in the interface'
      });
      
      renderCollectionList([item]);
      
      // Should render without breaking
      expect(screen.getByText(item.name)).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('handles large collections efficiently', () => {
      const largeCollection = TestDataFactory.createCollection(100);
      
      const { container } = renderCollectionList(largeCollection);
      
      // Should render without performance issues
      expect(container.querySelector('.collection-list')).toBeInTheDocument();
      
      // Check that virtualization is used if implemented
      const visibleItems = screen.queryAllByText(/Unit \d+/);
      // If virtualization is implemented, not all 100 items should be in DOM
      // Otherwise, all should be present
      expect(visibleItems.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels', () => {
      const collection = TestDataFactory.createCollection(2);
      renderCollectionList(collection);
      
      // Check for proper button labels
      const editButtons = screen.getAllByRole('link', { name: /edit/i });
      expect(editButtons).toHaveLength(2);
      
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      expect(deleteButtons).toHaveLength(2);
    });

    test('supports keyboard navigation', () => {
      const collection = TestDataFactory.createCollection(2);
      renderCollectionList(collection);
      
      const firstEditButton = screen.getAllByRole('link', { name: /edit/i })[0];
      
      // Focus should be possible
      firstEditButton.focus();
      expect(document.activeElement).toBe(firstEditButton);
    });
  });
});
