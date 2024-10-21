# TRPC Code Generator for Dart and TypeScript

This project provides a TRPC code generator for Dart, designed to dynamically map TRPC routes from TypeScript to Dart using Freezed classes. The tool reads a JSON file that describes your routes and generates Dart classes accordingly.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
  - [TypeScript Part](#typescript-part)
  - [Dart Part](#dart-part)
- [Example](#example)
- [License](#license)

---

## Overview

This project consists of two main parts:

- **TypeScript**: Extracts routes from a TRPC router and writes them to a JSON file.
- **Dart**: Consumes the generated JSON file and creates corresponding Freezed classes and other necessary Dart code for TRPC API communication.

## Features

- **Dynamic Route Extraction**: Extracts TRPC routes dynamically from a TypeScript router.
- **Customizable Route Keys**: The key used for the route map in the JSON file can be customized.
- **Freezed Code Generation**: Automatically generates Freezed classes in Dart based on the extracted routes.

---

## Installation

### Prerequisites

- Node.js and npm (for the TypeScript part)
- Dart and the `build_runner` tool (for the Dart part)

### TypeScript Part

Install the required npm packages:

```bash
npm install 
```

### Dart Part

Add the following dependencies to your `pubspec.yaml`:

```yaml
dependencies:
  build: ^2.4.1
  http: ^1.2.1
  queue: ^3.1.0+2
  source_gen: ^1.5.0
  analyzer: '>=5.2.0 <7.0.0'
  json_annotation: ^4.8.1
  freezed_annotation: ^2.4.4

dev_dependencies:
  lints: ^3.0.0
  test: ^1.24.0
  build_runner: ^2.3.3
  freezed: ^2.5.7
  json_serializable: ^6.7.1
```

---

## Usage

### TypeScript Part

The TypeScript part extracts routes from a TRPC router and writes them to a JSON file.

1. **Edit `index.ts` to match your project structure:**

```typescript
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
```

2. **Run the generator**:

```bash
npx ts-node index.ts
```

You'll be prompted for a file name, key for the route map and router file nmae. This will generate a JSON file in the root directory.
Remeber the key used here, it will be used later in the `build.yaml` under the options confiurations

### Dart Part

The Dart part reads the JSON file and generates Dart classes using Freezed.

1. **Configure `build.yaml`**:

Add the following to your `build.yaml` file to configure the code generation process:

```yaml
targets:
  $default:
    builders:
      trpc_client|trpcGeneratorBuilder:
        options:
          output_dir: lib/generated/
          input_json_path: lib/config/routes.json
          defaultJsonFilePath: "lib/generated/trpc_routes.json"  # fallback option
          mainkey: "routeMap" # set the key for the map list entry
        generate_for:
          - lib/trpc_routes.dart
        enabled: True
      freezed:
        generate_for:
          - lib/generated/trpc_routes.dart
        enabled: true


builders:
  trpcGeneratorBuilder:
    import: "package:trpc_client/trpc_generator_builder.dart"  # The file where your generator lives.
    builder_factories: [ "trpcGeneratorBuilder" ]  # Points to the builder factory function.
    build_extensions: {".json": [".dart"]}  # Specifies that .dart files will generate .trpc.dart.
    auto_apply: dependents  # Automatically applies when dependent files change.
    build_to: source  # Ensures the generated code is part of the source directory.
    applies_builders: ["freezed|freezed"]
  freezed:
    import: "package:freezed/builder.dart"  # Points to the freezed builder.
    builder_factories: ["freezed"]
    build_extensions: {".dart": [".freezed.dart"]}
    auto_apply: dependents
    build_to: source
    applies_builders: ["source_gen|combining_builder"]
```
You can configured the options sections like the output_dir, where the generated files will be located, also the
input_json_path where the json file to b build is located, and also the mainKey should be the same key used in generating
the json file from trpc router.

2. **Run the Dart code generator**:

Before runing the code generator, first clear your build cache

```bash
dart run build_runner clean
```
then run the build runner

```bash
dart run build_runner watch --delete-conflicting-outputs
```

This will generate Dart files in your project based on the JSON file created by the TypeScript extractor.

---

## Configuration

### TypeScript Part

You can customize the key used for the route map by modifying the prompt in the `index.ts` file. This key is then used in both the generated JSON and Dart files.

### Dart Part

The `build.yaml` configuration allows you to specify the key (`mainKey`) used for extracting routes from the JSON file.

For example:

```yaml
options:
  mainKey: "myCustomKey"  # Use this if your JSON file has a custom key for routeMap
```

---

## Example

### TypeScript Router

```typescript
const myRouter = router({
  getUser: publicProcedure
    .input(z.string())
    .query(({ input }) => {
      return { id: input, name: 'John Doe' };
    }),
});
```

### Generated JSON File

```json
{
  "myCustomKey": [
    {
      "path": "getUser",
      "input": { "type": "string" },
      "output": { "type": "object", "properties": { "id": { "type": "string" }, "name": { "type": "string" } } }
    }
  ]
}
```

### Generated Dart Class

```dart
@freezed
class GetUserInput with _$GetUserInput {
  const factory GetUserInput({
    required String id,
  }) = _GetUserInput;

  factory GetUserInput.fromJson(Map<String, dynamic> json) => _$GetUserInputFromJson(json);
}

@freezed
class GetUserOutput with _$GetUserOutput {
  const factory GetUserOutput({
    required String id,
    required String name,
  }) = _GetUserOutput;

  factory GetUserOutput.fromJson(Map<String, dynamic> json) => _$GetUserOutputFromJson(json);
}
```

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

This README provides a step-by-step guide to set up both the TypeScript and Dart parts, ensuring a smooth integration process for your TRPC code generation project.
