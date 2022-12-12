const mapBase = 'mapbox://styles/mapbox'
const gitBase = 'https://raw.githubusercontent.com/'
const gishub = 'https://raw.githubusercontent.com/GIShub4/map-styles/main/'
const hereBase = 'https://assets.vector.hereapi.com/styles/'

export const vectorStyleList: object = {
  mb: {
    light: `${mapBase}/light-v11`,
    dark: `${mapBase}/dark-v11`,
    street: `${mapBase}/streets-v12`,
    outdoor: `${mapBase}/outdoors-v12`,
    sat: `${mapBase}/satellite-v9`,
    sat_street: `${mapBase}/satellite-streets-v12`,
    nav: `${mapBase}/navigation-guidance-day-v4`,
    nav_night: `${mapBase}/navigation-guidance-night-v4`,
    basic: `${mapBase}/cjf4m44iw0uza2spb3q0a7s41`,
    monochrome: `${mapBase}/cjv6rzz4j3m4b1fqcchuxclhb`,
    leshine: `${mapBase}/cjcunv5ae262f2sm9tfwg8i0w`,
    icecream: `${mapBase}/cj7t3i5yj0unt2rmt3y4b5e32`,
    cali: `${mapBase}/cjerxnqt3cgvp2rmyuxbeqme7`,
    northstar: `${mapBase}/cj44mfrt20f082snokim4ungi`,
    mineral: `${mapBase}/cjtep62gq54l21frr1whf27ak`,
    moonlight: `${mapBase}/cj3kbeqzo00022smj7akz3o1e`,
    frank: `${mapBase}-map-design/ckshxkppe0gge18nz20i0nrwq`,
    minimo: `${mapBase}-map-design/cksjc2nsq1bg117pnekb655h1`,
    decimal: `${mapBase}-map-design/ck4014y110wt61ctt07egsel6`,
    standard: `${mapBase}-map-design/ckr0svm3922ki18qntevm857n`,
    blueprint: `${mapBase}-map-design/cks97e1e37nsd17nzg7p0308g`,
    bubble: `${mapBase}-map-design/cksysy2nl62zp17quosctdtcc`,
    pencil: `${mapBase}-map-design/cks9iema71es417mlrft4go2k`,
    swiss_ski: `${gitBase}mapbox/mapbox-gl-swiss-ski-style/master/cij1zoclj002y8rkkdjl69psd.json`,
    vintage: `${gitBase}mapbox/mapbox-gl-vintage-style/master/cif5p01n202nisaktvljx9mv3.json`,
    whaam: `${gitBase}mapbox/mapbox-gl-whaam-style/master/cii8323c8004w0nlvtss3dbm2.json`,
    neon: `${gitBase}NatEvatt/awesome-mapbox-gl-styles/master/styles/Neon/style.json`,
    camoflauge: `${gitBase}jingsam/mapbox-gl-styles/master/Camouflage.json`,
    emerald: `${gitBase}jingsam/mapbox-gl-styles/master/Emerald.json`,
    runner: `${gitBase}jingsam/mapbox-gl-styles/master/Runner.json`,
    x_ray: `${gitBase}jingsam/mapbox-gl-styles/master/X-ray.json`,
  },
  here: {
    base: `${hereBase}berlin/base/mapbox/tilezen?apikey={apikey}`,
    day: `${hereBase}berlin/day/mapbox/tilezen?apikey={apikey}`,
    night: `${hereBase}berlin/night/mapbox/tilezen?apikey={apikey}`,
  },
  esri: {
    blueprint: `${gishub}esri:blueprint.json`,
    charted_territory: `${gishub}esri:charted-territory.json`,
    colored_pencil: `${gishub}esri:colored-pencil.json`,
    community: `${gishub}esri:community.json`,
    mid_century: `${gishub}esri:mid-century.json`,
    modern_antique: `${gishub}esri:modern-antique.json`,
    nat_geo: `${gishub}esri:national-geographic.json`,
    newspaper: `${gishub}esri:newspaper.json`,
    open_street_map: `${gishub}esri:open-street-map.json`,
    light_gray_canvas: `${gishub}esri:light-gray-canvas.json`,
    dark_gray_canvas: `${gishub}esri:dark-gray-canvas.json`,
    human_geo_light: `${gishub}esri:human-geography-light.json`,
    human_geo_dark: `${gishub}esri:human-geography-dark.json`,
    world_navigation: `${gishub}esri:world-navigation.json`,
    world_street: `${gishub}esri:world-street.json`,
    world_street_night: `${gishub}esri:world-street-night.json`,
    world_terrain: `${gishub}esri:world-terrain.json`,
    world_terrain_hybrid: `${gishub}esri:world-terrain-hybrid.json`,
    world_topographic: `${gishub}esri:world-topographic.json`,
    chromium: `${gishub}esri:chromium.json`,
    dreamcatcher: `${gishub}esri:dreamcatcher.json`,
    seahaven: `${gishub}esri:seahaven.json`,
    sangria: `${gishub}esri:sangria.json`,
    mercurial: `${gishub}esri:mercurial.json`,
    imagery: `${gishub}esri:imagery.json`,
    imagery_hybrid: `${gishub}esri:imagery-hybrid.json`,
    firefly: `${gishub}esri:firefly.json`,
    firefly_hybrid: `${gishub}esri:firefly-hybrid.json`,
    oceans: `${gishub}esri:oceans.json`,
  },
}
const carto = 'https://{s}.basemaps.cartocdn.com/rastertiles/'
const stamen = 'https://stamen-tiles-{s}.a.ssl.fastly.net/'
const tf = 'https://{s}.tile.thunderforest.com/'

