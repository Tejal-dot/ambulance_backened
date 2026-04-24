import * as SMS from 'expo-sms';
import { Platform } from 'react-native';
import { EmergencyContact } from '@/types';

export const sendEmergencySMS = async (
  contacts: EmergencyContact[],
  patientName: string,
  hospitalName: string,
  hospitalAddress: string
) => {
  if (contacts.length === 0) {
    console.log('No emergency contacts to notify');
    return;
  }

  const message = `EMERGENCY ALERT: ${patientName} has been taken to ${hospitalName} located at ${hospitalAddress}. Please contact them immediately.`;

  if (Platform.OS === 'web') {
    console.log('SMS not supported on web. Message would be:', message);
    console.log('Recipients:', contacts.map(c => c.phone).join(', '));
    return;
  }

  try {
    const isAvailable = await SMS.isAvailableAsync();
    
    if (!isAvailable) {
      console.log('SMS is not available on this device');
      return;
    }

    const phoneNumbers = contacts.map(contact => contact.phone);
    
    await SMS.sendSMSAsync(phoneNumbers, message);
    
    console.log('Emergency SMS sent to:', phoneNumbers.join(', '));
  } catch (error) {
    console.error('Error sending SMS:', error);
  }
};
