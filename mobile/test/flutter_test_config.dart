import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';

/// Flutter's test runner automatically executes this file's
/// `testExecutable` before any test in this directory tree runs. Without
/// this, `GoogleFonts.inter(...)` tries to check/load font assets via
/// `ServicesBinding`, which isn't available in plain (non-widget) tests
/// (no binding at all) and depends on network access even in widget
/// tests unless runtime fetching is disabled.
Future<void> testExecutable(FutureOr<void> Function() testMain) async {
  TestWidgetsFlutterBinding.ensureInitialized();
  GoogleFonts.config.allowRuntimeFetching = false;
  await testMain();
}
