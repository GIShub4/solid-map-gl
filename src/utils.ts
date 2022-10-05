export const getLibrary = async isMapLibre => {
  if (isMapLibre) {
    try {
      await import('maplibre-gl')
      //@ts-ignore
      await import('maplibre-gl/dist/maplibre-gl.css')
      return window['maplibregl']
    } catch (e) {}
  } else {
    try {
      await import('mapbox-gl')
      //@ts-ignore
      await import('mapbox-gl/dist/mapbox-gl.css')
      return window['mapboxgl']
    } catch (e) {}
  }
}
