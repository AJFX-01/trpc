import 'package:build/build.dart';
import 'trpc_generator.dart';

Builder trpcGeneratorBuilder(BuilderOptions options) {
  final jsonFilePath = Platform.environment['TRPC_JSON_PATH'] ?? options.config['defaultJsonFilePath'];
  return LibraryBuilder(TrpcGenerator(jsonFilePath: jsonFilePath));
}