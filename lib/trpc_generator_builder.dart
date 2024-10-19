import 'dart:io';
import 'package:build/build.dart';
import 'package:source_gen/source_gen.dart';
import 'trpc_generator.dart';

Builder trpcGeneratorBuilder(BuilderOptions options) {
  final jsonFilePath = Platform.environment['TRPC_JSON_PATH'] ?? options.config['defaultJsonFilePath'];
  return LibraryBuilder(TrpcGenerator(jsonFilePath: jsonFilePath));
}