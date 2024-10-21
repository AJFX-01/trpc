// import 'dart:convert';
// import 'dart:io';
// import 'package:build/build.dart';
// import 'package:source_gen/source_gen.dart';


// class TrpcGenerator extends Generator {
//   final String jsonFilePath;
//   final String outputDir;

//   TrpcGenerator({required this.jsonFilePath, required this.outputDir});

//   @override
//   String generate(LibraryReader library, BuildStep buildStep) {
//     final jsonFile = File(jsonFilePath);
    
//     try {
//       if (!jsonFile.existsSync()) {
//         throw FileSystemException('File not found', jsonFilePath);
//       }

//       final jsonString = jsonFile.readAsStringSync();
//       final Map<String, dynamic> routerData = json.decode(jsonString);
//       print(routerData.toString());

//       // Validate the router data structure before proceeding
//       validateRouterData(routerData);

//       StringBuffer output = StringBuffer();

//       // Start generating the Freezed classes and TRPC methods
//       _generateHeader(output);

//       for (var routeEntry in routerData['routeMap']) {
//         // Since routeMap is now a list, we process each item individually
//         for (var subRouteEntry in routeEntry.entries) {
//           final routeKey = subRouteEntry.key;
//           final route = subRouteEntry.value;

//           final routeName = route['path'].replaceAll('.', '_');
//           final inputSchema = route['input'];
//           final outputSchema = route['output'];

//           // Generate Freezed Input and Output classes if schemas are available
//           _generateFreezedClass("${routeName}Input", inputSchema, output);
//           _generateFreezedClass("${routeName}Output", outputSchema, output);
//         }
//       }

//       _generateTrpcRouterClass(routerData, output);

//       // final outputFile = File('$outputDir/trpc_routes.dart');
//       // outputFile.writeAsStringSync(output.toString());

//       return output.toString();
//     } catch (e) {
//       rethrow; // You can decide how to handle this in your environment
//     }
//   }

//   // Helper method to validate router data
//   bool validateRouterData(Map<String, dynamic> routerData) {
//     if (routerData.isEmpty) {
//       throw FormatException('Invalid router data: Data cannot be empty.');
//     }
//     return true;
//   }

//   // Generate Freezed class based on schema
//   void _generateFreezedClass(
//     String className, Map<String, dynamic>? schema, StringBuffer output) {
//     if (schema != null && schema.containsKey('properties')) {
//       output.writeln("@freezed");
//       output.writeln("class ${capitalizeFirstLetter(className)} with _\$${capitalizeFirstLetter(className)}{");
//       output.writeln("  factory ${capitalizeFirstLetter(className)}({");
      
//       // Pass the 'properties' and 'required' fields to _generateSchemaFields
//       _generateSchemaFields(schema['properties'], schema['required'] ?? [], output);
      
//       output.writeln("  }) = _${capitalizeFirstLetter(className)};");
//       output.writeln(
//           "  factory ${capitalizeFirstLetter(className)}.fromJson(Map<String, dynamic> json) => _\$${capitalizeFirstLetter(className)}"
//           "FromJson(json);");
//       output.writeln("}");
//       output.writeln();
//     }
//   }

//   void _generateSchemaFields(
//       Map<String, dynamic> properties, List<dynamic> requiredFields, StringBuffer output) {
//     for (var entry in properties.entries) {
//       final fieldName = entry.key;
//       final fieldSchema = entry.value;
//       final fieldType = _zodTypeToDataType(fieldSchema);

//       final isRequired = requiredFields.contains(fieldName) ? "required" : "";

//       output.writeln("    $isRequired $fieldType $fieldName,");
//     }
//   }

//   // Mapping Zod types to Dart types
//   String _zodTypeToDataType(Map<String, dynamic> zodType) {
//     switch (zodType['type']) {
//       case 'string':
//         return 'String';
//       case 'number':
//         return 'double';
//       case 'boolean':
//         return 'bool';
//       case 'array':
//         final innerType = _zodTypeToDataType(zodType['items']);
//         return 'List<$innerType>';
//       case 'object':
//         return 'Map<String, dynamic>';
//       case 'union':
//         return 'dynamic'; // Can improve with custom type handling later
//       default:
//         return 'dynamic';
//     }
//   }

