const mapBase = 'mapbox://styles/mapbox'
const gitBase = 'https://raw.githubusercontent.com'
const gishub = 'https://raw.githubusercontent.com/GIShub4/map-styles/main'

export const vectorStyleList = {
  'mb:light': `${mapBase}/light-v10`,
  'mb:dark': `${mapBase}/dark-v10`,
  'mb:streets': `${mapBase}/streets-v11`,
  'mb:outdoor': `${mapBase}/outdoors-v11`,
  'mb:sat': `${mapBase}/satellite-v9`,
  'mb:sat-streets': `${mapBase}/satellite-streets-v11`,
  'mb:nav': `${mapBase}/navigation-guidance-day-v4`,
  'mb:nav-night': `${mapBase}/navigation-guidance-night-v4`,

  'mb:basic': `${mapBase}/cjf4m44iw0uza2spb3q0a7s41`,
  'mb:monochrome': `${mapBase}/cjv6rzz4j3m4b1fqcchuxclhb`,
  'mb:leshine': `${mapBase}/cjcunv5ae262f2sm9tfwg8i0w`,
  'mb:icecream': `${mapBase}/cj7t3i5yj0unt2rmt3y4b5e32`,
  'mb:cali': `${mapBase}/cjerxnqt3cgvp2rmyuxbeqme7`,
  'mb:northstar': `${mapBase}/cj44mfrt20f082snokim4ungi`,
  'mb:mineral': `${mapBase}/cjtep62gq54l21frr1whf27ak`,
  'mb:moonlight': `${mapBase}/cj3kbeqzo00022smj7akz3o1e`,
  'mb:frank': `${mapBase}-map-design/ckshxkppe0gge18nz20i0nrwq`,
  'mb:minimo': `${mapBase}-map-design/cksjc2nsq1bg117pnekb655h1`,
  'mb:decimal': `${mapBase}-map-design/ck4014y110wt61ctt07egsel6`,
  'mb:standard': `${mapBase}-map-design/ckr0svm3922ki18qntevm857n`,
  'mb:blueprint': `${mapBase}-map-design/cks97e1e37nsd17nzg7p0308g`,
  'mb:bubble': `${mapBase}-map-design/cksysy2nl62zp17quosctdtcc`,
  'mb:pencil': `${mapBase}-map-design/cks9iema71es417mlrft4go2k`,

  'mb:swiss-ski': `${gitBase}/mapbox/mapbox-gl-swiss-ski-style/master/cij1zoclj002y8rkkdjl69psd.json`,
  'mb:vintage': `${gitBase}/mapbox/mapbox-gl-vintage-style/master/cif5p01n202nisaktvljx9mv3.json`,
  'mb:whaam': `${gitBase}/mapbox/mapbox-gl-whaam-style/master/cii8323c8004w0nlvtss3dbm2.json`,
  'mb:neon': `${gitBase}/NatEvatt/awesome-mapbox-gl-styles/master/styles/Neon/style.json`,
  'mb:camoflauge': `${gitBase}/jingsam/mapbox-gl-styles/master/Camouflage.json`,
  'mb:emerald': `${gitBase}/jingsam/mapbox-gl-styles/master/Emerald.json`,
  'mb:runner': `${gitBase}/jingsam/mapbox-gl-styles/master/Runner.json`,
  'mb:x-ray': `${gitBase}/jingsam/mapbox-gl-styles/master/X-ray.json`,

  'esri:blueprint': `${gishub}/esri:blueprint.json`,
  'esri:charted-territory': `${gishub}/esri:charted-territory.json`,
  'esri:colored-pencil': `${gishub}/esri:colored-pencil.json`,
  'esri:community': `${gishub}/esri:community.json`,
  'esri:mid-century': `${gishub}/esri:mid-century.json`,
  'esri:modern-antique': `${gishub}/esri:modern-antique.json`,
  'esri:national-geographic': `${gishub}/esri:national-geographic.json`,
  'esri:newspaper': `${gishub}/esri:newspaper.json`,
  'esri:open-street-map': `${gishub}/esri:open-street-map.json`,
  'esri:light-gray-canvas': `${gishub}/esri:light-gray-canvas.json`,
  'esri:dark-gray-canvas': `${gishub}/esri:dark-gray-canvas.json`,
  'esri:human-geography-light': `${gishub}/esri:human-geography-light.json`,
  'esri:human-geography-dark': `${gishub}/esri:human-geography-dark.json`,
  'esri:world-navigation-map': `${gishub}/esri:world-navigation-map.json`,
  'esri:world-street-map': `${gishub}/esri:world-street-map.json`,
  'esri:world-street-map-night': `${gishub}/esri:world-street-map-night.json`,
  'esri:world-terrain-base': `${gishub}/esri:world-terrain-base.json`,
  'esri:world-topographic-map': `${gishub}/esri:world-topographic-map.json`,
  'esri:chromium': `${gishub}/esri:chromium.json`,
  'esri:dreamcatcher': `${gishub}/esri:dreamcatcher.json`,
  'esri:seahaven': `${gishub}/esri:seahaven.json`,
  'esri:sangria': `${gishub}/esri:sangria.json`,
  'esri:mercurial': `${gishub}/esri:mercurial.json`,
}

