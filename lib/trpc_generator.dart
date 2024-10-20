import 'dart:convert';
import 'dart:io';
import 'package:build/build.dart';
import 'package:source_gen/source_gen.dart';

class TrpcGenerator extends Generator {
  final String jsonFilePath;
  final String outputDir;

  TrpcGenerator({required this.jsonFilePath, required this.outputDir});

  @override
  String generate(LibraryReader library, BuildStep buildStep) {
    final jsonFile = File(jsonFilePath);
    
    try {
      if (!jsonFile.existsSync()) {
        throw FileSystemException('File not found', jsonFilePath);
      }

      final jsonString = jsonFile.readAsStringSync();
      final Map<String, dynamic> routerData = json.decode(jsonString);
      print(routerData.toString());
      // Validate the router data structure before proceeding
      validateRouterData(routerData);

      StringBuffer output = StringBuffer();

      // Start generating the Freezed classes and TRPC methods
      _generateHeader(output);

      for (var route in routerData['routes']) {
        final routeName = route['path'].replaceAll('.', '_');
        final inputSchema = route['input'];
        final outputSchema = route['output'];

        // Generate Freezed Input and Output classes if schemas are available
        _generateFreezedClass("${routeName}Input", inputSchema, output);
        _generateFreezedClass("${routeName}Output", outputSchema, output);
      }

      _generateTrpcRouterClass(routerData['routes'], output);

      final outputFile = File('$outputDir/trpc_routes.dart');
      outputFile.writeAsStringSync(output.toString());

      return output.toString();
    } catch (e) {
      rethrow; // You can decide how to handle this in your environment
    }
  }

  // Helper method to validate router data
  bool validateRouterData(Map<String, dynamic> routerData) {
    if (!routerData.containsKey('routes') || routerData['routes'] is! List) {
      throw FormatException(
          'Invalid router data: Missing or incorrect "routes" key.');
    }
    return true;
  }

  // Generate Freezed class based on schema
  void _generateFreezedClass(
      String className, Map<String, dynamic>? schema, StringBuffer output) {
    if (schema != null) {
      output.writeln("@freezed");
      output.writeln("class $className with _\$$className {");
      output.writeln("  factory $className({");
      _generateSchemaFields(schema['schema'], output);
      output.writeln("  }) = _$className;");
      output.writeln(
          "  factory $className.fromJson(Map<String, dynamic> json) => _\$$className"
          "FromJson(json);");
      output.writeln("}");
      output.writeln();
    }
  }

  // Generate schema fields
  void _generateSchemaFields(Map<String, dynamic> schema, StringBuffer output) {
    for (var entry in schema['shape'].entries) {
      final fieldName = entry.key;
      final fieldType = _zodTypeToDataType(entry.value);
      output.writeln("    required $fieldType $fieldName,");
    }
  }

  // Mapping Zod types to Dart types
  String _zodTypeToDataType(Map<String, dynamic> zodType) {
    switch (zodType['type']) {
      case 'string':
        return 'String';
      case 'number':
        return 'double';
      case 'boolean':
        return 'bool';
      case 'array':
        final innerType = _zodTypeToDataType(zodType['element']);
        return 'List<$innerType>';
      case 'object':
        return 'Map<String, dynamic>';
      case 'union':
        return 'dynamic'; // Can improve with custom type handling later
      default:
        return 'dynamic';
    }
  }

  // Generate header part of the file
  void _generateHeader(StringBuffer output) {
    output.writeln(
        "import 'package:freezed_annotation/freezed_annotation.dart';");
    output.writeln("import 'package:trpc_client.dart/trpc_dart.dart';");
    output.writeln();
    output.writeln("part 'trpc_routes.freezed.dart';");
    output.writeln("part 'trpc_routes.g.dart';");
    output.writeln();
  }

  // Generate TRPC Router class with method stubs
  void _generateTrpcRouterClass(List<dynamic> routes, StringBuffer output) {
    output.writeln("class TrpcRouter {");

    for (var route in routes) {
      final routeName = route['path'].replaceAll('.', '_');
      final inputType = route['input'] != null ? "${routeName}Input" : "void";
      final outputType =
          route['output'] != null ? "${routeName}Output" : "void";

      output.writeln(
          "  Future<$outputType> $routeName($inputType input) async {");
      output.writeln("    // Implement the actual TRPC call here");
      output.writeln("    throw UnimplementedError();");
      output.writeln("  }");
      output.writeln();
    }

    output.writeln("}");
  }
}
