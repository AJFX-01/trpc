library trpc_routes;

import 'package:build/build.dart';
import 'package:source_gen/source_gen.dart';
import 'trpc_generator.dart';

Builder trpcGenerator(BuilderOptions options) =>
    SharedPartBuilder([TrpcGenerator()], 'trpc_generator');