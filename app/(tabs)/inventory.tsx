import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useData } from '@/contexts/DataContext';
import { InventoryItem } from '@/types';
import { Package, Plus, Search, Edit, Trash2, ShoppingCart, X } from 'lucide-react-native';

export default function InventoryScreen() {
  const { 
    inventoryItems, 
    addInventoryItem, 
    updateInventoryItem, 
    deleteInventoryItem, 
    addSale,
    isLoading 
  } = useData();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    unit_price: '',
    quantity: '',    categories: [] as string[],
    subtypes: [] as string[],
    subtype_quantities: {} as { [key: string]: number },
    subtype_prices: {} as { [key: string]: number },
    is_multi_category: false,
  });
  const [saleQuantity, setSaleQuantity] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [selectedSubtype, setSelectedSubtype] = useState('');
  const [newSubtype, setNewSubtype] = useState('');

  const filteredItems = (inventoryItems || []).filter(item =>
    item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const resetNewItem = () => {
    setNewItem({
      name: '',
      description: '',
      unit_price: '',
      quantity: '',
      categories: [],
      subtypes: [],
      subtype_quantities: {},
      subtype_prices: {},
      is_multi_category: false,
    });
    setNewSubtype('');
  };

  const handleAddSubtype = () => {
    if (newSubtype.trim()) {
      setNewItem(prev => ({
        ...prev,
        subtypes: [...prev.subtypes, newSubtype.trim()],
        subtype_quantities: {
          ...prev.subtype_quantities,
          [newSubtype.trim()]: 0
        },
        subtype_prices: {
          ...prev.subtype_prices,
          [newSubtype.trim()]: 0
        }
      }));
      setNewSubtype('');
    }
  };

  const handleRemoveSubtype = (index: number) => {
    const subtypeToRemove = newItem.subtypes[index];
    setNewItem(prev => {
      const newSubtypeQuantities = { ...prev.subtype_quantities };
      const newSubtypePrices = { ...prev.subtype_prices };
      delete newSubtypeQuantities[subtypeToRemove];
      delete newSubtypePrices[subtypeToRemove];
      
      return {
        ...prev,
        subtypes: prev.subtypes.filter((_, i) => i !== index),
        subtype_quantities: newSubtypeQuantities,
        subtype_prices: newSubtypePrices
      };
    });
  };

  const handleSubtypeQuantityChange = (subtype: string, quantity: string) => {
    const qty = parseInt(quantity) || 0;
    setNewItem(prev => ({
      ...prev,
      subtype_quantities: {
        ...prev.subtype_quantities,
        [subtype]: qty
      }
    }));
  };

  const handleSubtypePriceChange = (subtype: string, price: string) => {
    const prc = parseFloat(price) || 0;
    setNewItem(prev => ({
      ...prev,
      subtype_prices: {
        ...prev.subtype_prices,
        [subtype]: prc
      }
    }));
  };

  const handleAddItem = async () => {
    if (!newItem.name.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    if (newItem.is_multi_category) {
      if (newItem.subtypes.length === 0) {
        Alert.alert('Error', 'Please add at least one subtype for multi-category items');
        return;
      }
      // Check if all subtypes have quantities
      const hasInvalidQuantities = newItem.subtypes.some(subtype => 
        !newItem.subtype_quantities[subtype] || newItem.subtype_quantities[subtype] <= 0
      );
      if (hasInvalidQuantities) {
        Alert.alert('Error', 'Please enter valid quantities for all subtypes');
        return;
      }
    } else {
      if (!newItem.quantity) {
        Alert.alert('Error', 'Please enter a quantity');
        return;
      }
    }

    const unitPrice = newItem.unit_price ? parseFloat(newItem.unit_price) : undefined;
    
    // Calculate total quantity for multi-category items
    let totalQuantity = 0;
    if (newItem.is_multi_category) {
      totalQuantity = Object.values(newItem.subtype_quantities).reduce((sum, qty) => sum + qty, 0);
    } else {
      totalQuantity = parseInt(newItem.quantity) || 0;
    }

    if (unitPrice !== undefined && (isNaN(unitPrice) || unitPrice < 0)) {
      Alert.alert('Error', 'Please enter a valid unit price');
      return;
    }

    if (totalQuantity <= 0) {
      Alert.alert('Error', 'Total quantity must be greater than 0');
      return;
    }

    setIsSubmitting(true);
    try {
      await addInventoryItem({
        name: newItem.name.trim(),
        description: newItem.description.trim() || undefined,
        quantity: totalQuantity,
        unit_price: unitPrice,
        categories: newItem.categories,
        subtypes: newItem.subtypes,
        subtype_quantities: newItem.subtype_quantities,
        subtype_prices: newItem.subtype_prices,
        is_multi_category: newItem.is_multi_category,
      });
      
      setShowAddModal(false);
      resetNewItem();
      Alert.alert('Success', 'Item added successfully');
    } catch (error) {
      console.error('Error adding item:', error);
      Alert.alert('Error', 'Failed to add item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setNewItem({
      name: item.name,
      description: item.description || '',
      unit_price: item.unit_price?.toString() || '',
      quantity: item.quantity.toString(),
      categories: item.categories || [],
      subtypes: item.subtypes || [],
      subtype_quantities: item.subtype_quantities || {},
      subtype_prices: item.subtype_prices || {},
      is_multi_category: item.is_multi_category || false,
    });
    setShowEditModal(true);
  };

  const handleUpdateItem = async () => {
    if (!selectedItem || !newItem.name.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    if (newItem.is_multi_category) {
      if (newItem.subtypes.length === 0) {
        Alert.alert('Error', 'Please add at least one subtype for multi-category items');
        return;
      }
      // Check if all subtypes have quantities
      const hasInvalidQuantities = newItem.subtypes.some(subtype => 
        !newItem.subtype_quantities[subtype] || newItem.subtype_quantities[subtype] <= 0
      );
      if (hasInvalidQuantities) {
        Alert.alert('Error', 'Please enter valid quantities for all subtypes');
        return;
      }
    } else {
      if (!newItem.quantity) {
        Alert.alert('Error', 'Please enter a quantity');
        return;
      }
    }

    const unitPrice = newItem.unit_price ? parseFloat(newItem.unit_price) : undefined;
    
    // Calculate total quantity for multi-category items
    let totalQuantity = 0;
    if (newItem.is_multi_category) {
      totalQuantity = Object.values(newItem.subtype_quantities).reduce((sum, qty) => sum + qty, 0);
    } else {
      totalQuantity = parseInt(newItem.quantity) || 0;
    }

    if (unitPrice !== undefined && (isNaN(unitPrice) || unitPrice < 0)) {
      Alert.alert('Error', 'Please enter a valid unit price');
      return;
    }

    if (totalQuantity <= 0) {
      Alert.alert('Error', 'Total quantity must be greater than 0');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateInventoryItem(selectedItem.id, {
        name: newItem.name.trim(),
        description: newItem.description.trim() || undefined,
        quantity: totalQuantity,
        unit_price: unitPrice,
        categories: newItem.categories,
        subtypes: newItem.subtypes,
        subtype_quantities: newItem.subtype_quantities,
        subtype_prices: newItem.subtype_prices,
        is_multi_category: newItem.is_multi_category,
      });
      
      setShowEditModal(false);
      setSelectedItem(null);
      resetNewItem();
      Alert.alert('Success', 'Item updated successfully');
    } catch (error) {
      console.error('Error updating item:', error);
      Alert.alert('Error', 'Failed to update item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = (item: InventoryItem) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteInventoryItem(item.id);
              Alert.alert('Success', 'Item deleted successfully');
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert('Error', 'Failed to delete item');
            }
          },
        },
      ]
    );
  };
  const handleSale = (item: InventoryItem) => {
    setSelectedItem(item);
    setSaleQuantity('1');
    setSelectedSubtype('');
    
    // For multi-category items, don't set a default price, let user select subtype first
    if (item.is_multi_category && item.subtypes && item.subtypes.length > 0) {
      setSalePrice('');
    } else {
      setSalePrice(item.unit_price?.toString() || '');
    }
    
    setShowSaleModal(true);
  };
  const handleRecordSale = async () => {
    if (!selectedItem || !saleQuantity || !salePrice) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // For multi-category items, check if subtype is selected
    if (selectedItem.is_multi_category && selectedItem.subtypes && selectedItem.subtypes.length > 0) {
      if (!selectedSubtype) {
        Alert.alert('Error', 'Please select a subtype');
        return;
      }
    }

    const quantity = parseInt(saleQuantity);
    const price = parseFloat(salePrice);

    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    if (isNaN(price) || price < 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    // Check stock availability
    let availableStock = 0;
    if (selectedItem.is_multi_category && selectedSubtype) {
      availableStock = selectedItem.subtype_quantities?.[selectedSubtype] || 0;
    } else {
      availableStock = selectedItem.quantity;
    }

    if (quantity > availableStock) {
      Alert.alert('Error', `Not enough stock available. Available: ${availableStock}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const total = quantity * price;
        // Record the sale
      await addSale({
        total_amount: total,
        payment_method: 'cash',
        status: 'completed',
      }, [{
        inventory_item_id: selectedItem.id,
        quantity,
        unit_price: price,
        total_price: total,
        subtype: selectedItem.is_multi_category ? selectedSubtype : undefined,
      }]);
      
      // Update inventory quantities
      if (selectedItem.is_multi_category && selectedSubtype) {
        // Update subtype quantity
        const updatedSubtypeQuantities = {
          ...selectedItem.subtype_quantities,
          [selectedSubtype]: (selectedItem.subtype_quantities?.[selectedSubtype] || 0) - quantity
        };
        
        // Calculate new total quantity
        const newTotalQuantity = Object.values(updatedSubtypeQuantities).reduce((sum, qty) => sum + qty, 0);
        
        await updateInventoryItem(selectedItem.id, {
          quantity: newTotalQuantity,
          subtype_quantities: updatedSubtypeQuantities,
        });
      } else {
        // Update main quantity for non-multi-category items
        await updateInventoryItem(selectedItem.id, {
          quantity: selectedItem.quantity - quantity,
        });
      }
      
      setShowSaleModal(false);
      setSelectedItem(null);
      setSaleQuantity('');
      setSalePrice('');
      setSelectedSubtype('');
      Alert.alert('Success', 'Sale recorded successfully');
    } catch (error) {
      console.error('Error recording sale:', error);
      Alert.alert('Error', 'Failed to record sale');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubtypeSelection = (subtype: string) => {
    setSelectedSubtype(subtype);
    
    // Auto-fill the price from subtype prices if available
    if (selectedItem?.subtype_prices?.[subtype]) {
      setSalePrice(selectedItem.subtype_prices[subtype].toString());
    } else {
      setSalePrice('');
    }
  };

  const ItemCard = ({ item }: { item: InventoryItem }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        {item.description && (
          <Text style={styles.itemDescription}>{item.description}</Text>
        )}
        {item.subtypes && item.subtypes.length > 0 && (
          <View style={styles.subtypesContainer}>
            {item.subtypes.map((subtype, index) => (
              <View key={index} style={styles.subtypeBadge}>
                <Text style={styles.subtypeText}>
                  {subtype}
                  {item.subtype_quantities && item.subtype_quantities[subtype] 
                    ? ` (${item.subtype_quantities[subtype]})` 
                    : ''
                  }
                  {item.subtype_prices && item.subtype_prices[subtype] 
                    ? ` - $${item.subtype_prices[subtype].toFixed(2)}` 
                    : ''
                  }
                </Text>
              </View>
            ))}
          </View>
        )}
        <View style={styles.itemDetails}>
          <Text style={styles.itemPrice}>
            ${item.unit_price?.toFixed(2) || 'No price'}
          </Text>
          <Text style={styles.itemQuantity}>
            Stock: {item.quantity}
          </Text>
        </View>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.saleButton]}
          onPress={() => handleSale(item)}
        >
          <ShoppingCart color="white" size={16} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditItem(item)}
        >
          <Edit color="white" size={16} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteItem(item)}
        >
          <Trash2 color="white" size={16} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading inventory...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inventory</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus color="white" size={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search color="#6B7280" size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Package color="#9CA3AF" size={48} />
            <Text style={styles.emptyStateText}>No items found</Text>
            <Text style={styles.emptyStateSubtext}>
              {(inventoryItems || []).length === 0 ? 'Add your first item to get started' : 'Try adjusting your search'}
            </Text>
          </View>
        ) : (
          filteredItems.map(item => (
            <ItemCard key={item.id} item={item} />
          ))
        )}
      </ScrollView>

      {/* Add Item Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>            <Text style={styles.modalTitle}>Add New Item</Text>
            <TouchableOpacity onPress={() => {
              setShowAddModal(false);
              resetNewItem();
            }}>
              <Text style={styles.modalCloseButton}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Item Name *</Text>
              <TextInput
                style={styles.textInput}
                value={newItem.name}
                onChangeText={(text) => setNewItem({...newItem, name: text})}
                placeholder="Enter item name"
              />
            </View>

            {!newItem.is_multi_category && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Price (optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={newItem.unit_price}
                  onChangeText={(text) => setNewItem({...newItem, unit_price: text})}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description (optional)</Text>
              <TextInput
                style={styles.textInput}
                value={newItem.description}
                onChangeText={(text) => setNewItem({...newItem, description: text})}
                placeholder="Enter description"
                multiline
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.switchContainer}>
                <Text style={styles.inputLabel}>Multi-category item</Text>
                <Switch
                  value={newItem.is_multi_category}
                  onValueChange={(value) => setNewItem({...newItem, is_multi_category: value})}
                  trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                  thumbColor={newItem.is_multi_category ? '#FFFFFF' : '#9CA3AF'}
                />
              </View>
            </View>

            {newItem.is_multi_category && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Subtypes</Text>
                <View style={styles.subtypeInputContainer}>
                  <TextInput
                    style={[styles.textInput, styles.subtypeInput]}
                    value={newSubtype}
                    onChangeText={setNewSubtype}
                    placeholder="Subtype Name"
                  />
                  <TouchableOpacity
                    style={styles.addSubtypeButton}
                    onPress={handleAddSubtype}
                  >
                    <Text style={styles.addSubtypeText}>Add Subtype</Text>
                  </TouchableOpacity>
                </View>
                
                {newItem.subtypes.length > 0 && (
                  <View style={styles.subtypesContainer}>
                    {newItem.subtypes.map((subtype, index) => (
                      <View key={index} style={styles.subtypeWithQuantity}>
                        <View style={styles.subtypeChip}>
                          <Text style={styles.subtypeChipText}>{subtype}</Text>
                          <TouchableOpacity
                            onPress={() => handleRemoveSubtype(index)}
                            style={styles.removeSubtypeButton}
                          >
                            <X color="#6B7280" size={16} />
                          </TouchableOpacity>
                        </View>
                        
                        <View style={styles.subtypeQuantityContainer}>
                          <Text style={styles.subtypeQuantityLabel}>Quantity:</Text>
                          <TextInput
                            style={styles.subtypeQuantityInput}
                            value={(newItem.subtype_quantities[subtype] || 0).toString()}
                            onChangeText={(text) => handleSubtypeQuantityChange(subtype, text)}
                            placeholder="0"
                            keyboardType="number-pad"
                          />
                        </View>
                        
                        <View style={styles.subtypePriceContainer}>
                          <Text style={styles.subtypePriceLabel}>Price:</Text>
                          <TextInput
                            style={styles.subtypePriceInput}
                            value={(newItem.subtype_prices[subtype] || 0).toString()}
                            onChangeText={(text) => handleSubtypePriceChange(subtype, text)}
                            placeholder="0.00"
                            keyboardType="decimal-pad"
                          />
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {!newItem.is_multi_category && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Quantity *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newItem.quantity}
                  onChangeText={(text) => setNewItem({...newItem, quantity: text})}
                  placeholder="0"
                  keyboardType="number-pad"
                />
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleAddItem}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Plus color="white" size={20} />
                  <Text style={styles.submitButtonText}>Add Item</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Item Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>            <Text style={styles.modalTitle}>Edit Item</Text>
            <TouchableOpacity onPress={() => {
              setShowEditModal(false);
              setSelectedItem(null);
              resetNewItem();
            }}>
              <Text style={styles.modalCloseButton}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Item Name *</Text>
              <TextInput
                style={styles.textInput}
                value={newItem.name}
                onChangeText={(text) => setNewItem({...newItem, name: text})}
                placeholder="Enter item name"
              />
            </View>

            {!newItem.is_multi_category && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Price (optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={newItem.unit_price}
                  onChangeText={(text) => setNewItem({...newItem, unit_price: text})}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description (optional)</Text>
              <TextInput
                style={styles.textInput}
                value={newItem.description}
                onChangeText={(text) => setNewItem({...newItem, description: text})}
                placeholder="Enter description"
                multiline
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.switchContainer}>
                <Text style={styles.inputLabel}>Multi-category item</Text>
                <Switch
                  value={newItem.is_multi_category}
                  onValueChange={(value) => setNewItem({...newItem, is_multi_category: value})}
                  trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                  thumbColor={newItem.is_multi_category ? '#FFFFFF' : '#9CA3AF'}
                />
              </View>
            </View>

            {newItem.is_multi_category && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Subtypes</Text>
                <View style={styles.subtypeInputContainer}>
                  <TextInput
                    style={[styles.textInput, styles.subtypeInput]}
                    value={newSubtype}
                    onChangeText={setNewSubtype}
                    placeholder="Subtype Name"
                  />
                  <TouchableOpacity
                    style={styles.addSubtypeButton}
                    onPress={handleAddSubtype}
                  >
                    <Text style={styles.addSubtypeText}>Add Subtype</Text>
                  </TouchableOpacity>
                </View>
                
                {newItem.subtypes.length > 0 && (
                  <View style={styles.subtypesContainer}>
                    {newItem.subtypes.map((subtype, index) => (
                      <View key={index} style={styles.subtypeWithQuantity}>
                        <View style={styles.subtypeChip}>
                          <Text style={styles.subtypeChipText}>{subtype}</Text>
                          <TouchableOpacity
                            onPress={() => handleRemoveSubtype(index)}
                            style={styles.removeSubtypeButton}
                          >
                            <X color="#6B7280" size={16} />
                          </TouchableOpacity>
                        </View>
                        
                        <View style={styles.subtypeQuantityContainer}>
                          <Text style={styles.subtypeQuantityLabel}>Quantity:</Text>
                          <TextInput
                            style={styles.subtypeQuantityInput}
                            value={(newItem.subtype_quantities[subtype] || 0).toString()}
                            onChangeText={(text) => handleSubtypeQuantityChange(subtype, text)}
                            placeholder="0"
                            keyboardType="number-pad"
                          />
                        </View>
                        
                        <View style={styles.subtypePriceContainer}>
                          <Text style={styles.subtypePriceLabel}>Price:</Text>
                          <TextInput
                            style={styles.subtypePriceInput}
                            value={(newItem.subtype_prices[subtype] || 0).toString()}
                            onChangeText={(text) => handleSubtypePriceChange(subtype, text)}
                            placeholder="0.00"
                            keyboardType="decimal-pad"
                          />
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {!newItem.is_multi_category && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Quantity *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newItem.quantity}
                  onChangeText={(text) => setNewItem({...newItem, quantity: text})}
                  placeholder="0"
                  keyboardType="number-pad"
                />
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleUpdateItem}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Update Item</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Sale Modal */}
      <Modal
        visible={showSaleModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Record Sale</Text>            <TouchableOpacity onPress={() => {
              setShowSaleModal(false);
              setSelectedItem(null);
              setSaleQuantity('');
              setSalePrice('');
              setSelectedSubtype('');
            }}>
              <Text style={styles.modalCloseButton}>Cancel</Text>
            </TouchableOpacity>
          </View>          <ScrollView style={styles.modalContent}>
            {selectedItem && (
              <>
                <View style={styles.selectedItemInfo}>
                  <Text style={styles.selectedItemName}>{selectedItem.name}</Text>
                  <Text style={styles.selectedItemStock}>
                    Available: {selectedItem.quantity} units total
                  </Text>
                </View>

                {/* Subtype selection for multi-category items */}
                {selectedItem.is_multi_category && selectedItem.subtypes && selectedItem.subtypes.length > 0 && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Select Subtype *</Text>
                    <View style={styles.subtypeSelectionContainer}>
                      {selectedItem.subtypes.map((subtype, index) => {
                        const subtypeQuantity = selectedItem.subtype_quantities?.[subtype] || 0;
                        const subtypePrice = selectedItem.subtype_prices?.[subtype] || 0;
                        const isSelected = selectedSubtype === subtype;
                        
                        return (
                          <TouchableOpacity
                            key={index}
                            style={[
                              styles.subtypeSelectionOption,
                              isSelected && styles.subtypeSelectionOptionSelected
                            ]}
                            onPress={() => handleSubtypeSelection(subtype)}
                          >
                            <Text style={[
                              styles.subtypeSelectionText,
                              isSelected && styles.subtypeSelectionTextSelected
                            ]}>
                              {subtype}
                            </Text>
                            <Text style={[
                              styles.subtypeSelectionDetails,
                              isSelected && styles.subtypeSelectionDetailsSelected
                            ]}>
                              Stock: {subtypeQuantity} | Price: ${subtypePrice.toFixed(2)}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Quantity *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={saleQuantity}
                    onChangeText={setSaleQuantity}
                    placeholder="1"
                    keyboardType="number-pad"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Unit Price *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={salePrice}
                    onChangeText={setSalePrice}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                  />
                </View>

                {saleQuantity && salePrice && (
                  <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>Total: </Text>
                    <Text style={styles.totalAmount}>
                      ${(parseInt(saleQuantity) * parseFloat(salePrice)).toFixed(2)}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                  onPress={handleRecordSale}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>Record Sale</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  addButton: {
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 12,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  itemCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  subtypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  subtypeBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  subtypeText: {
    fontSize: 12,
    color: '#3730A3',
    fontWeight: '500',
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#6B7280',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
  },
  saleButton: {
    backgroundColor: '#10B981',
  },
  editButton: {
    backgroundColor: '#3B82F6',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalCloseButton: {
    fontSize: 16,
    color: '#3B82F6',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: 'white',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtypeInputContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  subtypeInput: {
    flex: 1,
  },
  addSubtypeButton: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addSubtypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  subtypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  subtypeChipText: {
    fontSize: 14,
    color: '#374151',
    marginRight: 6,
  },
  removeSubtypeButton: {
    padding: 2,
  },
  subtypeWithQuantity: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  subtypeQuantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  subtypeQuantityLabel: {
    fontSize: 14,
    color: '#374151',
    marginRight: 8,
  },
  subtypeQuantityInput: {
    minWidth: 80,
    backgroundColor: 'white',
    color: '#1F2937',
    fontSize: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderColor: '#D1D5DB',
    borderWidth: 1,
  },
  subtypePriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  subtypePriceLabel: {
    fontSize: 14,
    color: '#374151',
    paddingLeft: 16,
    marginRight: 8,
  },
  subtypePriceInput: {
    minWidth: 80,
    backgroundColor: 'white',
    color: '#1F2937',
    fontSize: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderColor: '#D1D5DB',
    borderWidth: 1,
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  selectedItemInfo: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  selectedItemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  selectedItemStock: {
    fontSize: 14,
    color: '#6B7280',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
  subtypeSelectionContainer: {
    gap: 8,
  },
  subtypeSelectionOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  subtypeSelectionOptionSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EBF4FF',
  },
  subtypeSelectionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  subtypeSelectionTextSelected: {
    color: '#3B82F6',
  },
  subtypeSelectionDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  subtypeSelectionDetailsSelected: {
    color: '#1E40AF',
  },
});
