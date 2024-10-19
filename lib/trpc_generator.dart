import 'dart:convert';
import 'dart:io';

import 'package:build/build.dart';
import 'package:source_gen/source_gen.dart';

class TrpcGenerator extends Generator {
  @override
  String generate(LibraryReader library, BuildStep buildStep) {
    final jsonFile = File('path_to_your_generated_json.json');
    final jsonString = jsonFile.readAsStringSync();
    final Map<String, dynamic> routerData = json.decode(jsonString);

    StringBuffer output = StringBuffer();

    output.writeln("import 'package:freezed_annotation/freezed_annotation.dart';");
    output.writeln("import 'package:trpc_dart/trpc_dart.dart';");
    output.writeln();
    output.writeln("part 'trpc_routes.freezed.dart';");
    output.writeln("part 'trpc_routes.g.dart';");
    output.writeln();

    for (var route in routerData['routes']) {
      final routeName = route['path'].replaceAll('.', '_');
      final inputSchema = route['input'];
      final outputSchema = route['output'];

      if (inputSchema != null) {
        output.writeln("@freezed");
        output.writeln("class ${routeName}Input with _\$${routeName}Input {");
        output.writeln("  factory ${routeName}Input({");
        _generateSchemaFields(inputSchema['schema'], output);
        output.writeln("  }) = _${routeName}Input;");
        output.writeln("  factory ${routeName}Input.fromJson(Map<String, dynamic> json) => _\$${routeName}InputFromJson(json);");
        output.writeln("}");
        output.writeln();
      }

      if (outputSchema != null) {
        output.writeln("@freezed");
        output.writeln("class ${routeName}Output with _\$${routeName}Output {");
        output.writeln("  factory ${routeName}Output({");
        _generateSchemaFields(outputSchema['schema'], output);
        output.writeln("  }) = _${routeName}Output;");
        output.writeln("  factory ${routeName}Output.fromJson(Map<String, dynamic> json) => _\$${routeName}OutputFromJson(json);");
        output.writeln("}");
        output.writeln();
      }
    }

    output.writeln("class TrpcRouter {");
    for (var route in routerData['routes']) {
      final routeName = route['path'].replaceAll('.', '_');
      final inputType = route['input'] != null ? "${routeName}Input" : "void";
      final outputType = route['output'] != null ? "${routeName}Output" : "void";

      output.writeln("  Future<$outputType> $routeName($inputType input) async {");
      output.writeln("    // Implement the actual TRPC call here");
      output.writeln("    throw UnimplementedError();");
      output.writeln("  }");
      output.writeln();
    }
    output.writeln("}");

    return output.toString();
  }

  void _generateSchemaFields(Map<String, dynamic> schema, StringBuffer output) {
    for (var entry in schema['shape'].entries) {
      final fieldName = entry.key;
      final fieldType = _zodTypeToDataType(entry.value);
      output.writeln("    required $fieldType $fieldName,");
    }
  }

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
      default:
        return 'dynamic';
    }
  }
}