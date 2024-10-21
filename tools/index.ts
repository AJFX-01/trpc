import { generateJSON } from './extractor'; // Adjust this to the path where your extraction code is located
import * as fs from 'fs';
import * as readlineSync from 'readline-sync';

// Function to get user input for file name, key, and router
function promptForDetails() {
    console.log("Note: The router file must be located in the root folder.");
    
    const routerName: string = readlineSync.question('Enter the name of the router file (without extension, from the root folder): ');
    const fileName: string = readlineSync.question('Enter the name for the JSON file (without extension): ');
    const key: string = readlineSync.question('Enter the key you want to use in the JSON (main key of list of maps): ');

    return { routerName, fileName, key };
}

async function main() {
    try {
        // Prompt the user for router file name, file name, and key
        const { routerName, fileName, key } = promptForDetails();

        // Dynamically import the router based on user input from the root folder
        const { myRouter } = await import(`./${routerName}`);

        // Generate the JSON string dynamically using the provided key
        const jsonOutput = generateJSON(myRouter, key);

        // Write the JSON to the specified file
        fs.writeFileSync(`./${fileName}.json`, jsonOutput);

        console.log(`JSON saved to ./${fileName}.json`);
    } catch (error: any) {
        console.error('Error:', error.message);
    }
}

// Execute the main function
main();
