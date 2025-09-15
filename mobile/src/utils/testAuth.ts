import AsyncStorage from '@react-native-async-storage/async-storage';

export const testAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    const user = await AsyncStorage.getItem('user');
    
    console.log('===== AUTH TEST =====');
    console.log('Token exists:', token ? 'YES' : 'NO');
    console.log('Token value:', token ? token.substring(0, 50) + '...' : 'None');
    console.log('User exists:', user ? 'YES' : 'NO');
    console.log('User data:', user ? JSON.parse(user) : 'None');
    console.log('===================');
    
    return { token, user: user ? JSON.parse(user) : null };
  } catch (error) {
    console.error('Auth test error:', error);
    return { token: null, user: null };
  }
};

// Export function to manually set token for testing
export const setTestToken = async (token: string) => {
  try {
    await AsyncStorage.setItem('token', token);
    console.log('Test token set successfully');
  } catch (error) {
    console.error('Error setting test token:', error);
  }
};