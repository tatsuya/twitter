# Build an image starting with the Node 14 image.
FROM node:14

# Create the app directory.
WORKDIR /usr/src/app

# A wildcard is used to ensure both package.json AND package-lock.json are copied where available.
# Note that, rather than copying the entire working directory, we are only copying the package.json file.
# This allows us to take advantage of cached Docker layers.
COPY package*.json ./

# Install the app dependencies.
RUN npm install

# Bundle the app source.
COPY . .

# Describe that the container is listening on port 3000.
EXPOSE 3000

# Set the default command for the container.
CMD [ "npm", "start" ]
