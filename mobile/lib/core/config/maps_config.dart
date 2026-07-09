/// Compile-time Google Maps API key. No real key is configured in this
/// environment (see mobile/README.md "Google Maps"): pass one at build/run
/// time with `--dart-define=GOOGLE_MAPS_API_KEY=...` and add the matching
/// key to `web/index.html`'s commented-out script tag to enable live maps.
/// Until then, [hasGoogleMapsApiKey] is false and delivery-tracking screens
/// render a clearly-labeled fallback instead of a broken Google-branded map.
const googleMapsApiKey = String.fromEnvironment('GOOGLE_MAPS_API_KEY');

bool get hasGoogleMapsApiKey => googleMapsApiKey.isNotEmpty;
