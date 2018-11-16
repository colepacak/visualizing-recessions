# Visualizing Recessions with Pandas and Three.js

![Visualizing Recessions with Pandas and Three.js](./images/recessions.gif)

The purpose of this project is to identify and visualize U.S. recessions from 1947 to 2016. Pandas is used for data manipulation and analysis and Three.js is used for visualization.

## Methodology
So what defines a recession? While a [comprehensive definition](https://www.thebalance.com/recession-definition-and-meaning-3305958) includes GDP, declines in various industries and the unemployment rate, I'm choosing to focus on GDP. It was interesting to see that my approach was overall on track when compared to [Wikipedia's list of recessions](https://en.wikipedia.org/wiki/List_of_recessions_in_the_United_States). My definition was: a recession begins when there are at least two consecutive quarterly declines in GDP, ends after there have been at least two consecutive quarterly increases in GDP and the bottom is the lowest quarter anywhere in that time period. "Anywhere" is a key word because GDP could be down two quarters in a row, increase the next quarter and then proceed to even lower depths in subsequent quarters before the recession technically ends.
Two main limitations about my definition were:
* Only considering GDP.
* Because I needed two quarters to get in and two more to get out, I missed two shorter recessions that Wikipedia noted.

## Local Development
### Pandas
Run `python index.py` to print out columns from the dataframe and export it to JSON. This is not needed to simply view the visualization, as the data - `recessions.json` - is tracked in the repo.

### Three.js
Install dependencies and transpile using Webpack by running `yarn install && yarn start`.

### Server
Start the server of your choice. I tend to use `python -m SimpleHTTPServer 8088`.