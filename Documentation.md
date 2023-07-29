# Application Documentation
## 1. Introduction
This document provides an overview of the features, architecture, and functionality of the application.

## 2. Overview
This is a mobile application developed using React Native, which allows users to interact with the WeSingleParent website.
The application supports voice recording and speech recognition for specific commands.

## 3. Dependencies
The application relies on the following libraries and modules:
- React Native: The framework for building native mobile applications.
- Redux: For managing global state and user authentication data.
- Axios: For handling HTTP requests to interact with the backend API.
- React Navigation: For handling navigation within the application.
- react-native-permissions: For managing permissions to access device features.
- @react-native-community/voice: For voice recognition functionality.
## 4. Screens and Components
The app has 10 screen:Help,CreateActivityScreen,CreateDocument,ForumsScreen,GroupsScreen,Media,MemberScreen,Mentionandcomponent,ReportScreen.
## 5. Permissions
The application requests the following permissions:
RECORD_AUDIO: Required for voice recognition to capture user input for reporting.
## 6. Architecture
### Components 
The application is built using React Native and follows a component-based architecture.
### State Management (Redux)
Redux is used for state management in the application.
The application uses Redux to manage the token and isAdmin states.
### APIs and Data Fetching
The application communicates with the Q-rious backend API using the axios library.
API endpoints for member reporting, mentions search, and component management are used.
## 7. Authentication
The application uses a token-based authentication system. Upon successful login, users receive an access token, which is included in the request headers for protected API endpoints.

## 8. Admin Privileges
The application checks for admin privileges using Redux. Admin users have additional features and options not available to regular users.

 ## 9. Styling
The application uses React Native's StyleSheet.create to define styles for various UI components.

## 10. Error Handling
The application includes basic error handling for API requests and user interactions. However, additional error handling can be added to enhance user experience and manage unexpected scenarios.
