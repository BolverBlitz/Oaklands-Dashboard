# Oaklands-Dashboard
 Simple high performance overview dashboard for oaklands house.  
 Slow routes are cached automaticly to ensure a fast response time.
 Most routes can deliver 10K+ requests per second even on a single raspberry pi core with minimal usage and memory footprint.

# Features
- [X] Responsive design
- [X] Logo
- [X] Link List
- [X] Generate Unifi Guest Wifi
- [ ] Show host statistics
- [X] Show Mikrotik statistics
- [ ] Show docker statistics

# Installation
Requierments:
- NodeJS 16 or higher

1. Clone the repository
2. Run `yarn install`
3. Run `node index.js`

Its recommended to run this in a screen session or something similar.
