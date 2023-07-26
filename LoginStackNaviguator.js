// LoginStackNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './LoginScreen';
import Site from './Site';

const Stack = createStackNavigator();

const LoginStackNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Site" component={Site} />
    </Stack.Navigator>
  );
};

export default LoginStackNavigator;
