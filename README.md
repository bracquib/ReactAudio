# ReactAudio
It is an application that retrieves information from the API of the buddyboss plugin that was used for the WeSingleParent website and that allows depending on whether the user is admin or member to perform actions on the site by the API.

## Getting Started
### Installation
To install the Q-rious Mobile Application, follow these steps:
- Clone the project repository .
- Navigate to the project directory and install dependencies using npm install or yarn install.
### Running the Application
To run the application on an Android or iOS emulator, use the following commands:
- For Android: npx react-native run-android or just start on Android Studio
- For iOS: npx react-native run-ios
Ensure that you have set up the development environment and emulator correctly before running the application.
## Possible Modification
### Vocal Commands
- change the languages: in startListening of each Page,change voice.start('language that we want') 
- add possible command: in const commands , add useRef for commands ,condition in Voice.onSpeechResults,variable in  Initialisation

### Change URL
- change const rooturl in each Page
  
## If you make modification:
- npm res ..
- start with android studio
