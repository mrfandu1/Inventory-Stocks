import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Lock, LogIn, UserPlus } from 'lucide-react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { login, signUp, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace('/(tabs)');
    }
  }, [user]);

  const handleAuth = async () => {
    if (!email || !password || (isSignUp && !name)) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      let success = false;
      
      if (isSignUp) {
        success = await signUp(email, password, name);
        if (success) {
          Alert.alert(
            'Success',
            'Account created successfully! Please check your email to verify your account.',
            [{ text: 'OK', onPress: () => setIsSignUp(false) }]
          );
        } else {
          Alert.alert('Error', 'Failed to create account. Please try again.');
        }
      } else {
        success = await login(email, password);
        if (success) {
          router.replace('/(tabs)');
        } else {
          Alert.alert('Error', 'Invalid email or password');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setName('');
    setEmail('');
    setPassword('');
  };

  return (
    <LinearGradient
      colors={['#3B82F6', '#8B5CF6']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Inventory Manager</Text>
              <Text style={styles.subtitle}>
                {isSignUp ? 'Create your account' : 'Sign in to manage your inventory'}
              </Text>
            </View>

            <View style={styles.form}>
              {isSignUp && (
                <View style={styles.inputContainer}>
                  <UserPlus color="#8B5CF6" size={20} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    autoCorrect={false}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              )}

              <View style={styles.inputContainer}>
                <Mail color="#8B5CF6" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputContainer}>
                <Lock color="#8B5CF6" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <TouchableOpacity
                style={[styles.authButton, isLoading && styles.authButtonDisabled]}
                onPress={handleAuth}
                disabled={isLoading}
              >
                {isSignUp ? (
                  <UserPlus color="white" size={20} style={styles.buttonIcon} />
                ) : (
                  <LogIn color="white" size={20} style={styles.buttonIcon} />
                )}
                <Text style={styles.authButtonText}>
                  {isLoading 
                    ? (isSignUp ? 'Creating Account...' : 'Signing In...') 
                    : (isSignUp ? 'Create Account' : 'Sign In')
                  }
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.toggleButton}
                onPress={toggleMode}
                disabled={isLoading}
              >
                <Text style={styles.toggleButtonText}>
                  {isSignUp 
                    ? 'Already have an account? Sign In' 
                    : "Don't have an account? Sign Up"
                  }
                </Text>
              </TouchableOpacity>

              {!isSignUp && (
                <View style={styles.demoInfo}>
                  <Text style={styles.demoText}>Demo Account:</Text>
                  <Text style={styles.demoCredentials}>Create a new account to get started</Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  authButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  authButtonDisabled: {
    opacity: 0.6,
  },
  buttonIcon: {
    marginRight: 8,
  },
  authButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  toggleButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
  },
  demoInfo: {
    marginTop: 24,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  demoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  demoCredentials: {
    fontSize: 12,
    color: '#4B5563',
    textAlign: 'center',
  },
});