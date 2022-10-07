---
description: List of available Map Styles
---

# 🗺 Styles

## Vector Base Maps

Additionally to the default [Mapbox referencing of map styles](https://docs.mapbox.com/mapbox-gl-js/style-spec/sources/#vector) you can use one of the following shortcuts.

```jsx
  <MapGL
    options={{ style: "mb:basic" }}
  ></MapGL>
```

### Mapbox

{% tabs %}
{% tab title="Base" %}
* mb:light
* mb:dark
* mb:street
* mb:outdoor
* mb:sat
* mb:sat_street
* mb:nav
* mb:nav_night
{% endtab %}

{% tab title="Map Design" %}
* mb:basic
* mb:monochrome
* mb:leshine
* mb:icecream
* mb:cali
* mb:northstar
* mb:mineral
* mb:moonlight
* mb:frank
* mb:minimo
* mb:decimal
* mb:standard
* mb:blueprint
* mb:bubble
* mb:pencil
{% endtab %}

{% tab title="Community" %}
* mb:swiss_ski
* mb:vintage
* mb:whaam
* mb:neon
* mb:camoflauge
* mb:emerald
* mb:runner
* mb:x_ray
{% endtab %}

{% tab title="HERE Maps" %}
* here:base
* here:day
* here:night
{% endtab %}

{% tab title="Esri" %}
Please check if you can use [esri maps](https://doc.arcgis.com/en/arcgis-online/reference/terms-of-use.htm) here.

 * esri:blueprint
 * esri:charted_territory
 * esri:colored_pencil
 * esri:community
 * esri:mid_century
 * esri:modern_antique
 * esri:nat_geo
 * esri:newspaper
 * esri:open_street_map
 * esri:light_gray_canvas
 * esri:dark_gray_canvas
 * esri:human_geo_light
 * esri:human_geo_dark
 * esri:world_navigation
 * esri:world_street
 * esri:world_street_night
 * esri:world_terrain
 * esri:world_terrain_hybrid
 * esri:world_topographic
 * esri:chromium
 * esri:dreamcatcher
 * esri:seahaven
 * esri:sangria
 * esri:mercurial
 * esri:imagery
 * esri:imagery_hybrid
 * esri:firefly
 * esri:firefly_hybrid
 * esri:oceans
{% endtab %}
{% endtabs %}

## Raster Tile Base Maps

Additionally to the default [Mapbox referencing of raster styles ](https://docs.mapbox.com/mapbox-gl-js/style-spec/sources/#raster)you can use one of the following shortcuts.

```jsx
  <Source
    source={{
      type: "raster",
      tiles: [
        "osm:org",
      ],
      apikey: "..." // only needed for Thunder Forest
    }}
  >
    <Layer
      style={{
        type: "raster",
      }}
    />
  </Source>
```

{% tabs %}
{% tab title="OSM" %}
* osm:org
* osm:human
* osm:cycle
* open:topo
{% endtab %}

{% tab title="Carto" %}
* carto:voyager
* carto:positron
* carto:dark
{% endtab %}

{% tab title="Stamen" %}
* stamen:toner
* stamen:toner_lite
* stamen:watercolor
* stamen:terrain
{% endtab %}

{% tab title="Thunder Forest" %}
To use these maps, get an API key from [Thunder Forest ](https://manage.thunderforest.com/dashboard)and add to the `Source`

* tf:cycle
* tf:trans
* tf:trans_dark
* tf:landscape
* tf:outdoors
* tf:neighbourhood
* tf:spinal
* tf:pioneer
* tf:atlas
* tf:mobile
{% endtab %}
{% endtabs %}
