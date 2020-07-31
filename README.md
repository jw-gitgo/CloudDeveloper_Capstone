# Cloud Developer Capstone Project - Driving Conditions App

I intend to build a simple application that allows a user to submit a starting and ending location, and then returns an optimized driving route, along with the anticipated weather at multiple points during the trip (assuming the user wants to leave now).  It will leverage publicly-available API's for route-finding and weather forecasts, and will allow the user to save defined trips for future retrieval.  It is based on the Todo app from the previous project.

# Functionality of the application

I intend to focus on the backend of the application, primarily the trip creation, storage, update, and retrieval, using AWS Lambda and API Gateway, and the authentication, using OAuth.  I will provide only a very basic frontend, mostly to obtain the bearer authorization token.

## Data Structure
- userId (string) - a unique id for the user, passed by OAuth
- tripId (string) - a unique id for a defined trip
- createdAt (string) - date and time when a trip was created
- updatedAt (string) - date and time trip route & weather details were last refreshed
- name (string) - name of the trip
- startPoint (string) - starting point of the trip
- startGeo (string) - starting lat/lon coordinate
- endPoint (string) - ending point of the trip
- endGeo (string) - ending lat/lon coordinate
- distance (string) - distance in miles
- duration (string) - estimated trip duration in hours
- weather (array of strings) - corresponding weather (time, weather description, temperature, visibility, windspeed) at regular intervals along the route (start, quarter-point, half-point, three-quarters-point, end)
- steps (array of strings) - steps along the trip route
- tripIconUrl (string) - the URL of the trip icon that a user can optionally upload

## Logical Flow
1. [In Browser] User logs into application using OAuth - userId is passed to application via browser
2. [In Browser] The user authorization token is provided and stored in the browser (copy this from the dev tools console)
3. [In Browser] getTrips loads all trips for the provided userId in the browser
4. [Using Postman] user creates trip by providing a trip name, starting location, and ending location
    - startPoint and endPoint for each trip are passed to OpenRouteService API, which returns lat-long geo-coordinates.
    - A subsequent call is made to the OpenRouteService API with the geocoordinates, which returns the driving steps and the geocoordinates of waypoints along the route.
    - Geocoordinates are extracted from the driving route at regular intervals (start, quarter-point, half-point, three-quarters-point, end), and the estimated time-of-day at each waypoint is calculated.
    - These geocoordinates and times-of-day are passed to OpenWeatherMap API, which returns the predicted weather and driving conditions at these five locations at the predicted times for when they will be reached by the driver.
5. [Using Postman] User can also get all trips, update a trip, or delete a trip by ID.  Updating a trip also causes the route and weather data to be recalculated accordingly.
6. [In Browser] Now that data exists for the user, the browser can be refreshed to list all trips.  The user can also update or delete the trips from the browser, or can upload an icon to represent the trip.

## Key Functions

* `Auth` - this function implements a custom authorizer for API Gateway that is used by all other functions
* `GetTrips` - return all TRIPs for a current user. 
* `CreateTrip` - create a new TRIP for a current user. The shape of data sent by a client application to this function can be found in the `CreateTripRequest.ts` file
* `UpdateTrip` - update a TRIP item created by a current user. The shape of data send by a client application to this function can be found in the `UpdateTripRequest.ts` file
* `DeleteTrip` - delete a TRIP item created by a current user. Expects an id of a TRIP item to remove.
* `GenerateUploadUrl` - returns a presigned url that can be used to upload an attachment file for a TRIP item. 

## Frontend

The frontend was not the focus of this project.  The functionality was left largely untouched from the previous project.  It is only necessary for the OAuth login and obtaining the user authorization token for use in Postman.

# Deployment

## Backend Deployment

To deploy an application run the following commands:

```
cd backend
npm install
sls deploy -v
```

## Frontend Deployment

To run a client application first edit the `client/src/config.ts` file to set correct parameters. And then run the following commands

```
cd client
npm install
npm run start
```

This should start a development server with the React application that will interact with the serverless TRIP application.

## Postman collection

An updated Postman collection is provided in this project.  It uses the same basic structure and methods as the Todo project.
