# Intelligent Bike Dash Cam (IBDC) Project

## Index

1. What is this project?
2. Who is the Rob Dollar foundation
3. Core Requirements
4. Why Typescript / React / Expo
5. How to build / run
6. Current Status
7. Branch Status
8. Issues
9. Future Tasks

## 1. What is this project?

This project is intended to pair with a physical device being developed at the University of Arizona that will be attached to a bicycle handle and monitor passing cars. The intent is to track cars that pass too close and are in violation of Arizona Law which states vehicles must provide cyclists with 3+ feet of clearance. The device, when detecting an offender, will attempt to photograph the license plate and transit details to this application via Bluetooth. This will allow the cyclist for focus on staying safe and automatically documenting the vehicle so the cyclist can inform the authorities. Law enforcement may be able to use the data to hold repeat offenders accountable. Law makers can use the data to identify roads that would be ideal for investment due to higher than normal numbers of incidents.

## 2. Who is the Rob Dollar foundation

From their website at https://www.robdollarfoundation.org/about-rob-dollar-foundation/our-mission

The Rob Dollar Foundation exists to improve cyclist safety across Arizona through education, awareness, and advocacy.​​Working with local officials, organizations, and community partners, the foundation supports initiatives designed to create safer roadways and strengthen protections for cyclists. The foundation’s efforts focus on increasing awareness of safe riding and driving practices while supporting policies and programs that improve conditions for cyclists at the city and state level.

## 3. Core Requirements

1. Use a shared Protobuf protocol to connect with the integrated device over Bluetooth.
2. Store Incidents from the device and allow supplemental data to be attached to support reporting.
3. Store data in a local embedded database.
4. Generate PDF reports.
5. Provide a seamless and intuitive user experience on both Android and IOS devices.

## 4. Why Typescript / React / Expo

Based on our research the recommended tech stack for mobile development on both platforms is React native, Typescript, and Expo. These technologies simplify app development a lot and allow a lot to be built with very minimal code. Javascript was possible but our team decided to go with Typescript due to its rapid growth in the industry and strong type safety additions.

Our first 4 sprints reinforced this being the right call as development was fast and easy to build a framework and there are many options to further refine the design as polish becomes more of a focus towards the end of the Fall work schedule.

## 5. How to build / run

You will need NPM installed on your computer to handle installing the dependencies that are saved in package.json which is located in the IBDC-Expo/ folder.

This will install any required dependencies that you don't have.

```Bash
npm install
```

This is how you will run the program (From the IBDC-Expo folder as it must be the same directory as package.json)

```Bash
npx expo start
```

## 6. Current Status

The current version operates on both IOS and Android and has a functional User interface that meets with the approval of the sponsor. Navigation between screens works as does data flow from the database to the UI. The database is not yet optimized as it was just implemented and tested. The look and feel of the app has been implemented through themes in the settings menu. There are 2 options currently and more can be added easily for demonstration and customization.

## 7. Branch Status

There are 14 branches in the current project. Many have been merged into dev and remain as a branch just for grading purposes.

- Main - The projects Main Branch. Only documents have been updated here. At the end of Sprint 4 in the Spring C Session we will merge a stable version to main from dev.
- Dev - The primary repository for tested functional code.
- US#56-Protobuf - Efforts to handle data transmitted via Protobuf are focused here.

All other branches have been merged to dev at this point.

Taiga Link to see Task history: https://tree.taiga.io/project/colintugend-asu-intelligent-bicycle-dash-cam/backlog

## 8. Issues

These are issues in the current code that need to be fixed.

- On IOS devices the top 1.5 inches of the screen are blocked preventing the user from seeing a logo or filtering options on some screens. This issue does not exist on Android and needs to be researched.
- The sponsor would like the transition from incomplete incident images to the edge of the scroll space should be blurred to make a softer transition that a sharp line.
- Displayed sessions on Session History screen needs to be connected to the settings screen toggle between display options. Right now its just a constant on the Session page.

## 9. Future Tasks

These are issues that have not yet been started but either need or should be added as part of the next development cycle.

- The Database needs to be normalized.
- Protobuf support code needs to be implemented and tested.
- Add custom theme support.
- Add a donate button for the Rob Dollar foundation. (Not requested by Sponsor. Just an idea)
- UI Polish needed. It currently looks more like a school project than a professional app.
- Settings page needs to be updated with real settings
