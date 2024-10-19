import { generateJSON } from './extractor'; // Adjust this to the path where your extraction code is located
import * as fs from 'fs';
import { myRouter } from './router'; // Adjust the path to your router

const jsonOutput = generateJSON(myRouter);
fs.writeFileSync('./routes.json', jsonOutput);
