export const getLibrary = async isMapLibre => {
  const mapLib = isMapLibre
    ? await import(
        // @ts-ignore
        /* @vite-ignore */ `../../node_modules/maplibre-gl/dist/maplibre-gl.js`
      )
    : await import(
        // @ts-ignore
        /* @vite-ignore */ `../../node_modules/mapbox-gl/dist/mapbox-gl.js`
      )
  isMapLibre
    ? await import(
        // @ts-ignore
        /* @vite-ignore */ `../../node_modules/maplibre-gl/dist/maplibre-gl.css`
      )
    : await import(
        // @ts-ignore
        /* @vite-ignore */ `../../node_modules/mapbox-gl/dist/mapbox-gl.css`
      )
  return window[isMapLibre ? 'maplibregl' : 'mapboxgl'] || mapLib
}
