---
description: List of available Map Styles
---

# Styles

Additionally to the default [Mapbox referencing of map styles](https://docs.mapbox.com/mapbox-gl-js/style-spec/sources/#vector) you can use one of the following shortcuts.

## Vector Base Maps

```jsx
  <MapGL
    options={{
      accessToken: MAPBOX_ACCESS_TOKEN,
      style: "mb:basic",
    }}
  ></MapGL>
```

### Mapbox

{% tabs %}
{% tab title="Base" %}
* mb:light
* mb:dark
* mb:streets
* mb:outdoor
* mb:sat
* mb:sat-streets
* mb:nav
* mb:nav-night
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
* mb:swiss-ski
* mb:vintage
* mb:whaam
* mb:neon
* mb:camoflauge
* mb:emerald
* mb:runner
* mb:x-ray
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
* stamen:toner-lite
* stamen:watercolor
* stamen:terrain
{% endtab %}

{% tab title="Thunder Forest" %}
To use these maps, get an API key from [Thunder Forest ](https://manage.thunderforest.com/dashboard)and add to the `Source`

* tf:cycle
* tf:trans
* tf:trans-dark
* tf:landscape
* tf:outdoors
* tf:neighbourhood
* tf:spinal
* tf:pioneer
* tf:atlas
* tf:mobile
{% endtab %}
{% endtabs %}
