import importlib.util
import pathlib

_spec = importlib.util.spec_from_file_location(
    "guard", pathlib.Path(__file__).with_name("check-flutter-css.py")
)
guard = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(guard)


def _names(hits):
    return {label for _, label, _ in hits}


def test_clean_flutter_is_clean():
    text = (
        "FilledButton(onPressed: ...)\n"
        "ColorScheme.fromSeed(seedColor: Color(0xFF16A34A))\n"
        "const slate = Color(0xFF475569);\n"
        "Seed hex reference: #16A34A\n"
        "EdgeInsets.all(16)\n"
        "AnimatedContainer(duration: Duration(milliseconds: 250))\n"
        "class AppTheme {}\n"
    )
    assert guard.scan(text) == []


def test_oklch_flags():
    assert "OKLCH" in _names(guard.scan("background: oklch(0.7 0.1 150);"))


def test_css_unit_flags():
    assert "css px/rem unit" in _names(guard.scan("padding: 16px;"))
    assert "css px/rem unit" in _names(guard.scan("gap: 1.5rem;"))


def test_html_class_attr_flags():
    assert "html class attribute" in _names(guard.scan('<button class="btn">'))


def test_container_query_and_bezier_flag():
    assert "container query" in _names(guard.scan("@container (min-width: 400px) {}"))
    assert "cubic-bezier" in _names(guard.scan("transition: all .2s cubic-bezier(.4,0,.2,1);"))


def test_logical_pixels_prose_is_clean():
    assert guard.scan("Spacing uses logical pixels via EdgeInsets.") == []


if __name__ == "__main__":
    import sys
    fns = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    failed = 0
    for fn in fns:
        try:
            fn()
            print(f"PASS {fn.__name__}")
        except AssertionError as e:
            failed += 1
            print(f"FAIL {fn.__name__}: {e}")
    sys.exit(1 if failed else 0)
