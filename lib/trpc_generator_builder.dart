import 'dart:io';
import 'package:build/build.dart';
import 'package:source_gen/source_gen.dart';
import 'trpc_generator.dart';

Builder trpcGeneratorBuilder(BuilderOptions options) {
  final outputDir = options.config['output_dir'] ?? 'lib/generated/';
  final jsonFilePath = Platform.environment['TRPC_JSON_PATH'] ?? options.config['defaultJsonFilePath'];
  if (jsonFilePath == null ) {
    throw ArgumentError('TRPC_JSON_PATH environment variable or defaultJsonFilePath must be provided');
  }
  return LibraryBuilder(TrpcGenerator(jsonFilePath: jsonFilePath, outputDir: outputDir));
}