export const getLibrary = async isMapLibre => {
  if (isMapLibre) {
    const mapLib = await import(/* @vite-ignore */ 'maplibre-gl')
    // @ts-ignore
    await import(/* @vite-ignore */ 'maplibre-gl/dist/maplibre-gl.css')
    return window['maplibregl'] || mapLib
  } else {
    const mapLib = await import(/* @vite-ignore */ 'mapbox-gl')
    // @ts-ignore
    await import(/* @vite-ignore */ 'mapbox-gl/dist/mapbox-gl.css')
    return window['mapboxgl'] || mapLib
  }
}
