/**
 * WorkForce Mobile - Roster Screen (Manager)
 * 
 * Shows all employees and their current status.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';

// Mock employee data
const MOCK_EMPLOYEES = [
  {
    id: 'user-alex-001',
    name: 'Alex',
    role: 'Warehouse Associate',
    avatar: '📦',
    status: 'CLOCKED_IN' as const,
  },
  {
    id: 'user-mike-001',
    name: 'Mike',
    role: 'Kitchen Staff',
    avatar: '👨‍🍳',
    status: 'OFF' as const,
  },
  {
    id: 'user-jessica-001',
    name: 'Jessica',
    role: 'Server',
    avatar: '🍽️',
    status: 'BREAK' as const,
  },
  {
    id: 'user-david-001',
    name: 'David',
    role: 'Bartender',
    avatar: '🍹',
    status: 'CLOCKED_IN' as const,
  },
  {
    id: 'user-lisa-001',
    name: 'Lisa',
    role: 'Host',
    avatar: '🎯',
    status: 'OFF' as const,
  },
];

type EmployeeStatus = 'CLOCKED_IN' | 'OFF' | 'BREAK';

export default function RosterScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<typeof MOCK_EMPLOYEES[0] | null>(null);
  
  // Filter employees based on search
  const filteredEmployees = MOCK_EMPLOYEES.filter((emp) =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Get status badge
  const getStatusBadge = (status: EmployeeStatus) => {
    switch (status) {
      case 'CLOCKED_IN':
        return (
          <View style={[styles.statusBadge, styles.statusGreen]}>
            <Text style={styles.statusText}>🟢 Clocked In</Text>
          </View>
        );
      case 'BREAK':
        return (
          <View style={[styles.statusBadge, styles.statusYellow]}>
            <Text style={styles.statusText}>🟡 Break</Text>
          </View>
        );
      case 'OFF':
        return (
          <View style={[styles.statusBadge, styles.statusGray]}>
            <Text style={styles.statusText}>🔴 Off</Text>
          </View>
        );
    }
  };
  
  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search employees..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9ca3af"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearButton}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Employee Count */}
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''}
        </Text>
        <Text style={styles.headerSubtext}>
          {MOCK_EMPLOYEES.filter(e => e.status === 'CLOCKED_IN').length} currently clocked in
        </Text>
      </View>
      
      {/* Employee List */}
      <ScrollView style={styles.list}>
        {filteredEmployees.map((employee) => (
          <TouchableOpacity
            key={employee.id}
            style={styles.employeeCard}
            onPress={() => setSelectedEmployee(employee)}
            activeOpacity={0.7}
          >
            <Text style={styles.avatar}>{employee.avatar}</Text>
            
            <View style={styles.employeeInfo}>
              <Text style={styles.employeeName}>{employee.name}</Text>
              <Text style={styles.employeeRole}>{employee.role}</Text>
            </View>
            
            {getStatusBadge(employee.status)}
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Employee Details Modal */}
      <Modal
        visible={selectedEmployee !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedEmployee(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedEmployee && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalAvatar}>{selectedEmployee.avatar}</Text>
                  <View style={styles.modalHeaderText}>
                    <Text style={styles.modalName}>{selectedEmployee.name}</Text>
                    <Text style={styles.modalRole}>{selectedEmployee.role}</Text>
                  </View>
                </View>
                
                {getStatusBadge(selectedEmployee.status)}
                
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Quick Actions</Text>
                  <TouchableOpacity style={styles.modalAction}>
                    <Text style={styles.modalActionText}>📅 View Schedule</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalAction}>
                    <Text style={styles.modalActionText}>⏰ Time Records</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalAction}>
                    <Text style={styles.modalActionText}>✅ Task History</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalAction}>
                    <Text style={styles.modalActionText}>💰 Earnings</Text>
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setSelectedEmployee(null)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  clearButton: {
    fontSize: 20,
    color: '#9ca3af',
    paddingHorizontal: 8,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  headerSubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  employeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    fontSize: 40,
    marginRight: 16,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  employeeRole: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusGreen: {
    backgroundColor: '#d1fae5',
  },
  statusYellow: {
    backgroundColor: '#fef3c7',
  },
  statusGray: {
    backgroundColor: '#f3f4f6',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalAvatar: {
    fontSize: 64,
    marginRight: 20,
  },
  modalHeaderText: {
    flex: 1,
  },
  modalName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  modalRole: {
    fontSize: 16,
    color: '#6b7280',
  },
  modalSection: {
    marginTop: 24,
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  modalAction: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalActionText: {
    fontSize: 16,
    color: '#3b82f6',
  },
  closeButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
});

