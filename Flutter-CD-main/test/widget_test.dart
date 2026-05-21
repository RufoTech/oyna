import 'package:flutter_test/flutter_test.dart';

import 'package:flutter_cd/app.dart';

void main() {
  testWidgets('App renders HomeScreen', (WidgetTester tester) async {
    await tester.pumpWidget(const App(isFirstLaunch: true));
    // Verify that the app title is rendered.
    expect(find.text('Lucid Entertainment'), findsOneWidget);
  });
}
