import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { User, EmergencyContact, UserRole } from '@/types';
import { trpc } from '@/lib/trpc';

const STORAGE_KEY = '@ambulance_user';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (error) {
      console.log('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, role: UserRole): Promise<{ success: boolean; error?: string }> => {
    try {
      const USERS_KEY = '@ambulance_all_users';
      const stored = await AsyncStorage.getItem(USERS_KEY);
      const allUsers: User[] = stored ? JSON.parse(stored) : [];
      
      const foundUser = allUsers.find(u => 
        u.email.toLowerCase() === email.toLowerCase() && 
        u.role === role
      );
      
      if (!foundUser) {
        return { success: false, error: 'Invalid credentials or wrong account type' };
      }
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(foundUser));
      setUser(foundUser);
      return { success: true };
    } catch (error) {
      console.log('Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  };

  const register = async (
    name: string,
    email: string,
    phone: string,
    password: string,
    role: UserRole,
    vehicleNumber?: string,
    licenseNumber?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const USERS_KEY = '@ambulance_all_users';
      const stored = await AsyncStorage.getItem(USERS_KEY);
      const allUsers: User[] = stored ? JSON.parse(stored) : [];
      
      const emailExists = allUsers.some(u => u.email.toLowerCase() === email.toLowerCase());
      if (emailExists) {
        return { success: false, error: 'Email already registered' };
      }
      
      const phoneExists = allUsers.some(u => u.phone === phone);
      if (phoneExists) {
        return { success: false, error: 'Phone number already registered' };
      }
      
      const newUser: User = {
        id: Date.now().toString(),
        name,
        email,
        phone,
        role,
        emergencyContacts: [],
        vehicleNumber,
        licenseNumber,
      };
      
      allUsers.push(newUser);
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(allUsers));
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
      setUser(newUser);
      return { success: true };
    } catch (error) {
      console.log('Register error:', error);
      return { success: false, error: 'Registration failed' };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setUser(null);
    } catch (error) {
      console.log('Logout error:', error);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;
    
    try {
      const updatedUser = { ...user, ...updates };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      const USERS_KEY = '@ambulance_all_users';
      const stored = await AsyncStorage.getItem(USERS_KEY);
      const allUsers: User[] = stored ? JSON.parse(stored) : [];
      const updatedAllUsers = allUsers.map(u => u.id === user.id ? updatedUser : u);
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(updatedAllUsers));
    } catch (error) {
      console.log('Update profile error:', error);
    }
  };

  const addEmergencyContact = async (contact: Omit<EmergencyContact, 'id'>) => {
    if (!user) return;
    
    try {
      const newContact: EmergencyContact = {
        ...contact,
        id: Date.now().toString(),
      };
      
      const updatedContacts = [...user.emergencyContacts, newContact];
      const updatedUser = { ...user, emergencyContacts: updatedContacts };
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      const USERS_KEY = '@ambulance_all_users';
      const stored = await AsyncStorage.getItem(USERS_KEY);
      const allUsers: User[] = stored ? JSON.parse(stored) : [];
      const updatedAllUsers = allUsers.map(u => u.id === user.id ? updatedUser : u);
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(updatedAllUsers));
    } catch (error) {
      console.log('Add contact error:', error);
    }
  };

  const removeEmergencyContact = async (contactId: string) => {
    if (!user) return;
    
    try {
      const updatedContacts = user.emergencyContacts.filter(c => c.id !== contactId);
      const updatedUser = { ...user, emergencyContacts: updatedContacts };
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      const USERS_KEY = '@ambulance_all_users';
      const stored = await AsyncStorage.getItem(USERS_KEY);
      const allUsers: User[] = stored ? JSON.parse(stored) : [];
      const updatedAllUsers = allUsers.map(u => u.id === user.id ? updatedUser : u);
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(updatedAllUsers));
    } catch (error) {
      console.log('Remove contact error:', error);
    }
  };

  return {
    user,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    addEmergencyContact,
    removeEmergencyContact,
  };
});