export const rasterStyleList = {
  'osm:org': [
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    'Map &copy; <a href="https://www.openstreetmap.org"><em>OpenStreetMap</em></a>',
  ],
  'osm:human': [
    'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    'Map &copy; <a href="http://hot.openstreetmap.org"><em>Humanitarian OpenStreetMap Team</em></a>',
  ],
  'osm:cycle': [
    'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
    'Maps &copy; <a href="https://www.cyclosm.org" target="_blank"><em>CyclOSM</em></a>, Data &copy; <a href="http://www.openstreetmap.org/copyright" target="_blank"><em>OpenStreetMap</em></a>',
  ],
  'carto:voyager': [
    'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}.png',
    'Maps &copy; <a href="https://carto.com/attribution"><em>Carto</em></a>',
  ],
  'carto:positron': [
    'https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png',
    'Maps &copy; <a href="https://carto.com/attribution"><em>Carto</em></a>',
  ],
  'carto:dark': [
    'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png',
    'Maps &copy; <a href="https://carto.com/attribution"><em>Carto</em></a>',
  ],
  'open:topo': [
    'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    'Maps &copy; <a href="https://opentopomap.org/credits"><em>OpenTopoMap</em></a>, Data &copy; <a href="http://www.openstreetmap.org/copyright" target="_blank"><em>OpenStreetMap</em></a>',
  ],
  'stamen:toner': [
    'https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.png',
    'Maps &copy; <a href="https://stamen.com" target="_blank"><em>Stamen Design</em></a>, Data &copy; <a href="http://www.openstreetmap.org/copyright" target="_blank"><em>OpenStreetMap</em></a>',
  ],
  'stamen:toner-lite': [
    'https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png',
    'Maps &copy; <a href="https://stamen.com" target="_blank"><em>Stamen Design</em></a>, Data &copy; <a href="http://www.openstreetmap.org/copyright" target="_blank"><em>OpenStreetMap</em></a>',
  ],
  'stamen:watercolor': [
    'https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg',
    'Maps &copy; <a href="https://stamen.com" target="_blank"><em>Stamen Design</em></a>, Data &copy; <a href="http://www.openstreetmap.org/copyright" target="_blank"><em>OpenStreetMap</em></a>',
  ],
  'stamen:terrain': [
    'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg',
    'Maps &copy; <a href="https://stamen.com" target="_blank"><em>Stamen Design</em></a>, Data &copy; <a href="http://www.openstreetmap.org/copyright" target="_blank"><em>OpenStreetMap</em></a>',
  ],
  'tf:cycle': [
    'https://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}@2x.png?apikey={apikey}',
    'Maps &copy; <a href="https://thunderforest.com" target="_blank"><em>Thunderforest</em></a>, Data &copy; <a href="http://www.openstreetmap.org/copyright" target="_blank"><em>OpenStreetMap</em></a>',
  ],
  'tf:trans': [
    'https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey={apikey}',
    'Maps &copy; <a href="https://thunderforest.com" target="_blank"><em>Thunderforest</em></a>, Data &copy; <a href="http://www.openstreetmap.org/copyright" target="_blank"><em>OpenStreetMap</em></a>',
  ],
  'tf:trans-dark': [
    'https://{s}.tile.thunderforest.com/transport-dark/{z}/{x}/{y}.png?apikey={apikey}',
    'Maps &copy; <a href="https://thunderforest.com" target="_blank"><em>Thunderforest</em></a>, Data &copy; <a href="http://www.openstreetmap.org/copyright" target="_blank"><em>OpenStreetMap</em></a>',
  ],
  'tf:landscape': [
    'https://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey={apikey}',
    'Maps &copy; <a href="https://thunderforest.com" target="_blank"><em>Thunderforest</em></a>, Data &copy; <a href="http://www.openstreetmap.org/copyright" target="_blank"><em>OpenStreetMap</em></a>',
  ],
  'tf:outdoors': [
    'https://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey={apikey}',
    'Maps &copy; <a href="https://thunderforest.com" target="_blank"><em>Thunderforest</em></a>, Data &copy; <a href="http://www.openstreetmap.org/copyright" target="_blank"><em>OpenStreetMap</em></a>',
  ],
  'tf:neighbourhood': [
    'https://{s}.tile.thunderforest.com/neighbourhood/{z}/{x}/{y}.png?apikey={apikey}',
    'Maps &copy; <a href="https://thunderforest.com" target="_blank"><em>Thunderforest</em></a>, Data &copy; <a href="http://www.openstreetmap.org/copyright" target="_blank"><em>OpenStreetMap</em></a>',
  ],
  'tf:spinal': [
    'https://{s}.tile.thunderforest.com/spinal-map/{z}/{x}/{y}.png?apikey={apikey}',
    'Maps &copy; <a href="https://thunderforest.com" target="_blank"><em>Thunderforest</em></a>, Data &copy; <a href="http://www.openstreetmap.org/copyright" target="_blank"><em>OpenStreetMap</em></a>',
  ],
  'tf:pioneer': [
    'https://{s}.tile.thunderforest.com/pioneer/{z}/{x}/{y}.png?apikey={apikey}',
    'Maps &copy; <a href="https://thunderforest.com" target="_blank"><em>Thunderforest</em></a>, Data &copy; <a href="http://www.openstreetmap.org/copyright" target="_blank"><em>OpenStreetMap</em></a>',
  ],
  'tf:atlas': [
    'https://{s}.tile.thunderforest.com/atlas/{z}/{x}/{y}.png?apikey={apikey}',
    'Maps &copy; <a href="https://thunderforest.com" target="_blank"><em>Thunderforest</em></a>, Data &copy; <a href="http://www.openstreetmap.org/copyright" target="_blank"><em>OpenStreetMap</em></a>',
  ],
  'tf:mobile': [
    'https://{s}.tile.thunderforest.com/mobile-atlas/{z}/{x}/{y}.png?apikey={apikey}',
    'Maps &copy; <a href="https://thunderforest.com" target="_blank"><em>Thunderforest</em></a>, Data &copy; <a href="http://www.openstreetmap.org/copyright" target="_blank"><em>OpenStreetMap</em></a>',
  ],
}