export const rasterStyleList: object = {
  osm: {
    org: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    human: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    cycle: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
    topo: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    _copy:
      '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap</a>',
  },
  carto: {
    voyager: `${carto}voyager_labels_under/{z}/{x}/{y}{r}.png`,
    positron: `${carto}light_all/{z}/{x}/{y}{r}.png`,
    dark: `${carto}dark_all/{z}/{x}/{y}{r}.png`,
    _copy:
      '<a href="https://carto.com/attribution" target="_blank">&copy; Carto</a>',
  },
  stamen: {
    toner: `${stamen}toner/{z}/{x}/{y}{r}.png`,
    toner_lite: `${stamen}toner-lite/{z}/{x}/{y}{r}.png`,
    watercolor: `${stamen}watercolor/{z}/{x}/{y}.png`,
    terrain: `${stamen}terrain/{z}/{x}/{y}{r}.png`,
    _copy:
      '<a href="https://stamen.com/privacy-policy" target="_blank">&copy; Stamen Design</a>',
  },
  tf: {
    cycle: `${tf}cycle/{z}/{x}/{y}{r}.png?apikey={apikey}`,
    trans: `${tf}transport/{z}/{x}/{y}{r}.png?apikey={apikey}`,
    trans_dark: `${tf}transport-dark/{z}/{x}/{y}{r}.png?apikey={apikey}`,
    landscape: `${tf}landscape/{z}/{x}/{y}{r}.png?apikey={apikey}`,
    outdoors: `${tf}outdoors/{z}/{x}/{y}{r}.png?apikey={apikey}`,
    neighbourhood: `${tf}neighbourhood/{z}/{x}/{y}{r}.png?apikey={apikey}`,
    spinal: `${tf}spinal-map/{z}/{x}/{y}{r}.png?apikey={apikey}`,
    pioneer: `${tf}pioneer/{z}/{x}/{y}{r}.png?apikey={apikey}`,
    atlas: `${tf}atlas/{z}/{x}/{y}{r}.png?apikey={apikey}`,
    mobile: `${tf}mobile-atlas/{z}/{x}/{y}{r}.png?apikey={apikey}`,
    _copy:
      '<a href="https://thunderforest.com/privacy" target="_blank">&copy; Thunderforest</a>',
  },
}
