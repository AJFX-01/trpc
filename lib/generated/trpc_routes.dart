import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:trpc_client.dart/trpc_dart.dart';

part 'trpc_routes.freezed.dart';
part 'trpc_routes.g.dart';

@freezed
class exampleRouteInput with _$exampleRouteInput {
  factory exampleRouteInput({
    required String field1,
    required double field2,
  }) = _exampleRouteInput;
  factory exampleRouteInput.fromJson(Map<String, dynamic> json) => _$exampleRouteInputFromJson(json);
}

@freezed
class exampleRouteOutput with _$exampleRouteOutput {
  factory exampleRouteOutput({
    required String result,
  }) = _exampleRouteOutput;
  factory exampleRouteOutput.fromJson(Map<String, dynamic> json) => _$exampleRouteOutputFromJson(json);
}

class TrpcRouter {
  Future<exampleRouteOutput> exampleRoute(exampleRouteInput input) async {
    // Implement the actual TRPC call here
    throw UnimplementedError();
  }

}