//   // Generate header part of the file
//   void _generateHeader(StringBuffer output) {
//     output.writeln(
//         "import 'package:freezed_annotation/freezed_annotation.dart';");
//     output.writeln("import 'package:json_annotation/json_annotation.dart';");
//     output.writeln();
//     output.writeln("part 'trpc_routes.freezed.dart';");
//     output.writeln("part 'trpc_routes.g.dart';");
//     output.writeln();
//   }

//   void _generateTrpcRouterClass(Map<String, dynamic> routeMap, StringBuffer output) {
//     output.writeln("class TrpcRouter {");

//     for (var routeEntry in routeMap['routeMap']) {
//       for (var subRouteEntry in routeEntry.entries) {
//         final routeKey = subRouteEntry.key;
//         final routeDetails = subRouteEntry.value;

//         final routeName = routeDetails['path'] != null
//             ? routeDetails['path'].replaceAll('.', '_')
//             : 'UnnamedRoute';

//         final inputType = routeDetails.containsKey('input') ? "${routeName}Input" : "void";
//         final outputType = routeDetails.containsKey('output') ? "${routeName}Output" : "void";

//         // Generate the TRPC method signature
//         output.writeln(
//             "  Future<$outputType> $routeName($inputType input) async {");
//         output.writeln("    // Implement the actual TRPC call here");
//         output.writeln("    throw UnimplementedError();");
//         output.writeln("  }");
//         output.writeln();
//       }
//     }

//     output.writeln("}");
//   }

//     String capitalizeFirstLetter(String input) {
//     if (input.isEmpty) return input;
//     return input[0].toUpperCase() + input.substring(1);
//   }
// }
import 'dart:convert';
import 'dart:io';
import 'package:build/build.dart';
import 'package:source_gen/source_gen.dart';

class TrpcGenerator extends Generator {
  final String jsonFilePath;
  final String outputDir;
  final bool generateForAllRoutes;
  final String classPrefix;
  final String indentation;

  TrpcGenerator({
    required this.jsonFilePath,
    required this.outputDir,
    this.generateForAllRoutes = true, // Option to generate for all routes
    this.classPrefix = '', // Option for class naming conventions
    this.indentation = '  ', // Option for indentation level
  });

  @override
  String generate(LibraryReader library, BuildStep buildStep) {
    final jsonFile = File(jsonFilePath);
    
    try {
      if (!jsonFile.existsSync()) {
        throw FileSystemException('File not found', jsonFilePath);
      }

      final jsonString = jsonFile.readAsStringSync();
      final Map<String, dynamic> routerData = json.decode(jsonString);
      
      // Validate router data
      validateRouterData(routerData);

      StringBuffer output = StringBuffer();
      _generateHeader(output);

      for (var routeEntry in routerData['routeMap']) {
        for (var subRouteEntry in routeEntry.entries) {
          final route = subRouteEntry.value;
          
          if (generateForAllRoutes || (route.containsKey('input') && route.containsKey('output'))) {
            final routeName = route['path'].replaceAll('.', '_');
            final inputSchema = route['input'];
            final outputSchema = route['output'];

            _generateFreezedClass("$classPrefix${routeName}Input", inputSchema, output);
            _generateFreezedClass("$classPrefix${routeName}Output", outputSchema, output);
          }
        }
      }

      _generateTrpcRouterClass(routerData, output);

      final outputFile = File('$outputDir/trpc_routes.dart');
      outputFile.writeAsStringSync(output.toString());
      return output.toString();

    } catch (e) {
      if (e is FileSystemException) {
        throw Exception('File System Error: ${e.message}');
      } else if (e is FormatException) {
        throw Exception('Invalid JSON format: ${e.message}');
      } else {
        throw Exception('An unknown error occurred: $e');
      }
    }
  }

