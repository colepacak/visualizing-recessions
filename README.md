# Visualizing Recessions with Pandas and Three.js

![Visualizing Recessions with Pandas and Three.js](./images/recessions.gif)

The purpose of this project is to identify and visualize U.S. recessions from 1947 to 2016. Pandas is used for data manipulation and analysis and Three.js is used for visualization.

## Local Development
### Pandas
Run `python index.py` to print out columns from the dataframe and export it to JSON. This is not needed to simply view the visualization, as the data - `recessions.json` - is tracked in the repo.

### Three.js
Install dependencies and transpile using Webpack by running `yarn install && yarn start`.

### Server
Start the server of your choice. I tend to use `python -m SimpleHTTPServer 8088`.