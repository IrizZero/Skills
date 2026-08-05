# Stack template: Flutter

> Loaded by `ui-ux-init` SKILL.md render step (main thread). One stack per run.
> Emits the 10 DESIGN.md sections in order.

### Stack 2 — Flutter

- **Section 1 (Preamble):** "Flutter (Material 3) with custom ThemeData. **No CSS terms anywhere in this DESIGN.md.**"
- **Section 2 (Locked Decisions table):** Framework: `Flutter Material 3` · Override strategy: `ThemeData / ColorScheme in lib/theme/app_theme.dart` · Theme name: `<Project Name>` · Accent: `Color(0xFF{variant.accent_hex_without_hash})` · Neutral palette base: slate (`Color(0xFF475569)` etc) · Display font: `{display_font}` · Body font: `{body_font}` (both declared via `pubspec.yaml` fonts + `fontFamily` in TextTheme) · Mono font: `IBM Plex Mono` · Layout style: `{variant.layout_primitive}`.
- **Section 3 (File Locations):** `lib/theme/app_theme.dart` (ThemeData + ColorScheme + EdgeInsets constants) · `lib/main.dart` (MaterialApp entry) · `lib/widgets/` (shared widget components).
- **Section 4 (Design Tokens):** Dart `class AppTheme { static const Color accent = Color(0xFF...); ... }` + `EdgeInsets` constants. Token scale per variant.
  - Derive the whole palette from ONE brand seed: `ColorScheme.fromSeed(seedColor: Color(0xFF<accent>))`. Tinted neutrals come for free from the seed — do not hand-pick grays.
  - **Dark mode (pattern):** provide a second `ThemeData` built with `ColorScheme.fromSeed(seedColor: ..., brightness: Brightness.dark)` and pass both to `MaterialApp(theme:, darkTheme:)`. (Pattern only — do not enumerate a full second palette here.)
- **Section 5 (Layout System):** Widget tree skeleton. `Scaffold(drawer: Drawer(child: ...))` for mobile-drawer; `Scaffold(body: Row(children: [NavigationRail(...), Expanded(child: ...)]))` for sidebar-left; `Scaffold(appBar: AppBar(...))` for topnav.
  - **Responsive:** components adapt to available space, not just viewport. Use `LayoutBuilder` (reacts to parent constraints), `MediaQuery` for breakpoints, and `Wrap`/`Flexible` for reflow. (Flutter has no CSS container-query primitive; `LayoutBuilder` is the counterpart.)
- **Section 6 (Sidebar / Navigation):** `Drawer` or `NavigationRail` example with role-guard checks via `if (user.hasRole('admin')) ...`.
- **Section 7 (Component Reference):** Widget examples — `FilledButton(...)`, `Card(child: ...)`, `AppBar(title: ...)`, `DataTable(columns: ..., rows: ...)`, `Badge(label: ...)`, `TextFormField(decoration: InputDecoration(...))`. **NO CSS terms anywhere** (no HTML attributes, no `<button>`, no `px`/`rem`).
  - **Motion (functional, not decorative):** standard transitions ~150–250ms with `Curves.easeInOut` via `AnimatedContainer`/`AnimatedOpacity`. Honor reduced-motion: check `MediaQuery.of(context).disableAnimations` and skip/shorten when true.
- **Section 8 (View Patterns):** `StatefulWidget` skeleton. CRUD view = `Scaffold` + `FloatingActionButton(onPressed: ...)`. List view = `Scaffold` + `ListView.builder(...)`.
- **Section 9 (Typography Conventions):** Two type roles bound to `TextTheme`. Display = `{display_font}` (headings — `TextTheme.displayLarge`/`headlineMedium`); Body = `{body_font}` (`TextTheme.bodyLarge`/`bodyMedium`). Declare both in `pubspec.yaml` under `flutter.fonts` and apply via `fontFamily` in the relevant `TextStyle`s. Mono = IBM Plex Mono for file paths / IDs / versions. Heading weight `FontWeight.w700`. NEVER hardcode a font family at a call site — always go through `Theme.of(context).textTheme`.
- **Section 10 (What NOT to Do):** Seeded: "Do not bypass `Theme.of(context)` with hard-coded `Color(0x...)`", "Do not use arbitrary `EdgeInsets` values outside the spacing scale", "Do not import CSS or HTML idioms — Flutter widgets only".
  - Do not nest `Card`s inside `Card`s — nested surfaces break Material 3 elevation hierarchy.
  - Do not place low-contrast text on a colored fill — text on tinted/primary surfaces must meet 4.5:1 (WCAG 1.4.3); use the scheme's `onPrimary`/`onSurface` roles, not hand-picked grays.
  - Permit the chosen display + body fonts in pubspec; do not add OTHER font families.