  // Helper method to validate router data
  void validateRouterData(Map<String, dynamic> routerData) {
    if (routerData.isEmpty) {
      throw FormatException('Invalid router data: Data cannot be empty.');
    }
    // Check for required fields like 'routeMap'
    if (!routerData.containsKey('routeMap')) {
      throw FormatException('Invalid router data: Missing "routeMap" field.');
    }
  }

  // Generate Freezed class based on schema
  void _generateFreezedClass(
    String className, Map<String, dynamic>? schema, StringBuffer output) {
    if (schema != null && schema.containsKey('properties')) {
      output.writeln("@freezed");
      output.writeln("${indentation}class ${capitalizeFirstLetter(className)} with _\$${capitalizeFirstLetter(className)}{");
      output.writeln("${indentation * 2}factory ${capitalizeFirstLetter(className)}({");
      _generateSchemaFields(schema['properties'], schema['required'] ?? [], output);
      output.writeln("${indentation * 2}}) = _${capitalizeFirstLetter(className)};");
      output.writeln("${indentation * 2}factory ${capitalizeFirstLetter(className)}.fromJson(Map<String, dynamic> json) => _\$${capitalizeFirstLetter(className)}FromJson(json);");
      output.writeln("$indentation}");
      output.writeln();
    }
  }

  // Generate schema fields
  void _generateSchemaFields(Map<String, dynamic> properties, List<dynamic> requiredFields, StringBuffer output) {
    for (var entry in properties.entries) {
      final fieldName = entry.key;
      final fieldSchema = entry.value;
      final fieldType = _zodTypeToDataType(fieldSchema);
      final isRequired = requiredFields.contains(fieldName) ? "required" : "";

      output.writeln("${indentation * 3}$isRequired $fieldType $fieldName,");
    }
  }

  // Map Zod types to Dart types
  String _zodTypeToDataType(Map<String, dynamic> zodType) {
    switch (zodType['type']) {
      case 'string':
        return 'String';
      case 'number':
        return 'double';
      case 'boolean':
        return 'bool';
      case 'array':
        final innerType = _zodTypeToDataType(zodType['items']);
        return 'List<$innerType>';
      case 'object':
        return 'Map<String, dynamic>';
      case 'union':
        return 'dynamic';
      default:
        throw FormatException('Unsupported Zod type: ${zodType['type']}');
    }
  }

  // Generate header for the output file
  void _generateHeader(StringBuffer output) {
    output.writeln("import 'package:freezed_annotation/freezed_annotation.dart';");
    output.writeln();
    output.writeln("part 'trpc_routes.freezed.dart';");
    output.writeln("part 'trpc_routes.g.dart';");
    output.writeln();
  }

  // Generate TRPC Router class
  void _generateTrpcRouterClass(Map<String, dynamic> routeMap, StringBuffer output) {
    output.writeln("class TrpcRouter {");
    for (var routeEntry in routeMap['routeMap']) {
      for (var subRouteEntry in routeEntry.entries) {
        final route = subRouteEntry.value;
        final routeName = route['path']?.replaceAll('.', '_') ?? 'UnnamedRoute';
        final inputType = route.containsKey('input') ? "$classPrefix${routeName}Input" : "void";
        final outputType = route.containsKey('output') ? "$classPrefix${routeName}Output" : "void";

        output.writeln("${indentation}Future<${capitalizeFirstLetter(outputType)}> $routeName(${capitalizeFirstLetter(inputType)} input) async {");
        output.writeln("${indentation * 2}// Implement the actual TRPC call here");
        output.writeln("${indentation * 2}throw UnimplementedError();");
        output.writeln("$indentation}");
        output.writeln();
      }
    }
    output.writeln("}");
  }

  String capitalizeFirstLetter(String input) {
    if (input.isEmpty) return input;
    return input[0].toUpperCase() + input.substring(1);
  }
}
