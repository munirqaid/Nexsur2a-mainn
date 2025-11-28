# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory to /app
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
# This is done separately to leverage Docker layer caching
COPY package*.json ./

# Install app dependencies
RUN npm install --production

# Copy the rest of the application source code to the working directory
COPY . .

# Expose the port the app runs on
# The default port is 3000, as defined in server.js and .env.example
EXPOSE 3000

# Define the command to run the application
# This uses the "start" script defined in package.json
CMD [ "npm", "start" ]
