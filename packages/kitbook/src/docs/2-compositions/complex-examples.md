# Advanced Composition Use Cases

## Complex User Interaction

Sometimes when building components you need to test interaction even more than mock various component states. To build the `BottomSheet` component found in [svelte-pieces](https://github.com/jacob-8/svelte-pieces) this Composition was very helpful: 

[[complex-examples.BottomSheet.composition]]  

This allowed for quick adjustment of some opening height props such that the component can be tested in a variety of conditions.

Note especially the use of the helper `ShowHide` component. As a Composition is just a Svelte, you can do anything, even use `setContext` in your Composition file.

## Component Conglomeration Recipes

Sometimes you may want to prototype an arrangement of multiple components together without that specific arrangement being used in your app. You just want to place the Composition alongside the document for yourself and fellow team members to be able to reference as a **recipe**. The following example combines a `Map`, `GeoJSONSource`, and `Layer` component from the [Living Dictionaries repo](https://github.com/livingtongues/living-dictionaries) into a display of earthquake clusters.


```svelte title="EarthquakeClusters.composition"
<script lang="ts">
  import Map from '$lib/maps/mapbox/map/Map.svelte'
  import GeoJSONSource from '$lib/maps/mapbox/sources/GeoJSONSource.svelte'
  import Layer from '$lib/maps/mapbox/map/Layer.svelte'

  export let height = 350
  const clustersId = 'clusters'
</script>

<Map let:map>
  <GeoJSONSource
    data="https://docs.mapbox.com/mapbox-gl-js/assets/earthquakes.geojson"
    options={{ cluster: true, clusterMaxZoom: 14, clusterRadius: 50 }}
    let:source>
    <Layer
      id={clustersId}
      options={{
        type: 'circle',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#51bbd6',
            100,
            '#f1f075',
            750,
            '#f28cb1',
          ],
          'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40],
        },
      }}
      on:click={({ detail }) => {
        const features = map.queryRenderedFeatures(detail.point, {
          layers: [clustersId],
        })
        const clusterId = features[0].properties.cluster_id
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err)
            return
          map.easeTo({
            center: features[0].geometry.coordinates,
            zoom,
          })
        })
      }}
      on:mouseenter={() => (map.getCanvas().style.cursor = 'pointer')}
      on:mouseleave={() => (map.getCanvas().style.cursor = '')} />
    <Layer
      options={{
        type: 'symbol',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12,
        },
      }} />
    <Layer
      options={{
        type: 'circle',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#11b4da',
          'circle-radius': 4,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fff',
        },
      }}
      on:click={() => alert('point clicked')}
      on:mouseenter={() => (map.getCanvas().style.cursor = 'pointer')}
      on:mouseleave={() => (map.getCanvas().style.cursor = '')} />
  </GeoJSONSource>
</Map>
```

[//begin]: # "Autogenerated link references for markdown compatibility"
[complex-examples.BottomSheet.composition]: complex-examples.BottomSheet.composition "complex-examples.BottomSheet"
[//end]: # "Autogenerated link references"