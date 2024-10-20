import 'dart:async';
import 'dart:convert';

import 'package:build/build.dart';
import 'package:source_gen/source_gen.dart';

class TrpcRouteBuilder implements Builder {
  @override
  Map<String, List<String>> get buildExtensions => {
    'routes.json': ['routes.dart']
  };

  @override
  FutureOr<void> build(BuildStep buildStep) async {
    // Expect the routes.json file in the root of the project
    final inputId = AssetId(buildStep.inputId.package, 'routes.json');
    final outputId = AssetId(buildStep.inputId.package, 'lib/src/routes.dart');

    if (!await buildStep.canRead(inputId)) {
      log.warning('routes.json not found. Please run the TRPC extractor to generate it.');
      return;
    }

    final jsonContent = await buildStep.readAsString(inputId);
    final routes = json.decode(jsonContent) as Map<String, dynamic>;

    final buffer = StringBuffer();
    _writeHeader(buffer);
    _writeRouteClasses(buffer, routes);
    _writeRouteConstants(buffer, routes);

    await buildStep.writeAsString(outputId, buffer.toString());
  }

  // ... (keep the existing helper methods)

   void _writeHeader(StringBuffer buffer) {
    buffer.writeln("import 'package:freezed_annotation/freezed_annotation.dart';");
    buffer.writeln();
    buffer.writeln("part 'routes.freezed.dart';");
    buffer.writeln("part 'routes.g.dart';");
    buffer.writeln();
  }

  void _writeRouteClasses(StringBuffer buffer, Map<String, dynamic> routes) {
    for (final entry in routes.entries) {
      final routeName = entry.key.replaceAll('.', '_');
      final routeInfo = entry.value as Map<String, dynamic>;

      _writeClassForRoute(buffer, routeName, 'Input', routeInfo['input']);
      _writeClassForRoute(buffer, routeName, 'Output', routeInfo['output']);
    }
  }

  void _writeClassForRoute(StringBuffer buffer, String routeName, String classType, Map<String, dynamic>? schema) {
    final className = '$routeName$classType';
    
    buffer.writeln('@freezed');
    buffer.writeln('class $className with _\$$className {');
    buffer.writeln('  const $className._();');
    buffer.writeln('  const factory $className({');
    
    if (schema != null) {
      for (final field in schema.entries) {
        final dartType = _zodToDartType(field.value);
        buffer.writeln('    $dartType? ${field.key},');
      }
    }
    
    buffer.writeln('  }) = _$className;');
    buffer.writeln();
    buffer.writeln('  factory $className.fromJson(Map<String, dynamic> json) =>');
    buffer.writeln('      _\$${className}FromJson(json);');
    buffer.writeln('}');
    buffer.writeln();
  }

  void _writeRouteConstants(StringBuffer buffer, Map<String, dynamic> routes) {
    buffer.writeln('class TrpcRoutes {');
    for (final entry in routes.entries) {
      final routeName = entry.key.replaceAll('.', '_');
      buffer.writeln("  static const String $routeName = '${entry.key}';");
    }
    buffer.writeln('}');
  }

  String _zodToDartType(String zodType) {
    switch (zodType) {
      case 'z.string()':
        return 'String';
      case 'z.number()':
        return 'double';
      case 'z.boolean()':
        return 'bool';
      // Add more type conversions as needed
      default:
        return 'dynamic';
    }
  }
}

Builder trpcRouteBuilder(BuilderOptions options) => TrpcRouteBuilder();