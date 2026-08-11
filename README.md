# MetaRoboLearn mobile application

This repository represents the development of a mobile application for controlling the ROS2 robot using a smartphone.<br/>
The project is developed in the **React Native** framework and supports multiple ways of controlling the robot.<br/>
In addition, the application is supported on both Android and iOS devices.

---

## Functional requirements

* User instructions
* Sending commands to move and stop the robot
* Control the robot by tilting the device
* Device drop detection
* Display of broadcasts from the robot's camera
* Game plugins object detection

---

## Non-functional requirements

* The robot's response to sending a start command must be within one second
* The robot's response to sending a stop command must be within one second
* The number of consecutive commands sent does not affect the quality of robot control

---

## Application structure

The application is designed as a **game menu**, with each game providing an additional type of interaction with the robot in addition to the controller.<br/>
Depending on the selected game, the user is shown the corresponding controller to which additional features are dynamically added.

---

## Git branches

The repository contains **two main robot control implementations**:

### ◉ `button-version` branch

The first version of the application that uses classic buttons to control the robot.

**Features:**
* Initial and simple implementation
* Buttons to move forward, backward, left, right
* Button to stop the robot unconditionally
* Manual modification of the parameters of the speed and duration of the execution of the movement
* Turning left and right by tilting the mobile device with the `Žiroskop` option turned on
* Display of the image from the robot's camera via the WebSocket protocol
* Unit testing components

### 🕹️ `thumbstick-version` branch

Another version of the application that uses a **virtual thumbstick** to continuously control the robot.

**Features:**
* Movement buttons converted into a single scroll button
* Continuous sending of movement commands while the scroll button is moved
* Change of a command type depending on the position of the scroll button
* Change of robot movement speed depending on the displacement of the button from its initial position
* Automatic stopping of the robot when the user releases the finger from the button
* So-called 'dead-zone' around the initial position of the button

---

## Local testing

Prerequisites / installations:
* Node.js
* Expo CLI
* Packages from **package.json**
* Expo Go mobile application

After cloning the desired branch of the repository, it is necessary to run:

* `cd \<directory to which the repository was cloned\>`
* `npm install`
* `npm start`

In this way, the development server is started, which provides many options:
* Press a │ open Android
* Press w │ open web
* Press j │ open debugger
* Press r │ reload app
* Press m │ toggle menu
* shift+m │ more tools
* Press o │ open project code in your editor
* QR code with which the application can be tested through Expo Go

---

## Deployment

The deployment of the application was carried out by using Expo Application Services (EAS).<br/>
Although the application was developed as a multi-platform (Android and iOS), only the Android version was created within this project.<br/>
The iOS version of the application in the development environment has certain restrictions related to the distribution and installation of the application outside the App Store.

Prerequisites / installations:
* Globally installed eas-cli
* Expo account

If the prerequisites are not met, it is necessary to start:
* `npm install -g eas-cli`
* `eas login`

After that, it is necessary to run:
* `eas build:configure` (select Android platform here)
* `eas build -p android --profile preview`

The result of this process is an .apk file that can be manually installed on Android devices.

---

## Environmental variables

* CLIENT_NAME=<YOUR_METAROBOLEARN_CLIENT_NAME>
* API_KEY=<YOUR_METAROBOLEARN_API_KEY>
* BROKER_HTTP_API_BASE_URL=<YOUR_METAROBOLEARN_BROKER_HTTP_API_BASE_URL>
* PRINT_OUTPUT_WEBSOCKET_BASE_URL=<YOUR_METAROBOLEARN_PRINT_OUTPUT_WEBSOCKET_BASE_URL>
* CAMERA_FEED_WEBSOCKET_BASE_URL=<YOUR_METAROBOLEARN_CAMERA_FEED_WEBSOCKET_BASE_URL>

Add more in production:
* EXPO_PROJECT_ID=<YOUR_EXPO_PROJECT_ID>

---

## Future work

* Login
* Tweaking the responsiveness of the thumbstick controller
* Switching from WebSocket to another way of broadcasting from the robot camera
