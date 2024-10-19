import ts from "typescript";
import { Project } from "ts-morph";


// Initialize the new ts-morph project
const project = new Project();

// Parse the TypeScript file
const sourceFile = project.addSourceFileAtPath("path/to/your/ts/file.ts");

// Find all the function declarations(routes and types)
function extraxtRoutes() {
    const routes = {};

    sourceFile.forEachDescendant((node) => {
        if (ts.isFunctionDeclaration(node) && node.name?.text) {
            const routeName = node.name.text;
            const routePath = node.parameters?.[0]?.type?.getText()?.replace("string", "");

            if (routePath) {
                routes[routeName] = routePath;
            }
        }
    })
}


const routes = extraxtRoutes();
require('fs').writeFileSync('routes.json', JSON.stringify(routes, null, 2));


console.log('Routes extrcated and saved to routes.json');