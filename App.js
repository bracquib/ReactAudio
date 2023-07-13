// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider } from 'react-redux';
import store from './store';
import LoginScreen from './LoginScreen'; 
import CreateActivityScreen from './CreateActivityScreen';
import MentionsAndComponentsScreen from './MentionsAndComponentsScreen';
import CreateDocuments from './CreateDocument';
import ForumsScreen from './ForumsScreen';
import GroupsScreen from './GroupsScreen';
import MediaScreen from './Media';
import MembersScreen from './MembersScreen';
import ReportScreen from './ReportScreen';
import Audio from './audio';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Audio" component={Audio} />
      <Tab.Screen name="CreateActivity" component={CreateActivityScreen} />
      <Tab.Screen name="MentionsAndComponents" component={MentionsAndComponentsScreen} />
      <Tab.Screen name="CreateDocuments" component={CreateDocuments} />
      <Tab.Screen name="Forums" component={ForumsScreen} />
      <Tab.Screen name='Group' component={GroupsScreen} />
      <Tab.Screen name='Media' component={MediaScreen} />
      <Tab.Screen name='Members' component={MembersScreen} />
      <Tab.Screen name='Report' component={ReportScreen} />
    </Tab.Navigator>
  );
};

const App = () => {  
  return (
    <Provider store={store}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Home" component={BottomTabNavigator} options={{ headerShown: false }} />

        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
};

export default App;
