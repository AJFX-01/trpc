import { generateJSON } from './extractor'; // Adjust this to the path where your extraction code is located
import * as fs from 'fs';
import * as readlineSync from 'readline-sync';
import { myRouter } from './router'; // Adjust the path to your router

// const jsonOutput = generateJSON(myRouter, "routes");
// fs.writeFileSync('./routes.json', jsonOutput);


// Function to get user input for file name and key
function promptForDetails() {
    const fileName : string = readlineSync.question('Enter the name for the JSON file (without extension): ');
    const key : string = readlineSync.question('Enter the key you want to use in the JSON, this will be main key of list of maps: ');

    return { fileName, key };
}

function main() {
// Prompt the user for file name and key
    const { fileName, key } = promptForDetails();

    // Generate the JSON string dynamically using the provided key
    const jsonOutput = generateJSON(myRouter, key);

    // Write the JSON to the specified file
    fs.writeFileSync(`./${fileName}.json`, jsonOutput);

    console.log(`JSON saved to ./${fileName}.json`);
}

// Execute the main function
main();